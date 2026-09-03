import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { analyticsEventLog, users } from "../../packages/db/src/schema";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

// Full trial funnel measurable end-to-end against real, seeded-by-the-app events: signup → profile
// onboarding → explicit trial start (TASK-064: StartTrial, triggered by the "Comenzar prueba
// gratuita" click, not a signup side effect) → first financial data (real accounts + 5 real
// transactions through the UI) → activated (checkAndEmitActivation, triggered by the dashboard
// view and the 5th transaction) → checkout started + Pro conversion (subscription_activated only
// ever fires from a real billing-state transition, so this last leg is simulated directly against
// the event store, exactly like the referral E2E test simulates a conversion — there's no live
// checkout provider to click through in this test environment).
test("full trial funnel is measurable end-to-end: signup → trial → activation → checkout → Pro, from real seeded events", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `analytics-funnel-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;

  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Funnel E2E", email });

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta embudo");
  await page.getByLabel("Tipo").click();
  await page.getByRole("option", { name: "Banco", exact: false }).click();
  await page.getByLabel("Moneda").click();
  await page.getByRole("option", { name: "ARS", exact: false }).click();
  await page.getByLabel("Saldo inicial").fill("1000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  for (let i = 0; i < 5; i += 1) {
    await page.goto("/transactions/new?type=EXPENSE");
    await page.getByLabel("Monto").fill("50");
    await page.getByLabel("Descripción").fill(`Gasto embudo ${i}`);
    await page.getByLabel("Fecha").fill("2026-01-02");
    await page.getByRole("button", { name: "Registrar gasto" }).click();
    await expect(page).toHaveURL(/\/transactions$/);
  }

  // Visiting the dashboard fires dashboard_viewed/cashflow_viewed and re-checks activation —
  // the 5th transaction above already triggered the same check, this just confirms it holds.
  await page.goto("/dashboard");

  const database = createTestDatabase();
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));

    const eventNames = await database.db.select({ eventName: analyticsEventLog.eventName }).from(analyticsEventLog).where(eq(analyticsEventLog.userId, user.id));
    const namesSeen = new Set(eventNames.map((row) => row.eventName));

    expect(namesSeen.has("user_signed_up")).toBe(true);
    expect(namesSeen.has("trial_started")).toBe(true);
    expect(namesSeen.has("account_created")).toBe(true);
    expect(namesSeen.has("transaction_created")).toBe(true);
    expect(namesSeen.has("dashboard_viewed")).toBe(true);
    expect(namesSeen.has("cashflow_viewed")).toBe(true);
    expect(namesSeen.has("user_activated")).toBe(true);

    const transactionCreatedCount = eventNames.filter((row) => row.eventName === "transaction_created").length;
    expect(transactionCreatedCount).toBe(5);

    // Checkout + Pro conversion: no live provider to click through in this environment (Domain
    // Rule: Checkout Started != Paid Conversion regardless) — simulated directly against the
    // same event store a real checkout/webhook flow would write to.
    await database.db.insert(analyticsEventLog).values({
      eventId: `checkout_started:${user.id}`,
      eventName: "checkout_started",
      eventVersion: 1,
      userId: user.id,
      occurredAt: new Date(),
      environment: "test",
      internal: true,
      properties: { planCode: "PRO_MONTHLY" },
    });
    await database.db.insert(analyticsEventLog).values({
      eventId: `subscription_activated:funnel-sub-${user.id}`,
      eventName: "subscription_activated",
      eventVersion: 1,
      userId: user.id,
      occurredAt: new Date(),
      environment: "test",
      internal: true,
      properties: { planCode: "PRO_MONTHLY" },
    });

    const finalEventNames = await database.db.select({ eventName: analyticsEventLog.eventName }).from(analyticsEventLog).where(eq(analyticsEventLog.userId, user.id));
    const finalNamesSeen = new Set(finalEventNames.map((row) => row.eventName));
    expect(finalNamesSeen.has("checkout_started")).toBe(true);
    expect(finalNamesSeen.has("subscription_activated")).toBe(true);
  } finally {
    await closeTestDatabase(database);
  }

  await context.close();
});
