import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// FOLLOWUP — variación vs. período anterior en Reportes (spec 08 §9.3 / §15 / §10.3).

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Cmp ${tag}`,
    email: `cmp-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function expenseOn(page: Page, account: string, amount: string, description: string, date: string) {
  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill(amount);
  await page.locator("#description").fill(description);
  await page.locator("#accountId").selectOption({ label: account });
  await page.locator("#occurredAt").fill(date);
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
}

test("Reportes shows the month-over-month delta on the KPIs", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "delta");

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Galicia");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("900000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 10);
  const current = `${thisMonth}-05`;

  await expenseOn(page, "Galicia", "10000", "Gasto viejo", prev);
  await expenseOn(page, "Galicia", "30000", "Gasto nuevo", current);

  await page.goto("/reports");
  const kpis = page.getByRole("region", { name: "Indicadores del período" });
  // 30k this month vs 10k last month = +200%.
  await expect(kpis.getByText(/\+200% vs\./)).toBeVisible();

  await page.goto("/reports/expenses");
  await expect(page.getByRole("region", { name: "Resumen de gastos" }).getByText(/\+200% vs\./)).toBeVisible();
});
