import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-04 — Presupuestos against docs/visual/04-presupuestos-product-ui-spec-extreme.md.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Presup ${tag}`,
    email: `presup-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("empty state names the month and offers to create a budget (§9.2)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "empty");

  await page.goto("/budgets");
  await expect(page.getByRole("heading", { level: 1, name: "Presupuestos" })).toBeVisible();
  await expect(page.getByText("Controlá cuánto querés gastar y cómo viene el mes.")).toBeVisible();
  await expect(page.getByText(/Todavía no configuraste un presupuesto para/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Crear presupuesto" })).toBeVisible();

  await context.close();
});

test("with a budget: KPIs use the spec terms and the month nav does not go into the future (§9.2, §9.3)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "kpis");

  // Seed a category + budget + one expense.
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Caja");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("500000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  await page.goto("/budgets/new");
  await page.locator("#limitAmount").fill("50000");
  await page.getByRole("button", { name: /Crear presupuesto/ }).click();
  await expect(page).toHaveURL(/\/budgets$/);

  await page.goto("/budgets");
  const summary = page.getByRole("region", { name: "Resumen de presupuestos" });
  await expect(summary.getByText("Presupuestado")).toBeVisible();
  await expect(summary.getByText("Gastado")).toBeVisible();
  await expect(summary.getByText("Restante")).toBeVisible();
  await expect(summary.getByText("En atención")).toBeVisible();

  // The month nav's "next" arrow is disabled at the current month (no budgeting the future).
  await expect(page.getByRole("button", { name: "Mes siguiente" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Mes anterior" })).toBeEnabled();
  await expect(async () => {
    await page.getByRole("button", { name: "Mes anterior" }).click();
    await expect(page).toHaveURL(/period=\d{4}-\d{2}/, { timeout: 3000 });
  }).toPass({ timeout: 15000 });

  await context.close();
});
