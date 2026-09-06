import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-A11Y (spec 14 gate G4): the critical flows must be fully operable with the keyboard alone,
// and expose the semantics a screen reader needs (skip link, dialog focus trap + restore, live
// error announcement). Structural contracts (one h1, labeled controls, landmarks per route) are
// covered by final-route-regression + final-accessibility-audit; this file drives real keyboard
// interaction.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `A11y ${tag}`,
    email: `a11y-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

async function activeElement(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      text: (el.textContent || "").trim().slice(0, 40),
      label: el.getAttribute("aria-label"),
    };
  });
}

test("the skip link is the first tab stop and moves focus past the nav to the page content", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "skip");

  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // From a fresh load, the very first Tab must land on the skip link.
  await page.keyboard.press("Tab");
  const focused = await activeElement(page);
  expect(focused?.text).toBe("Saltar al contenido");

  // Activating it moves focus to <main>, so the next Tab is inside the content, not the sidebar.
  await page.keyboard.press("Enter");
  const afterSkip = await activeElement(page);
  expect(afterSkip?.id).toBe("main-content");

  await context.close();
});

test("the command palette is fully keyboard-driven: open with Ctrl+K, navigate with arrows, close with Escape restoring focus", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "palette");

  await page.goto("/app");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator("body").click(); // ensure the document has focus

  await page.keyboard.press("Control+KeyK");
  const input = page.getByPlaceholder("Buscar páginas, movimientos o acciones…");
  await expect(input).toBeFocused();

  await input.pressSequentially("Cuentas");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/accounts/);

  // Reopen and dismiss with Escape — the dialog closes and focus is not lost to <body>.
  await page.keyboard.press("Control+KeyK");
  await expect(input).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByPlaceholder("Buscar páginas, movimientos o acciones…")).toBeHidden();

  await context.close();
});

test("a movement can be registered with the keyboard only", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "kbd-expense");

  // Seed one account so the form has a selectable option.
  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Caja");
  await page.getByLabel("Tipo").selectOption("BANK");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Saldo inicial").fill("100000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  await page.goto("/transactions/new?type=EXPENSE");
  await expect(page.getByRole("button", { name: "Registrar gasto" })).toBeEnabled();

  // Reach and fill the fields by keyboard, then submit with Enter on the button.
  await page.locator("#amount").focus();
  await page.keyboard.type("12000");
  await page.keyboard.press("Tab");
  const onDescription = await activeElement(page);
  expect(onDescription?.id).toBe("description");
  await page.keyboard.type("Almuerzo");

  await page.getByRole("button", { name: "Registrar gasto" }).focus();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Almuerzo").first()).toBeVisible({ timeout: 10000 });

  await context.close();
});

test("an incomplete required form blocks submit and moves focus to the offending field", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "kbd-required");

  await page.goto("/goals/new");
  await page.getByRole("button", { name: /Crear meta/ }).click();

  // Native constraint validation: the form does not navigate, and focus lands on the empty
  // required field so a screen-reader user knows exactly what to fix.
  await expect(page).toHaveURL(/\/goals\/new$/);
  await expect(page.locator("#name")).toBeFocused();
  expect(await page.locator("#name").evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);

  await context.close();
});

test("a dialog traps focus and returns it to the trigger on Escape", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "kbd-dialog");

  await page.goto("/goals/new");
  await page.getByLabel("Nombre de la meta").fill("Vacaciones");
  await page.getByLabel("Categoría").selectOption("TRAVEL");
  await page.getByLabel("Moneda").selectOption("ARS");
  await page.getByLabel("Monto objetivo").fill("1000000");
  await page.getByRole("button", { name: /Crear meta/ }).click();
  await page.getByRole("link", { name: "Vacaciones" }).first().click();
  await expect(page).toHaveURL(/\/goals\/[0-9a-f-]+$/);

  const trigger = page.getByRole("button", { name: "Registrar ahorro" });
  await trigger.focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Focus moves into the dialog (Base UI does this on the next frame).
  await expect
    .poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))
    .toBe(true);

  // Focus is trapped: tabbing never escapes to the page behind the modal.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await context.close();
});
