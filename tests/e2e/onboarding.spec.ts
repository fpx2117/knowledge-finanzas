import { expect, test } from "@playwright/test";

test("full onboarding flow: welcome → basic config → goal → financial context → (skip) statistical profile → (decline) consent → completed", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `onboarding-full-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  const response = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: "Onboarding E2E", email, password: "UnaPasswordSegura123!", rememberMe: true },
  });
  expect(response.ok(), await response.text()).toBeTruthy();

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
  // Leave every question unanswered — the whole step is skippable.
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/statistical-profile$/);
  await page.getByRole("button", { name: "Ahora no" }).click();

  await expect(page).toHaveURL(/\/onboarding\/privacy-consent$/);
  await page.getByRole("button", { name: "Continuar sin aceptar" }).click();

  // Onboarding completed with no access chosen yet — routed to access selection (TASK-064).
  await expect(page).toHaveURL(/\/elegir-acceso$/);
  await expect(page.getByRole("heading", { name: "Todavía no tenés acceso activo." })).toBeVisible();

  await context.close();
});

test("abandon at the goal step, return later, resume exactly there", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `onboarding-resume-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  const response = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: "Onboarding Resume E2E", email, password: "UnaPasswordSegura123!", rememberMe: true },
  });
  expect(response.ok(), await response.text()).toBeTruthy();

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "Comenzar" }).click();
  await page.getByLabel("País (código de 2 letras)").fill("AR");
  await page.getByLabel("Moneda principal").selectOption("ARS");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/onboarding\/goal$/);

  // Abandon here (navigate away without submitting the goal step) and come back later.
  await page.goto("/app");
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/onboarding\/goal$/);

  await context.close();
});
