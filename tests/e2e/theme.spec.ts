import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

test("the header theme toggle switches between light and dark", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
    name: "Theme",
    email: `theme-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
  });
  await page.goto("/app");

  const html = page.locator("html");
  const group = page.getByRole("group", { name: "Apariencia" });

  await group.getByRole("button", { name: "Oscuro" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  // The token actually changed — background is now dark.
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  await group.getByRole("button", { name: "Claro" }).click();
  await expect(html).not.toHaveClass(/\bdark\b/);
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBg).not.toBe(lightBg);

  // Persists across navigation.
  await group.getByRole("button", { name: "Oscuro" }).click();
  await page.goto("/accounts");
  await expect(html).toHaveClass(/\bdark\b/);
});
