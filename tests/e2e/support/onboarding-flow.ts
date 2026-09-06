import type { APIRequestContext, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// WP-B8-RECONCILE / WP-E2E-JOURNEYS: the onboarding + product-access routing gate was removed in
// the greenfield rebuild — the (app) layout now only enforces authentication, and sign-up lands
// straight on /app. This helper keeps its old name so every existing spec keeps working; it just
// signs the user up and opens the app.

export async function signUp(request: APIRequestContext, baseURL: string, input: { name: string; email: string }): Promise<void> {
  const response = await request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: input.name, email: input.email, password: "UnaPasswordSegura123!", rememberMe: true },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

/** Sign up and land on /app with an authenticated session. */
export async function signUpCompleteOnboardingAndStartTrial(
  page: Page,
  baseURL: string,
  input: { name: string; email: string },
): Promise<void> {
  await signUp(page.request, baseURL, input);
  await expect(async () => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app$/);
  }).toPass({ timeout: 10_000 });
}
