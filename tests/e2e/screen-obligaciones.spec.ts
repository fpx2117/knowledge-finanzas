import { expect, test, type Page } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// WP-SCREEN-05 — Obligaciones against docs/visual/05-obligaciones-product-ui-spec-extreme (1).md.
// The heavy structure (§9.4 "Necesita atención", §9.5 temporal grouping, §9.3 KPIs) landed in
// WP-OBLIGATIONS-UI; this checks the §9.2 header cleanup.

async function newUser(page: Page, baseURL: string, tag: string) {
  await signUpCompleteOnboardingAndStartTrial(page, baseURL, {
    name: `Oblig ${tag}`,
    email: `oblig-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
}

test("header is title + spec description + a single '[Nueva obligación]' action (§9.2)", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await newUser(page, baseURL!, "header");

  await page.goto("/obligations");
  await expect(page.getByRole("heading", { level: 1, name: "Obligaciones" })).toBeVisible();
  await expect(
    page.getByText("Anticipá tus próximos compromisos y mantené claro cuánto tenés pendiente."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Nueva obligación" }).first()).toBeVisible();

  // §9.2 header carries only the "Nueva obligación" CTA — the old "Suscripciones" ghost button is
  // gone from the page content (that view is reachable via the sidebar sub-route and the tab bar).
  await expect(page.locator("main").getByRole("link", { name: "Suscripciones" })).toHaveCount(0);

  // A brand-new user sees the empty state, not a broken page.
  await expect(page.getByText("No tenés obligaciones registradas")).toBeVisible();

  await context.close();
});
