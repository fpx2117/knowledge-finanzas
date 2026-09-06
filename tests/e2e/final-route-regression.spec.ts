import { expect, test } from "@playwright/test";

import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

const authenticatedRoutes = [
  "/app",
  "/accounts",
  "/accounts/new",
  "/accounts/banks",
  "/transactions",
  "/transactions/new?type=INCOME",
  "/transactions/pending",
  "/transactions/transfers/new",
  "/transactions/scheduled",
  "/budgets",
  "/budgets/new",
  "/budgets/categories",
  "/budgets/history",
  "/obligations",
  "/obligations/new",
  "/obligations/upcoming",
  "/calendar",
  "/goals",
  "/goals/new",
  "/reports",
  "/reports/expenses",
  "/reports/cash-flow",
  "/reports/net-worth",
  "/insights",
  "/insights/history",
  "/settings",
  "/settings/profile",
  "/settings/preferences",
  "/settings/categories",
  "/settings/rules",
  "/settings/imports",
  "/settings/notifications",
  "/settings/privacy",
  "/settings/referrals",
  "/settings/plan",
  "/notifications",
  "/help",
  "/help/getting-started",
  "/help/troubleshoot",
];

async function assertRouteHealthy(page: import("@playwright/test").Page, route: string) {
  const pageErrors: Error[] = [];
  const onPageError = (error: Error) => pageErrors.push(error);
  page.on("pageerror", onPageError);

  try {
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status(), `${route} response`).toBeLessThan(500);
    expect(pageErrors, `${route} page errors`).toEqual([]);
    await expect(page.locator("main")).toBeVisible();
    await assertStructuralAccessibility(page, route);
  } finally {
    page.off("pageerror", onPageError);
  }
}

async function assertStructuralAccessibility(page: import("@playwright/test").Page, route: string) {
  await expect(page.locator("h1"), `${route} must have one h1`).toHaveCount(1);
  await expect(page.locator("main"), `${route} must expose main`).toHaveCount(1);

  const unlabeledControls = await page.locator("input, select, textarea").evaluateAll((controls) =>
    controls
      .filter((control) => {
        const element = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (element.type === "hidden") return false;
        if (element.getAttribute("style")?.includes("clip-path:inset(50%)")) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;
        return !element.labels?.length && !element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby");
      })
      .map((control) => `${control.tagName.toLowerCase()}#${control.id}`),
  );
  expect(unlabeledControls, `${route} has unlabeled form controls`).toEqual([]);

  const landmarks = await page.locator("main, nav, header, footer, aside").count();
  expect(landmarks, `${route} must expose a landmark`).toBeGreaterThan(0);
  await expect(page.locator("button:visible, a[href]:visible, input:visible, select:visible, textarea:visible").first(), `${route} must have a focusable control`).toBeVisible();
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`final authenticated route regression at ${viewport.name}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await signUpCompleteOnboardingAndStartTrial(page, baseURL!, {
      name: `F21 route regression ${viewport.name}`,
      email: `f21-routes-${viewport.name}-${Date.now()}@example.test`,
    });

    for (const route of authenticatedRoutes) {
      await assertRouteHealthy(page, route);
    }

    await context.close();
  });
}
