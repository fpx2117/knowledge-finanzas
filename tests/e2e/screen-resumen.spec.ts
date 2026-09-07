import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-01 — Resumen / Dashboard against docs/visual/01-resumen-product-ui-spec-extreme.md.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Resumen ${tag}`,
    email: `resumen-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("the header is 'Resumen' with a dated subtitle and a Registrar CTA that opens Quick Add (§7)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "header");

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Caja");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("100000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1, name: "Resumen" })).toBeVisible();
  await expect(page.getByText(/Tu situación financiera al /)).toBeVisible();

  // §6.2 density — exactly 3 primary KPI cards.
  await expect(page.getByRole("region", { name: "Indicadores principales" }).getByRole("heading", { level: 3 })).toHaveCount(0);
  await expect(page.locator('[aria-label="Indicadores principales"] >> text=Saldo total')).toBeVisible();
  await expect(page.getByText("Dinero disponible")).toBeVisible();
  await expect(page.getByText("Resultado del período")).toBeVisible();

  // §7.2 — Registrar opens the Quick Add flow (not a navigation).
  await page.getByRole("button", { name: "Registrar", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/app$/);

  await context.close();
});

test("the Metas section shows active goals and the Para vos section is present (§15, §16)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "goals");

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Caja");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("100000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  // No goals yet → the §15.4 empty state.
  await page.goto("/app");
  const metas = page.getByRole("region", { name: "Metas y observaciones" });
  await expect(metas.getByText("Sin metas")).toBeVisible();
  await expect(metas.getByText("Para vos")).toBeVisible();

  // Create a goal → it shows on the dashboard with its progress.
  await page.goto("/goals/new");
  await page.getByLabel("Nombre de la meta").fill("Vacaciones");
  await page.getByLabel("Categoría").selectOption("TRAVEL");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Monto objetivo").fill("1000000");
  await page.getByLabel("Ya tengo ahorrado").fill("250000");
  await page.getByRole("button", { name: /Crear meta/ }).click();

  await expect(async () => {
    await page.goto("/app");
    await expect(metas.getByRole("link", { name: "Vacaciones" })).toBeVisible({ timeout: 2000 });
    await expect(metas.getByText("25%")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20000 });

  await context.close();
});
