import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// /transactions/transfers — la lista de transferencias (spec 03 §12). Antes daba 404: la ruta
// tenía /new y /[id] pero no un índice, y el nav apuntaba ahí.

test("the transfers list renders, is linked from the subnav, and shows registered transfers", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
    name: "Trf",
    email: `trf-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });

  for (const [name, balance] of [["Origen", "80000"], ["Destino", "0"]] as const) {
    await page.goto("/accounts/new");
    await page.getByLabel("Nombre de la cuenta").fill(name);
    await page.getByLabel("Tipo").selectOption("BANK");
    await page.getByLabel("Moneda").selectOption("ARS");
    await page.getByLabel("Saldo inicial").fill(balance);
    await page.getByLabel("Fecha de apertura").fill("2026-01-01");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page).toHaveURL(/\/accounts$/);
  }

  // Empty state first.
  await page.goto("/transactions/transfers");
  await expect(page.getByRole("heading", { level: 1, name: "Transferencias" })).toBeVisible();
  await expect(page.getByText("Todavía no registraste transferencias")).toBeVisible();

  // Reachable from the subnav.
  await page.goto("/transactions");
  await page.getByRole("navigation", { name: "Secciones de transacciones" }).getByRole("link", { name: "Transferencias" }).click();
  await expect(page).toHaveURL(/\/transactions\/transfers$/);

  // Register one → it shows in the list.
  await page.goto("/transactions/transfers/new");
  await page.locator("#fromAccountId").selectOption({ label: "Origen · ARS" });
  await page.locator("#toAccountId").selectOption({ label: "Destino · ARS" });
  await page.locator("#amount").fill("25000");
  await page.getByRole("button", { name: "Transferir" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.goto("/transactions/transfers");
  const row = page.getByRole("row", { name: /Origen.*Destino/ });
  await expect(row).toBeVisible();
  await expect(row.getByText("Registrada")).toBeVisible();
});
