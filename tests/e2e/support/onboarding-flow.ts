import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// TASK-064: no page under (app) is reachable anymore until onboarding is COMPLETED and access is
// active — every E2E flow now has to walk through profile onboarding (and, unless the test
// pre-provisions access itself, choose Trial) before it can do anything else. These helpers are
// the one place that walk, so every spec stays focused on its own actual assertions.

export async function signUp(request: APIRequestContext, baseURL: string, input: { name: string; email: string }): Promise<void> {
  const response = await request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: input.name, email: input.email, password: "UnaPasswordSegura123!", rememberMe: true },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

// Walks all six onboarding steps with the minimum valid input, declining every optional
// question/consent along the way. Ends wherever the (app) layout's routing guard sends the user
// next — /elegir-acceso for a brand-new user, /onboarding/financial-onboarding or /dashboard for a
// user whose access was already provisioned directly in the database before this ran.
export async function completeProfileOnboarding(page: Page): Promise<void> {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding\/welcome$/);
  await page.getByRole("button", { name: "Comenzar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/basic-profile$/);
  await page.getByLabel("País (código de 2 letras)").fill("AR");
  await page.getByLabel("Moneda principal").selectOption("ARS");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/goal$/);
  await page.getByLabel("Tu objetivo principal").selectOption("SAVE_MORE");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/financial-context$/);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/statistical-profile$/);
  await page.getByRole("button", { name: "Ahora no" }).click();

  await expect(page).toHaveURL(/\/onboarding\/privacy-consent$/);
  await page.getByRole("button", { name: "Continuar sin aceptar" }).click();
}

// From /elegir-acceso, chooses the free trial and lands on /onboarding/financial-onboarding.
export async function chooseTrial(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/elegir-acceso$/);
  await page.getByRole("button", { name: "Comenzar prueba gratuita" }).click();
  await expect(page).toHaveURL(/\/onboarding\/financial-onboarding$/);
}

// Fills and submits the financial-onboarding first-account form (same underlying CreateAccount
// service the standalone Accounts feature uses), landing on /dashboard. Whatever name is passed
// here is just the mandatory "first account" placeholder — tests that need specific accounts for
// their own assertions create additional ones afterward via the normal Accounts feature.
export async function completeFinancialOnboarding(page: Page, accountName = "Cuenta inicial"): Promise<void> {
  await expect(page).toHaveURL(/\/onboarding\/financial-onboarding$/);
  await page.getByLabel("Nombre de la cuenta").fill(accountName);
  await page.getByLabel("Saldo inicial").fill("0");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear mi primera cuenta" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// The single composite most specs need: sign up, walk profile onboarding, choose Trial, and
// create the mandatory first account — ending on /dashboard with full TRIAL access, ready for
// whatever the test actually wants to do next.
export async function signUpCompleteOnboardingAndStartTrial(page: Page, baseURL: string, input: { name: string; email: string }): Promise<void> {
  await signUp(page.request, baseURL, input);
  await completeProfileOnboarding(page);
  await chooseTrial(page);
  await completeFinancialOnboarding(page);
}
