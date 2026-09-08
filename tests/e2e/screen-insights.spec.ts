import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-09 — Insights / Para vos against docs/visual/09-insights-product-ui-spec-extreme.md §11.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Ins ${tag}`,
    email: `ins-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
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

async function expense(page: Page, account: string, amount: string, description: string) {
  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill(amount);
  await page.locator("#description").fill(description);
  await page.locator("#accountId").selectOption({ label: account });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);
}

test("§11.1 has the Para vos / Oportunidades / Historial tabs and the §12 empty state on Oportunidades", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "tabs");

  await page.goto("/insights");
  await expect(page.getByRole("heading", { level: 1, name: "Insights" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Para vos", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Oportunidades", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Historial", exact: true })).toBeVisible();
  await expect(page.getByText("No detectamos nada que requiera tu atención")).toBeVisible();
  // §11.2 coverage/quality signal is always present.
  await expect(page.getByText(/Calculado con tus movimientos confirmados/)).toBeVisible();

  await page.getByRole("link", { name: "Oportunidades", exact: true }).click();
  await expect(page).toHaveURL(/\/insights\/opportunities$/);
  await expect(page.getByText("Sin oportunidades detectadas")).toBeVisible();

  await context.close();
});

test("§11.1 splits 'Lo más importante ahora' from the rest, and §11.2 surfaces the uncategorized-data warning", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "hero");
  await createAccount(page, "Galicia");

  // 5 uncategorized expenses → the INS-DATA-QUALITY detector fires (threshold is 5).
  for (let i = 0; i < 5; i += 1) {
    await expense(page, "Galicia", `${10000 + i * 1000}`, `Gasto ${i}`);
  }

  await page.goto("/insights");
  await expect(page.getByRole("region", { name: "Lo más importante ahora" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Lo más importante ahora" }).getByText("5 movimientos sin categoría")).toBeVisible();
  await expect(page.getByText("1 observación activa, ordenadas por prioridad.")).toBeVisible();
  await expect(page.getByRole("link", { name: /5 movimientos sin categoría/ })).toBeVisible();

  await context.close();
});
