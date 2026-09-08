import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-11 — Configuración against docs/visual/11-configuracion-product-ui-spec-extreme.md.

const PASSWORD = "UnaPasswordSegura123!";

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Cfg ${tag}`,
    email: `cfg-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("§1.2 the hub lists the canonical subvistas in order, including Seguridad", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "hub");

  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 1, name: "Configuración" })).toBeVisible();

  const list = page.getByRole("list", { name: "Todas las secciones de configuración" });
  const labels = await list.getByRole("link").evaluateAll((links) =>
    links.map((l) => l.querySelector("span span")?.textContent?.trim() ?? l.textContent?.trim()),
  );
  expect(labels).toEqual([
    "Perfil",
    "Preferencias",
    "Categorías",
    "Reglas",
    "Importaciones",
    "Notificaciones",
    "Privacidad",
    "Seguridad",
    "Plan",
    "Referidos",
  ]);
});

test("§2.1 a section shows the persistent sub-nav beside the content", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "shell");

  await page.goto("/settings/profile");
  const nav = page.getByRole("navigation", { name: "Secciones de configuración" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Seguridad" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Notificaciones" }).click();
  await expect(page).toHaveURL(/\/settings\/notifications$/);
});

test("§10 Seguridad changes the password and rejects a wrong current one", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "sec");

  await page.goto("/settings/security");
  await expect(page.getByRole("heading", { level: 1, name: "Seguridad" })).toBeVisible();

  // Wrong current password → error, no change.
  await page.getByLabel("Contraseña actual").fill("noEsLaActual1!");
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("PasswordNueva456!");
  await page.getByLabel("Repetir la nueva contraseña").fill("PasswordNueva456!");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText(/no es correcta/i)).toBeVisible();

  // Correct current password → success.
  await page.getByLabel("Contraseña actual").fill(PASSWORD);
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("PasswordNueva456!");
  await page.getByLabel("Repetir la nueva contraseña").fill("PasswordNueva456!");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText(/Contraseña actualizada/i)).toBeVisible();
});
