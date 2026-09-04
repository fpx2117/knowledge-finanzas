import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

const routes = [
  "/app",
  "/accounts",
  "/transactions",
  "/budgets",
  "/obligations",
  "/transactions/scheduled",
  "/notifications",
  "/settings/categories",
  "/settings/notifications",
  "/settings/privacy",
  "/settings/referrals",
];

test("final routes preserve structural accessibility contracts", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
    name: "F21 accessibility audit",
    email: `f21-a11y-${Date.now()}@example.test`,
  });

  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("main"), `${route} main`).toHaveCount(1);
    await expect(page.locator("h1"), `${route} h1`).toHaveCount(1);

    const unlabeledControls = await page.locator("input:not([type=hidden]):not([type=radio]), textarea, select, button").evaluateAll((controls) =>
      controls.filter((control) => {
        if (control instanceof HTMLInputElement && control.type === "radio") return false;
        if (control.getAttribute("style")?.includes("clip-path:inset(50%)")) return false;
        if (control instanceof HTMLButtonElement && control.textContent?.trim()) return false;
        if (control.getAttribute("aria-label") || control.getAttribute("aria-labelledby")) return false;
        const id = control.getAttribute("id");
        return !id || !document.querySelector(`label[for="${CSS.escape(id)}"]`);
      }).map((control) => control.outerHTML.slice(0, 160)),
    );

    expect(unlabeledControls, `${route} unlabeled controls`).toEqual([]);
  }

  await context.close();
});
