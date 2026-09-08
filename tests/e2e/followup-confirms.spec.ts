import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// FOLLOWUP (spec 13 §22 / §24.2) — the destructive confirms that discarded their action state
// (goal archive, debt cancel, transaction void, category archive) now go through ConfirmDialog,
// so a failed operation shows its error inline instead of doing nothing.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Cf ${tag}`,
    email: `cf-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
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

test("archiving a goal goes through ConfirmDialog and lands the goal in Completadas/archived", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "goal");

  await page.goto("/goals/new");
  await page.getByLabel("Nombre de la meta").fill("Meta a archivar");
  await page.getByLabel("Categoría").selectOption("TRAVEL");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Monto objetivo").fill("1000000");
  await page.getByRole("button", { name: /Crear meta/ }).click();
  await page.waitForURL(/\/goals(\/[0-9a-f-]+)?$/, { timeout: 10000 });

  await page.getByRole("link", { name: "Meta a archivar" }).first().click();
  await page.getByRole("button", { name: "Archivar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Archivar esta meta" })).toBeVisible();
  await dialog.getByRole("button", { name: "Archivar meta" }).click();
  await expect(dialog).toBeHidden({ timeout: 10000 });

  await page.goto("/goals?status=activas");
  await expect(page.getByRole("link", { name: "Meta a archivar" })).toHaveCount(0);
});

test("voiding a transaction goes through ConfirmDialog and marks it Anulada", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "void");
  await createAccount(page, "Galicia");

  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill("9999");
  await page.locator("#description").fill("Gasto a anular");
  await page.locator("#accountId").selectOption({ label: "Galicia" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.getByRole("link", { name: "Gasto a anular" }).first().click();
  await page.getByRole("button", { name: "Anular", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Anular movimiento" })).toBeVisible();
  await dialog.getByRole("button", { name: "Anular movimiento" }).click();
  await expect(page.getByText("Anulada")).toBeVisible({ timeout: 15000 });
});

test("archiving a category goes through ConfirmDialog", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "cat");
  await createAccount(page, "Galicia");

  // First expense auto-provisions the user's category set.
  await page.goto("/transactions/new?type=EXPENSE");
  await page.locator("#amount").fill("1000");
  await page.locator("#description").fill("Super");
  await page.locator("#accountId").selectOption({ label: "Galicia" });
  await page.getByRole("button", { name: "Registrar gasto" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  await page.goto("/settings/categories");
  const firstArchive = page.getByRole("button", { name: /^Archivar / }).first();
  await expect(firstArchive).toBeVisible();
  const name = (await firstArchive.getAttribute("aria-label"))!.replace("Archivar ", "");
  await firstArchive.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: `Archivar «${name}»` })).toBeVisible();
  await dialog.getByRole("button", { name: "Archivar", exact: true }).click();
  await expect(dialog).toBeHidden({ timeout: 10000 });
});
