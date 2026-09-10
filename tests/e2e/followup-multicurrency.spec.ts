import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// El saldo en otra moneda (USD) tiene que verse en el Resumen (con su disponible) y los
// Reportes tienen que poder expresarse en esa moneda (§8.3 / RF-03 / spec 08 §7.7).

async function createAccount(page: Page, name: string, currency: string, balance: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption(currency === "ARS" ? "BANK" : "SAVINGS");
  await page.getByLabel("Moneda").selectOption(currency);
  await page.getByLabel("Saldo inicial").fill(balance);
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);
}

test("USD balance shows on the dashboard and reports can switch currency", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
    name: "Mc",
    email: `mc-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });

  await createAccount(page, "Galicia", "ARS", "500000");
  await createAccount(page, "Wise", "USD", "1200");

  // Dashboard: dedicated "Otras monedas" section with USD's own saldo + disponible.
  await page.goto("/app");
  const others = page.getByRole("region", { name: "Otras monedas" });
  await expect(others).toBeVisible();
  await expect(others.getByText("USD", { exact: true })).toBeVisible();
  await expect(others.getByText("Dinero disponible")).toBeVisible();

  // Reports: currency picker + the report re-expressed in USD.
  await page.goto("/reports");
  const picker = page.getByRole("group", { name: "Moneda del reporte" });
  await expect(picker).toBeVisible();
  await picker.getByRole("link", { name: "USD" }).click();
  await expect(page).toHaveURL(/currency=USD/);
  await expect(page.getByRole("group", { name: "Moneda del reporte" }).getByRole("link", { name: "USD" })).toHaveAttribute("aria-current", "true");
});
