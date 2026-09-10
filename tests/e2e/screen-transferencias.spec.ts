import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// Consolidación 2026-09: las transferencias ya no son una pestaña/lista aparte. Se crean desde el
// botón "Transferir" del header de Transacciones (modal con fondo blureado) y aparecen en la
// lista de Movimientos bajo el chip "Transferencias".

test("crear una transferencia desde el modal del header y verla en Movimientos", async ({ browser, baseURL }) => {
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

  // La ruta vieja redirige a Movimientos.
  await page.goto("/transactions/transfers");
  await expect(page).toHaveURL(/\/transactions\?type=TRANSFER$/);

  // Abrir el modal "Transferir" desde el header y registrar una.
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Transferir" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Transferí entre tus cuentas")).toBeVisible();
  await dialog.locator("#fromAccountId").selectOption({ label: "Origen · ARS" });
  await dialog.locator("#toAccountId").selectOption({ label: "Destino · ARS" });
  await dialog.locator("#amount").fill("25000");
  await dialog.getByRole("button", { name: "Transferir" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  // Aparece en la lista, y el chip "Transferencias" la aísla.
  await expect(page.getByText("Origen → Destino")).toBeVisible();
  await page.getByRole("button", { name: "Transferencias" }).click();
  await expect(page.getByText("Origen → Destino")).toBeVisible();
  await expect(page.getByText("Sin categoría")).toHaveCount(0);

  await context.close();
});
