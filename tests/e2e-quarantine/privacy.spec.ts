import { expect, test } from "@playwright/test";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

test("user leaves the entire statistical profile empty and saves — core product is completely unaffected", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `privacy-empty-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Privacy Empty E2E", email });

  // Core product first — creating an account never requires touching privacy settings at all.
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta privacidad");
  await page.getByLabel("Saldo inicial").fill("500");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  // Now visit the privacy settings page and save with every field left at "Sin responder".
  await page.goto("/settings/privacy");
  await expect(page.getByText("Perfil estadístico (opcional)")).toBeVisible();
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByText("Perfil guardado.")).toBeVisible();

  // Core product still works normally afterward.
  await page.goto("/accounts");
  await expect(page.getByRole("heading", { name: "Cuenta privacidad" })).toBeVisible();

  await context.close();
});

test("user opts into analytics consent, later withdraws it, and the receipt reflects the withdrawal", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `privacy-consent-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Privacy Consent E2E", email });
  await page.goto("/settings/privacy");

  // Defaults to off — never pre-checked (Security Requirement).
  await expect(page.getByText("Analítica de producto").locator("..").getByText("No otorgado")).toBeVisible();

  await page.getByText("Analítica de producto").locator("..").getByRole("button", { name: "Otorgar consentimiento" }).click();
  await expect(page.getByText("Analítica de producto").locator("..").getByText("Otorgado", { exact: true })).toBeVisible();

  await page.getByText("Analítica de producto").locator("..").getByRole("button", { name: "Retirar consentimiento" }).click();
  await expect(page.getByText("Analítica de producto").locator("..").getByText("No otorgado")).toBeVisible();

  await context.close();
});
