import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { buildProMonthlyPlanSeed } from "@know-finanzas/billing";
import { billingSubscriptions, users } from "../../packages/db/src/schema";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { completeFinancialOnboarding, completeProfileOnboarding, signUp } from "./support/onboarding-flow";

test("cancelling a subscription shows an accurate immediate-access-loss confirmation and takes effect", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `billing-cancel-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUp(context.request, baseURL!, { name: "Billing Cancel E2E", email });

  const database = createTestDatabase();
  try {
    const plan = await createBillingPlanRepository(database.db).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    // providerSubscriptionId stays null so cancellation takes the local-only path — no real
    // Mercado Pago call from this E2E run.
    await database.db.insert(billingSubscriptions).values({
      userId: user.id,
      planId: plan.id,
      provider: "MERCADO_PAGO",
      providerSubscriptionId: null,
      status: "ACTIVE",
      currentPeriodStart: new Date("2026-01-01T00:00:00Z"),
      currentPeriodEnd: new Date("2026-02-01T00:00:00Z"),
    });
  } finally {
    await closeTestDatabase(database);
  }

  // Access is already PRO (provisioned directly above), so onboarding lands straight on
  // financial-onboarding, never /elegir-acceso.
  await completeProfileOnboarding(page);
  await completeFinancialOnboarding(page, "Cuenta Billing Cancel E2E");

  await page.goto("/settings/billing");
  await expect(page.getByRole("button", { name: "Cancelar suscripción" })).toBeVisible();

  await page.getByRole("button", { name: "Cancelar suscripción" }).click();
  await expect(page.getByText("termina de inmediato al confirmar")).toBeVisible();
  await expect(page.getByText("no es reversible cancelando de nuevo", { exact: false })).toBeVisible();

  await page.getByLabel("Motivo (opcional)").selectOption("TOO_EXPENSIVE");
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();

  await expect(page.getByRole("button", { name: "Cancelar suscripción" })).toHaveCount(0);

  await context.close();
});
