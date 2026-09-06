import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-E2E-JOURNEYS (spec 14 §39.3) — critical cross-module financial journeys, end to end through
// the real UI. AI is disabled in the E2E env, so these also prove the core works without AI.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Journey ${tag}`,
    email: `journey-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string, opening: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill(opening);
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole("link", { name, exact: true }).first()).toBeVisible();
}

test("registrar un gasto se refleja en el saldo total", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "expense");

  await createAccount(page, "Caja de ahorro", "100000");

  await page.goto("/transactions/new?type=EXPENSE");
  await expect(page.getByRole("button", { name: "Registrar gasto" })).toBeEnabled();
  await page.locator("#amount").fill("15000");
  await page.locator("#description").fill("Compra supermercado");
  await page.locator("#accountId").selectOption({ label: "Caja de ahorro" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  // The movement is in the ledger.
  await expect(page.getByText("Compra supermercado").first()).toBeVisible({ timeout: 10000 });

  // Saldo total = 100.000 − 15.000 = 85.000 (not period-scoped).
  await expect(async () => {
    await page.goto("/app");
    await expect(page.getByText(/85\.000/).first()).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15000 });

  await context.close();
});

test("una transferencia entre cuentas propias mueve ambos saldos y no cuenta como gasto", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "transfer");

  await createAccount(page, "Origen", "50000");
  await createAccount(page, "Destino", "0");

  await page.goto("/transactions/transfers/new");
  await page.locator("#fromAccountId").selectOption({ label: "Origen · ARS" });
  await page.locator("#toAccountId").selectOption({ label: "Destino · ARS" });
  await page.locator("#amount").fill("20000");
  await page.getByRole("button", { name: "Transferir" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await expect(async () => {
    await page.goto("/accounts");
    await expect(page.getByText(/30\.000/).first()).toBeVisible({ timeout: 1000 }); // Origen
    await expect(page.getByText(/20\.000/).first()).toBeVisible({ timeout: 1000 }); // Destino
  }).toPass({ timeout: 15000 });

  // The movements list has no income/expense row for the transfer (§10).
  await page.goto("/transactions");
  await expect(page.getByRole("heading", { name: "Transacciones" })).toBeVisible();
  await expect(page.getByText("Origen → Destino")).toHaveCount(0);

  await context.close();
});

test("un aporte a una meta deriva el progreso y queda en el historial", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "goal");

  await page.goto("/goals/new");
  await page.getByLabel("Nombre de la meta").fill("Vacaciones");
  await page.getByLabel("Categoría").selectOption("TRAVEL");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Monto objetivo").fill("1000000");
  await page.getByRole("button", { name: /Crear meta/ }).click();
  await expect(page.getByRole("link", { name: "Vacaciones" }).first()).toBeVisible({ timeout: 10000 });

  await page.getByRole("link", { name: "Vacaciones" }).first().click();
  await expect(page).toHaveURL(/\/goals\/[0-9a-f-]+$/);

  await page.getByRole("button", { name: "Registrar ahorro" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Monto/).fill("250000");
  await dialog.getByRole("button", { name: "Registrar", exact: true }).click();

  await expect(async () => {
    await page.reload();
    await expect(page.getByText(/25%/).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });

  await expect(page.getByRole("heading", { name: "Historial" })).toBeVisible();
  await expect(page.getByText("Aporte").first()).toBeVisible();

  await context.close();
});
