import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// Application Shell reconstruction against docs/visual/13-application-shell-product-ui-spec-extreme.md.
// This file grows one describe block per shell increment.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Shell ${tag}`,
    email: `shell-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test.describe("sidebar (spec §5–6, §18)", () => {
  test("financial nav is in the V1 order, with Configuración/Ayuda below a separator", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await newUser(page, baseURL!, "order");
    await page.goto("/app");

    const nav = page.getByRole("navigation", { name: "Navegación principal" }).first();
    const labels = await nav.getByRole("link").allInnerTexts();
    const flat = labels.map((l) => l.split("\n")[0].trim()).filter(Boolean);

    // §6.2 — the nine financial destinations, in order, then Configuración + Ayuda.
    const financial = ["Resumen", "Cuentas", "Transacciones", "Presupuestos", "Obligaciones", "Calendario", "Metas", "Reportes", "Insights"];
    for (let i = 1; i < financial.length; i++) {
      expect(flat.indexOf(financial[i - 1])).toBeLessThan(flat.indexOf(financial[i]));
    }
    expect(flat).toContain("Configuración");
    expect(flat).toContain("Ayuda");
    expect(flat.indexOf("Insights")).toBeLessThan(flat.indexOf("Configuración"));

    // §3.3 — the sidebar has no fake action buttons (the dead "Sincronizar cuentas" is gone).
    await expect(page.getByRole("button", { name: /Sincronizar/ })).toHaveCount(0);

    await context.close();
  });

  test("the Transacciones badge counts movements that need review (spec §6.13)", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await newUser(page, baseURL!, "badge");

    // A brand-new user has nothing to review — no badge.
    await page.goto("/app");
    const txLink = page.getByRole("navigation", { name: "Navegación principal" }).first().getByRole("link", { name: /^Transacciones/ });
    await expect(txLink).not.toContainText(/\d/);

    // Create one account and one uncategorised expense.
    await page.goto("/accounts/new");
    await page.getByLabel("Nombre de la cuenta").fill("Caja");
    await page.getByLabel("Tipo").selectOption("BANK");
    await page.getByLabel("Moneda").selectOption("ARS");
    await page.getByLabel("Saldo inicial").fill("100000");
    await page.getByLabel("Fecha de apertura").fill("2026-01-01");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/accounts$/);

    await page.goto("/transactions/new?type=EXPENSE");
    await page.locator("#amount").fill("5000");
    await page.locator("#description").fill("Sin categoria");
    await page.locator("#accountId").selectOption({ label: "Caja" });
    await page.getByRole("button", { name: "Registrar gasto" }).click();
    await expect(page).toHaveURL(/\/transactions$/);

    await expect(async () => {
      await page.goto("/app");
      await expect(txLink).toContainText("1");
    }).toPass({ timeout: 15000 });

    await context.close();
  });
});
