import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// FOLLOWUP — subvistas de Reportes contra su spec: Flujo de caja §12 (dos dominios REAL /
// PROYECTADO) y Patrimonio §13 (por moneda, sin combinar).

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Sub ${tag}`,
    email: `sub-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string, currency: string, balance = "500000") {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption(currency === "ARS" ? "BANK" : "SAVINGS");
  await page.getByLabel("Moneda").selectOption(currency);
  await page.getByLabel("Saldo inicial").fill(balance);
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

test("§12 Flujo de caja separates the confirmed history from the 30-day projection", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "cf");
  await createAccount(page, "Galicia", "ARS");

  await page.goto("/reports/cash-flow");
  await expect(page.getByRole("heading", { name: /Confirmado · últimos 6 meses/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Proyección · próximos \d+ días/ })).toBeVisible();
  await expect(page.getByText("No es dinero confirmado.")).toBeVisible();

  const projection = page.getByRole("region", { name: "Proyección de saldo" });
  await expect(projection.getByText("Saldo hoy")).toBeVisible();
  await expect(projection.getByText("Saldo proyectado")).toBeVisible();
});

test("§13 Patrimonio breaks down by currency and never fuses a total", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "nw");
  await createAccount(page, "Galicia", "ARS", "800000");
  await createAccount(page, "Wise", "USD", "1200");

  await page.goto("/reports/net-worth");
  await expect(page.getByRole("region", { name: "Patrimonio en ARS" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Patrimonio en USD" })).toBeVisible();
  await expect(page.getByText(/no se combinan sin una conversión explícita/i)).toBeVisible();
  // Two "Patrimonio neto" cards (one per currency), never a single fused figure.
  await expect(page.getByText("Patrimonio neto")).toHaveCount(2);
});

test("Gastos e Ingresos ya no son pestañas propias: /transactions/expenses redirige a Movimientos con el chip de gastos", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "typed");
  await createAccount(page, "Galicia", "ARS");
  await movement(page, "INCOME", "Galicia", "800000", "Sueldo");
  await movement(page, "EXPENSE", "Galicia", "34000", "Nafta");

  await page.goto("/transactions/expenses");
  await expect(page).toHaveURL(/\/transactions\?type=EXPENSE$/);
  await expect(page.getByRole("heading", { level: 1, name: "Transacciones" })).toBeVisible();
  // The "Gastos" chip is pre-selected, so only the expense is listed.
  await expect(page.getByRole("button", { name: "Gastos" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Nafta")).toBeVisible();
  await expect(page.getByText("Sueldo")).toHaveCount(0);

  // Switching the chip back to "Todos" reveals the income again — no page reload needed.
  await page.getByRole("button", { name: "Todos" }).click();
  await expect(page.getByText("Sueldo")).toBeVisible();

  await page.goto("/transactions/income");
  await expect(page).toHaveURL(/\/transactions\?type=INCOME$/);
});
