import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-02 — Cuentas against docs/visual/02-cuentas-product-ui-spec-extreme.md.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Cuentas ${tag}`,
    email: `cuentas-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string, currency: string, opening: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption(currency === "ARS" ? "BANK" : "SAVINGS");
  await page.getByLabel("Moneda").selectOption(currency);
  await page.getByLabel("Saldo inicial").fill(opening);
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);
}

test("one currency shows a single balance; two currencies show balances per currency, never a merged total (§12.3)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "multicur");

  await createAccount(page, "Galicia", "ARS", "100000");
  await page.goto("/accounts");
  // Per-currency totals live in the KPI row and nowhere else on the screen.
  const kpis = page.getByRole("region", { name: "Indicadores de cuentas" });
  await expect(kpis.getByText("Total en ARS")).toBeVisible();
  await expect(kpis.getByText(/cuenta activa/)).toBeVisible();
  await expect(kpis.getByText("Total en USD")).toHaveCount(0);

  await createAccount(page, "Wise", "USD", "500");
  await page.goto("/accounts");
  // Now multi-currency: a total PER currency, never a merged one.
  await expect(kpis.getByText("Total en ARS")).toBeVisible();
  await expect(kpis.getByText("Total en USD")).toBeVisible();

  await context.close();
});

test("archived accounts are hidden until 'Ver archivadas', and the header uses the spec copy (§12.2, §12.4)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "archived");

  await createAccount(page, "Activa", "ARS", "1000");
  await createAccount(page, "Vieja", "ARS", "0");

  await page.goto("/accounts");
  await expect(page.getByRole("heading", { level: 1, name: "Cuentas" })).toBeVisible();
  await expect(page.getByText("Administrá dónde está tu dinero y revisá qué movimientos explican cada saldo.")).toBeVisible();

  // Archive "Vieja".
  await page.getByRole("link", { name: "Vieja", exact: true }).first().click();
  await page.getByRole("button", { name: "Archivar", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Archivar cuenta" }).click();
  await expect(async () => {
    await page.goto("/accounts");
    await expect(page.getByText(/Ver archivadas/)).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });

  // The screen has a single account listing — archived accounts fold in behind a toggle,
  // not a second table.
  const listing = page.getByRole("region", { name: "Listado de cuentas" });
  await expect(listing).not.toContainText("Vieja");
  // Toggle reveals it.
  await listing.getByRole("button", { name: /Ver archivadas/ }).click();
  await expect(listing).toContainText("Vieja");

  await context.close();
});
