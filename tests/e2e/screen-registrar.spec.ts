import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-10 — Registrar (Quick Add) against docs/visual/10-registrar-product-ui-spec-extreme.md.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Reg ${tag}`,
    email: `reg-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);
}

async function openQuickAdd(page: Page) {
  await page.goto("/app");
  await page.getByRole("button", { name: "Registrar", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("§4.2 the type picker has Gasto/Ingreso plus 'Importar movimientos' (transferencias y obligaciones viven en su propia superficie)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "picker");
  await createAccount(page, "Galicia");

  await openQuickAdd(page);
  const dialog = page.getByRole("dialog");
  for (const label of ["Gasto", "Ingreso"]) {
    await expect(dialog.getByRole("tab", { name: label })).toBeVisible();
  }
  for (const gone of ["Transferencia", "Obligación"]) {
    await expect(dialog.getByRole("tab", { name: gone })).toHaveCount(0);
  }
  await expect(dialog.getByRole("button", { name: "Importar movimientos" })).toBeVisible();
  await dialog.getByRole("button", { name: "Importar movimientos" }).click();
  await expect(page).toHaveURL(/\/settings\/imports$/);

  await context.close();
});

test("§7.3 the amount shows the account currency and §8.6 the date defaults to today, capped at today", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "fields");
  await createAccount(page, "Galicia");

  await openQuickAdd(page);
  const dialog = page.getByRole("dialog");

  // §7.3 — currency adornment on the amount input.
  await expect(dialog.getByText("ARS", { exact: true }).first()).toBeVisible();

  // §8.2/§8.6 — the Fecha field exists, is a real date input defaulting to today, never future.
  const date = dialog.getByLabel("Fecha");
  await expect(date).toBeVisible();
  const today = new Date().toISOString().slice(0, 10);
  await expect(date).toHaveAttribute("max", today);
  expect(await date.inputValue()).toBe(today);

  await context.close();
});

test("§8.6 a back-dated expense lands in the month it happened, not the current month", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "backdate");
  await createAccount(page, "Galicia");

  await openQuickAdd(page);
  const dialog = page.getByRole("dialog");
  // Wait for the mount effects to settle (they reset the form once) before typing.
  await expect(dialog.getByLabel("Fecha")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  await dialog.getByLabel(/¿En qué\?/).fill("Gasto viejo");
  await dialog.getByLabel("Fecha").fill("2026-06-15");
  await dialog.getByLabel("Monto").fill("12345");
  // The amount input formats thousands as it's typed.
  await expect(dialog.getByLabel("Monto")).toHaveValue("12.345");
  await dialog.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page.getByText(/registré el gasto/i)).toBeVisible({ timeout: 10000 });

  await page.goto("/transactions?period=2026-06");
  await expect(page.getByText("Gasto viejo")).toBeVisible();
  await page.goto("/transactions?period=2026-09");
  await expect(page.getByText("Gasto viejo")).toHaveCount(0);

  await context.close();
});
