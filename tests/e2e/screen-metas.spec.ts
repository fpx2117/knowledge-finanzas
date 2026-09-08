import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-07 — Metas against docs/visual/07-metas-product-ui-spec-extreme.md §8–9.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Meta ${tag}`,
    email: `meta-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createGoal(page: Page, name: string, currency: string, target: string) {
  await page.goto("/goals/new");
  await page.getByLabel("Nombre de la meta").fill(name);
  await page.getByLabel("Categoría").selectOption("TRAVEL");
  await page.getByLabel("Moneda").selectOption(currency);
  await page.getByLabel("Monto objetivo").fill(target);
  await page.getByRole("button", { name: /Crear meta/ }).click();
  await page.waitForURL(/\/goals(\/[0-9a-f-]+)?$/, { timeout: 10000 });
}

test("the list has the Todas/Activas/Completadas tabs and the §8.3 summary terms", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "tabs");

  await createGoal(page, "Vacaciones", "ARS", "1000000");

  await page.goto("/goals");
  const main = page.locator("#main-content");
  await expect(main.getByRole("link", { name: "Todas", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Activas", exact: true })).toBeVisible();
  await expect(main.getByRole("link", { name: "Completadas", exact: true })).toBeVisible();

  const summary = page.getByRole("region", { name: "Resumen de metas" });
  await expect(summary.getByText("Metas activas")).toBeVisible();
  await expect(summary.getByText("Ahorrado en metas")).toBeVisible();
  await expect(summary.getByText("Objetivo total")).toBeVisible();

  // Legacy route still resolves onto the tab.
  await page.goto("/goals/completed");
  await expect(page).toHaveURL(/\/goals\?status=completadas/);

  await context.close();
});

test("with goals in two currencies the summary never fuses a total (§8.3, §33.1)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "multi");

  await createGoal(page, "Viaje ARS", "ARS", "800000");
  await createGoal(page, "Fondo USD", "USD", "5000");

  await page.goto("/goals");
  const summary = page.getByRole("region", { name: "Resumen de metas" });
  // Per-currency breakdown, not a single converted number.
  await expect(summary.getByText("ARS").first()).toBeVisible();
  await expect(summary.getByText("USD").first()).toBeVisible();
  await expect(summary.getByText(/varias monedas; no se suma/i)).toBeVisible();

  await context.close();
});
