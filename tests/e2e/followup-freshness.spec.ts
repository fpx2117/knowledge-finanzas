import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// FOLLOWUP — callout de calidad/frescura de datos (spec 01 §7.2/§17, spec 04 §9.9).

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Fr ${tag}`,
    email: `fr-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("the dashboard shows how fresh the data is, and flags uncategorized movements", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "dash");

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Galicia");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill("12000");
  await page.locator("#description").fill("Sin categorizar");
  await page.locator("#accountId").selectOption({ label: "Galicia" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.goto("/app");
  await expect(page.getByText(/Datos hasta el/)).toBeVisible();
  await expect(page.getByRole("link", { name: /1 movimiento sin categoría/ })).toBeVisible();
});

test("Presupuestos shows the data-freshness note (§9.9)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "bud");

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Galicia");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  await page.goto("/budgets/new");
  await page.locator("#limitAmount").fill("50000");
  await page.getByRole("button", { name: /Crear presupuesto/ }).click();
  await expect(page).toHaveURL(/\/budgets$/, { timeout: 10000 });

  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill("8000");
  await page.locator("#description").fill("Compra");
  await page.locator("#accountId").selectOption({ label: "Galicia" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.goto("/budgets");
  await expect(page.getByText(/Datos hasta el/)).toBeVisible();
});

test("Cuentas shows the last-movement date per account (§13.3)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "acc");

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Galicia");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  // No movements yet.
  await page.goto("/accounts");
  await expect(page.getByText("Sin movimientos")).toBeVisible();

  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill("9000");
  await page.locator("#description").fill("Compra");
  await page.locator("#accountId").selectOption({ label: "Galicia" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.goto("/accounts");
  await expect(page.getByText(/Últ\. mov\./)).toBeVisible();
});
