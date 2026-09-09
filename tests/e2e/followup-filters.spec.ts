import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// FOLLOWUP — filtros y orden en las listas (spec 03 §9.4/§9.7, spec 07 §9.2/§9.3).
// El fix de fondo: los controles navegaban con `router.push` sobre query en una ruta con
// `loading.tsx` (no se aplicaba bajo Next 15.5). Ahora Transacciones usa carga completa y Metas
// usa `<Link>` server-side.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Flt ${tag}`,
    email: `flt-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function createAccount(page: Page, name: string, currency: string) {
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill(name);
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption(currency);
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

test("§9.7 Transacciones: sorting by amount actually navigates and reorders the list", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "txsort");
  await createAccount(page, "Galicia", "ARS");
  await expense(page, "Galicia", "5000", "Chico");
  await expense(page, "Galicia", "90000", "Grande");

  await page.goto("/transactions");
  await page.getByLabel("Ordenar").selectOption("amount_desc");
  await page.waitForURL(/sort=amount_desc/, { timeout: 15000 });

  const rows = page.locator("#main-content").getByRole("link", { name: /Chico|Grande/ });
  await expect(rows.first()).toHaveText(/Grande/);

  // §9.4 — the type filter navigates too.
  await page.getByLabel("Filtrar por tipo").selectOption("INCOME");
  await page.waitForURL(/type=INCOME/, { timeout: 15000 });
  await expect(page.getByText("Grande")).toHaveCount(0);
});

test("§9.2/§9.3 Metas: sort chips and the currency filter change the list", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "goalsort");

  for (const [name, currency, target] of [
    ["Zeta viaje", "ARS", "800000"],
    ["Alfa fondo", "USD", "5000"],
  ] as const) {
    await page.goto("/goals/new");
    await page.getByLabel("Nombre de la meta").fill(name);
    await page.getByLabel("Categoría").selectOption("TRAVEL");
    await page.getByLabel("Moneda").selectOption(currency);
    await page.getByLabel("Monto objetivo").fill(target);
    await page.getByRole("button", { name: /Crear meta/ }).click();
    await page.waitForURL(/\/goals(\/[0-9a-f-]+)?$/, { timeout: 10000 });
  }

  await page.goto("/goals");
  const main = page.locator("#main-content");

  await main.getByRole("link", { name: "Nombre", exact: true }).click();
  await expect(page).toHaveURL(/sort=nombre/);
  const goalLinks = main.getByRole("link", { name: /Zeta viaje|Alfa fondo/ });
  await expect(goalLinks.first()).toHaveText(/Alfa fondo/);

  // Currency filter appears with 2 currencies.
  await main.getByRole("group", { name: "Filtrar por moneda" }).getByRole("link", { name: "USD" }).click();
  await expect(page).toHaveURL(/currency=USD/);
  await expect(main.getByRole("link", { name: /Zeta viaje/ })).toHaveCount(0);
  await expect(main.getByRole("link", { name: /Alfa fondo/ })).toBeVisible();
});

test("§9.4 Metas: la búsqueda filtra por nombre", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Gs", email: `gs-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test` });

  for (const name of ["Vacaciones a Brasil", "Fondo de emergencia"]) {
    await page.goto("/goals/new");
    await page.getByLabel("Nombre de la meta").fill(name);
    await page.getByLabel("Categoría").selectOption("TRAVEL");
    await page.getByLabel("Moneda").selectOption("ARS");
    await page.getByLabel("Monto objetivo").fill("500000");
    await page.getByRole("button", { name: /Crear meta/ }).click();
    await page.waitForURL(/\/goals(\/[0-9a-f-]+)?$/, { timeout: 10000 });
  }

  await page.goto("/goals");
  await page.getByRole("searchbox", { name: "Buscar una meta" }).fill("brasil");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/q=brasil/);
  const main = page.locator("#main-content");
  await expect(main.getByRole("link", { name: /Vacaciones a Brasil/ })).toBeVisible();
  await expect(main.getByRole("link", { name: /Fondo de emergencia/ })).toHaveCount(0);
});

test("§10 Calendario: el selector de moneda cambia el resumen (nunca combina)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Cl", email: `cl-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test` });

  await createAccount(page, "Galicia", "ARS");
  await createAccount(page, "Wise", "USD");
  await expense(page, "Galicia", "15000", "Gasto ARS");
  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill("40");
  await page.locator("#description").fill("Gasto USD");
  await page.locator("#accountId").selectOption({ label: "Wise" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.goto("/calendar");
  const selector = page.getByRole("group", { name: "Moneda del resumen" });
  await expect(selector).toBeVisible();
  await selector.getByRole("link", { name: "USD" }).click();
  await expect(page).toHaveURL(/currency=USD/);
  await expect(page.getByText(/Este resumen es sólo en USD/)).toBeVisible();
});
