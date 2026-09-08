import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-12 — Ayuda against docs/visual/12-ayuda-product-ui-spec-extreme.md.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Ayuda ${tag}`,
    email: `ayuda-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("§2.2 the help nav lists the sections incl. Feedback, and never product config entries (§2.4)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "nav");

  await page.goto("/help");
  const nav = page.getByRole("navigation", { name: "Secciones de ayuda" });
  for (const label of ["Centro de ayuda", "Primeros pasos", "Resolver un problema", "Estado del servicio", "Contactar soporte", "Feedback", "Acerca de KnowFinanzas"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  // §2.4 — these belong to Configuración, never the help sidebar.
  for (const forbidden of ["Reglas", "Categorías", "Importaciones", "Seguridad"]) {
    await expect(nav.getByRole("link", { name: forbidden, exact: true })).toHaveCount(0);
  }
});

test("§6.2 the hub has a search that filters the articles", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "search");

  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "¿Cómo podemos ayudarte?" })).toBeVisible();

  const search = page.getByRole("searchbox", { name: "Buscar en la ayuda" });
  await search.fill("transferencia");
  await expect(page.getByRole("heading", { name: "Resultados (1)" })).toBeVisible();

  await search.fill("xyzqw no existe");
  await expect(page.getByRole("heading", { name: "Resultados (0)" })).toBeVisible();
  await expect(page.getByText(/No encontramos un artículo/i)).toBeVisible();
});

test("§20 Feedback is a short form separate from support", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "fb");

  await page.goto("/help/feedback");
  await expect(page.getByRole("heading", { level: 1, name: "Feedback" })).toBeVisible();
  await expect(page.getByLabel("Tipo")).toBeVisible();
  await expect(page.getByLabel("¿Qué te gustaría mejorar?")).toBeVisible();

  const send = page.getByRole("button", { name: "Enviar" });
  await expect(send).toBeDisabled();
  await page.getByLabel("¿Qué te gustaría mejorar?").fill("Estaría bueno poder etiquetar movimientos.");
  await expect(send).toBeEnabled();
  // §20.3 — points at support for actual problems.
  await expect(page.getByText(/Si tenés un problema que necesita resolución/i)).toBeVisible();
});
