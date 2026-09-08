import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-08 — Reportes / Panorama against docs/visual/08-reportes-product-ui-spec-extreme.md §9.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Rep ${tag}`,
    email: `rep-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string, currency: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption(currency);
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);
}

async function movement(page: Page, type: "EXPENSE" | "INCOME", account: string, amount: string, description: string) {
  await page.goto(`/transactions/new?type=${type}`);
  await page.locator("#amount").fill(amount);
  await page.locator("#description").fill(description);
  await page.locator("#accountId").selectOption({ label: account });
  await page.getByRole("button", { name: type === "EXPENSE" ? "Registrar gasto" : "Registrar ingreso" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
}

test("§9.2 KPIs are Ingresos / Gastos / Resultado neto / Tasa de ahorro simple, and the rate is '—' with no income (§5.4)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "kpis");
  await createAccount(page, "Galicia", "ARS");
  await movement(page, "EXPENSE", "Galicia", "15000", "Compra");

  await page.goto("/reports");
  const kpis = page.getByRole("region", { name: "Indicadores del período" });
  await expect(kpis.getByText("Ingresos", { exact: true })).toBeVisible();
  await expect(kpis.getByText("Gastos", { exact: true })).toBeVisible();
  await expect(kpis.getByText("Resultado neto")).toBeVisible();
  await expect(kpis.getByText("Tasa de ahorro simple")).toBeVisible();
  // §5.4 — no confirmed income → no misleading 0%.
  await expect(kpis.getByText("—")).toBeVisible();
  await expect(kpis.getByText("0%")).toHaveCount(0);

  // §9.9 — a single movement is not enough to claim a trend.
  await expect(page.getByText(/no hay suficientes movimientos/i)).toBeVisible();

  await context.close();
});

test("§9.6 'Principales ingresos' and §9.7 'Resultado por período' render, and the trend reading appears once there is enough data", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "blocks");
  await createAccount(page, "Galicia", "ARS");

  await movement(page, "INCOME", "Galicia", "800000", "Sueldo");
  // Distinct amounts so the create-time duplicate guard doesn't flag them.
  for (let i = 0; i < 5; i += 1) {
    await movement(page, "EXPENSE", "Galicia", `${20000 + i * 1000}`, `Gasto ${i}`);
  }

  await page.goto("/reports");
  await expect(page.getByText("Principales ingresos")).toBeVisible();
  await expect(page.getByText("Resultado por período")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Resultado" })).toBeVisible();
  await expect(page.getByText("Lectura del mes")).toBeVisible();
  await expect(page.getByText(/no hay suficientes movimientos/i)).toHaveCount(0);

  await context.close();
});
