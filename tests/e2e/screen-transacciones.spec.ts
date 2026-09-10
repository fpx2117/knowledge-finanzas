import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-03 — Transacciones against docs/visual/03-transacciones-product-ui-spec-extreme.md.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Txn ${tag}`,
    email: `txn-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string, currency: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption(currency === "ARS" ? "BANK" : "SAVINGS");
  await page.getByLabel("Moneda").selectOption(currency);
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);
}

async function expense(page: Page, account: string, amount: string, description: string) {
  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill(amount);
  await page.locator("#description").fill(description);
  await page.locator("#accountId").selectOption({ label: account });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
}

test("header is 'Transacciones / Todos los movimientos' and Registrar opens Quick Add (§9.2)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "header");
  await createAccount(page, "Galicia", "ARS");

  await page.goto("/transactions");
  await expect(page.getByRole("heading", { level: 1, name: "Transacciones" })).toBeVisible();
  await expect(page.getByText("Todos los movimientos")).toBeVisible();

  await page.getByRole("button", { name: "Registrar", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/transactions$/);

  await context.close();
});

test("the period summary is 3 KPIs in one currency, and splits per currency with no merged total in two (§9.3)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "summary");
  await createAccount(page, "Galicia", "ARS");
  await createAccount(page, "Wise", "USD");

  await expense(page, "Galicia", "15000", "Compra ARS");

  await page.goto("/transactions");
  const summary = page.getByRole("region", { name: "Resumen del período" });
  await expect(summary.getByText("Total de ingresos")).toBeVisible();
  await expect(summary.getByText("Total de gastos")).toBeVisible();
  await expect(summary.getByText("Balance")).toBeVisible();

  // Add a USD expense in the same period → the summary must split, never show one merged number.
  await expense(page, "Wise", "20", "Compra USD");
  await page.goto("/transactions");
  await expect(summary.getByText("ARS · este período")).toBeVisible();
  await expect(summary.getByText("USD · este período")).toBeVisible();
  // Per-currency blocks repeat the labels, so there must be one "Total de ingresos" per currency.
  await expect(summary.getByText("Total de ingresos")).toHaveCount(2);

  await context.close();
});
