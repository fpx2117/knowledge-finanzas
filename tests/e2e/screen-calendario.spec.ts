import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-06 — Calendario against docs/visual/06-calendario-product-ui-spec-extreme.md.
// The month grid + temporal-layer taxonomy landed in WP-CALENDAR-LAYERS; this adds the §6.1
// header controls (Mes | Agenda switch, Hoy, Agregar) and the §7 Agenda view.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Cal ${tag}`,
    email: `cal-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("the header has the Mes|Agenda switch, an Agregar CTA, and Hoy appears only off the current month (§6.1)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "header");

  await page.goto("/calendar");
  const viewGroup = page.getByRole("group", { name: "Vista del calendario" });
  await expect(viewGroup.getByRole("link", { name: "Mes" })).toBeVisible();
  await expect(viewGroup.getByRole("link", { name: "Agenda" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar", exact: true })).toBeVisible();

  // On the current month, no "Hoy" button.
  await expect(page.getByRole("link", { name: "Hoy" })).toHaveCount(0);

  // Off the current month, "Hoy" appears and points back to the bare calendar.
  await page.goto("/calendar?period=2026-08");
  const hoy = page.getByRole("link", { name: "Hoy" });
  await expect(hoy).toBeVisible();
  await expect(hoy).toHaveAttribute("href", "/calendar");

  // Agregar opens Quick Add.
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await context.close();
});

test("the Agenda view lists events chronologically by day (§7)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "agenda");

  // Seed an account + a couple of expenses so the calendar has events this month.
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Caja");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("100000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  for (const [amount, description] of [["12000", "Almuerzo hoy"], ["5000", "Café hoy"]]) {
    await page.goto("/transactions/new?type=EXPENSE");
    await page.locator("#amount").fill(amount);
    await page.locator("#description").fill(description);
    await page.locator("#accountId").selectOption({ label: "Caja" });
    await page.getByRole("button", { name: "Registrar gasto" }).click();
    await expect(page).toHaveURL(/\/transactions$/);
  }

  await page.goto("/calendar?view=agenda");
  await expect(page.getByRole("heading", { level: 1, name: "Calendario" })).toBeVisible();
  // Today's group shows both movements and a per-day close (§7).
  await expect(page.getByRole("heading", { name: /^Hoy · / })).toBeVisible();
  await expect(page.getByText("Almuerzo hoy")).toBeVisible();
  await expect(page.getByText("Café hoy")).toBeVisible();
  await expect(page.getByText("Salidas comprometidas")).toBeVisible();

  await context.close();
});
