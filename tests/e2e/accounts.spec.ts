import { expect, test } from "@playwright/test";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

test("registers a user, creates an account and shows its opening balance", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `e2e-${Date.now()}@example.test`;

  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Usuario E2E", email });
  await page.goto("/accounts");
  await expect(page).toHaveURL(/\/accounts$/);
  await page.getByRole("link", { name: "Crear cuenta" }).click();

  await page.getByLabel("Nombre de la cuenta").fill("Cuenta E2E");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("1000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole("heading", { name: "Cuenta E2E" })).toBeVisible();
  await page.locator(".account-card", { hasText: "Cuenta E2E" }).getByRole("link", { name: /Ver cuenta/ }).click();
  await expect(page.getByText("ARS 1.000,00").first()).toBeVisible();

  await context.close();
});

test("creates an expense category and uses it as a parent in the category form", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `category-e2e-${Date.now()}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Categorías E2E", email });

  await page.goto("/settings/categories");
  await page.getByLabel("Nombre").fill("Alimentación");
  await page.getByRole("radio", { name: "Gasto" }).check();
  await page.getByRole("button", { name: "Crear categoría" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Alimentación" })).toBeVisible();

  await page.getByLabel("Nombre").fill("Restaurantes");
  await page.getByLabel("Categoría padre").selectOption({ label: "Alimentación" });
  await page.getByRole("button", { name: "Crear categoría" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Restaurantes" })).toBeVisible();

  await context.close();
});

test("creates income and expense movements from the UI", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `ledger-e2e-${Date.now()}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Ledger E2E", email });
  const today = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta Ledger");
  await page.getByLabel("Saldo inicial").fill("1000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await page.goto("/settings/categories");
  await page.getByLabel("Nombre").fill("Gastos generales");
  await page.getByRole("radio", { name: "Gasto" }).check();
  await page.getByRole("button", { name: "Crear categoría" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Gastos generales" })).toBeVisible();

  await page.goto("/transactions/new?type=INCOME");
  await page.getByLabel("Monto").fill("500");
  await page.getByLabel("Descripción").fill("Ingreso E2E");
  await page.getByLabel("Fecha").fill(today);
  await page.getByRole("button", { name: "Registrar ingreso" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Ingreso E2E")).toBeVisible();

  await page.goto("/transactions/new?type=EXPENSE");
  await page.getByLabel("Monto").fill("200");
  await page.getByLabel("Categoría").selectOption({ label: "Gastos generales" });
  await page.getByLabel("Descripción").fill("Gasto E2E");
  await page.getByLabel("Fecha").fill(today);
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Gasto E2E")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("ARS 1.300,00").first()).toBeVisible();
  await expect(page.getByText("ARS 500,00").first()).toBeVisible();
  await expect(page.getByText("ARS 200,00").first()).toBeVisible();

  await page.goto("/transactions");
  await page.getByRole("link", { name: "Gasto E2E" }).click();
  await page.getByRole("button", { name: "Anular movimiento" }).click();
  await page.getByRole("button", { name: "Confirmar anulación" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Gasto E2E")).toBeVisible();
  await page.goto("/accounts");
  await page.locator(".account-card", { hasText: "Cuenta Ledger" }).getByRole("link", { name: /Ver cuenta/ }).click();
  await expect(page.getByText("ARS 1.500,00").first()).toBeVisible();

  await context.close();
});

test("creates and voids a same-currency transfer as one logical movement", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `transfer-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Transfer E2E", email });
  for (const name of ["Banco E2E", "Efectivo E2E"]) {
    await page.goto("/accounts/new");
    await page.getByLabel("Nombre de la cuenta").fill(name);
    await page.getByLabel("Tipo").selectOption(name.startsWith("Banco") ? "BANK" : "CASH");
    await page.getByLabel("Saldo inicial").fill(name.startsWith("Banco") ? "1000" : "100");
    await page.getByLabel("Fecha de apertura").fill("2026-01-01");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  await page.goto("/transfers/new");
  await page.getByLabel("Desde").selectOption({ label: "Banco E2E · ARS" });
  await page.getByLabel("Hacia").selectOption({ label: "Efectivo E2E · ARS" });
  await page.getByLabel("Monto").fill("200");
  await page.getByRole("button", { name: "Transferir" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await page.getByRole("link", { name: "Transferencia" }).click();
  await page.getByRole("button", { name: "Anular transferencia" }).click();
  await page.getByRole("button", { name: "Confirmar anulación" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Transferencia").first()).toBeVisible();
  await context.close();
});

test("generates and edits an installment preview without persisting it", async ({ page }) => {
  await page.goto("/debts/new");
  await page.getByLabel("Total a pagar").fill("100");
  await page.getByLabel("Cantidad de cuotas").fill("3");
  await page.getByLabel("Primer vencimiento").fill("2026-01-31");
  await page.getByRole("button", { name: "Generar preview" }).click();
  await expect(page.getByRole("region", { name: "Preview de cuotas" })).toBeVisible();
  await expect(page.getByLabel("Importe cuota 3")).toHaveValue("33.34");
  await page.getByLabel("Importe cuota 3").fill("33.35");
  await page.getByRole("button", { name: "Validar preview" }).click();
  await expect(page.getByText("INSTALLMENT_TOTAL_MISMATCH")).toBeVisible();
});

test("confirms a reviewed debt and inspects its installments", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Debt E2E", email: `debt-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test` });
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta pago deuda");
  await page.getByLabel("Saldo inicial").fill("500");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.goto("/debts/new");
  await page.getByLabel("Nombre").fill("Préstamo E2E");
  await page.getByRole("button", { name: "Generar preview" }).click();
  await page.getByRole("button", { name: "Validar preview" }).click();
  await page.getByRole("button", { name: "Confirmar deuda" }).click();
  await expect(page).toHaveURL(/\/debts$/);
  await expect(page.getByText("Préstamo E2E")).toBeVisible();
  await page.getByRole("link", { name: "Préstamo E2E" }).click();
  await expect(page.getByRole("heading", { name: "Préstamo E2E" })).toBeVisible();
  await page.getByLabel("Monto").fill("50");
  await page.getByRole("button", { name: "Confirmar pago" }).click();
  await expect(page).toHaveURL(/\/debts\//);
  await expect(page.getByText("ARS 50.00")).toBeVisible();
  await context.close();
});
