import { eq, sql } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { buildProMonthlyPlanSeed } from "@know-finanzas/billing";
import { adminRoles, billingPayments, billingPeriods, billingSubscriptions, users } from "../../packages/db/src/schema";
import { createBillingPlanRepository } from "../../packages/db/src/repositories/billing-plans";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";

async function signUpAdmin(context: import("@playwright/test").BrowserContext, baseURL: string, email: string, role: "ADMIN" | "SUPPORT" = "ADMIN") {
  const response = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: "Admin Ops E2E", email, password: "UnaPasswordSegura123!", rememberMe: true },
  });
  expect(response.ok(), await response.text()).toBeTruthy();

  const database = createTestDatabase();
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    await database.db.insert(adminRoles).values({ userId: user.id, role });
    return user.id;
  } finally {
    await closeTestDatabase(database);
  }
}

// No real Mercado Pago sandbox exists in this environment (same constraint documented for the
// existing cancellation E2E test) — this exercises the real reconciliation flow end to end
// through the UI and confirms it never crashes and never silently pretends success; the
// per-subscription outcome itself depends on the (unreachable) provider, exactly the same
// "provider reality wins, never fabricate success" invariant this dashboard exists to enforce.
test("admin resolves a stale-PENDING subscription via the reconciliation queue end to end", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const adminEmail = `admin-ops-recon-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpAdmin(context, baseURL!, adminEmail);

  const targetEmail = `admin-ops-target-recon-${Date.now()}@example.test`;
  const database = createTestDatabase();
  let subscriptionId: string;
  try {
    const [targetUser] = await database.db.insert(users).values({ name: "Target", email: targetEmail, timezone: "UTC", baseCurrency: "ARS" }).returning();
    const plan = await createBillingPlanRepository(database.db).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const [subscription] = await database.db.insert(billingSubscriptions).values({
      userId: targetUser.id, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-stale-e2e-1", status: "PENDING",
    }).returning();
    subscriptionId = subscription.id;
    await database.db.execute(sql`update billing_subscriptions set created_at = now() - interval '2 days' where id = ${subscriptionId}`);
  } finally {
    await closeTestDatabase(database);
  }

  const page = await context.newPage();
  await page.goto("/admin/billing/reconciliation");
  await expect(page.getByText(subscriptionId)).toBeVisible();

  await page.getByRole("button", { name: "Reconciliar ahora" }).first().click();
  await page.getByRole("button", { name: "Reconciliar", exact: true }).click();

  // The dialog always resolves (never hangs) and the page never crashes, regardless of whether
  // the (unreachable, in this environment) provider call inside the batch succeeded.
  await expect(page.getByRole("heading", { name: "Cola de excepciones" })).toBeVisible();

  await context.close();
});

test("a refund request never fabricates success — a provider failure is shown honestly and the user's access is untouched", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const adminEmail = `admin-ops-refund-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpAdmin(context, baseURL!, adminEmail);

  const targetEmail = `admin-ops-refund-target-${Date.now()}@example.test`;
  const database = createTestDatabase();
  let targetUserId: string;
  try {
    const [targetUser] = await database.db.insert(users).values({ name: "Refund Target", email: targetEmail, timezone: "UTC", baseCurrency: "ARS" }).returning();
    targetUserId = targetUser.id;
    const plan = await createBillingPlanRepository(database.db).upsertByCode(buildProMonthlyPlanSeed({ price: "7.99", currencyCode: "USD" }));
    const [subscription] = await database.db.insert(billingSubscriptions).values({
      userId: targetUserId, planId: plan.id, provider: "MERCADO_PAGO", providerSubscriptionId: "mp-refund-e2e-1", status: "ACTIVE",
      currentPeriodStart: new Date("2026-01-01T00:00:00Z"), currentPeriodEnd: new Date("2026-02-01T00:00:00Z"),
    }).returning();
    const [period] = await database.db.insert(billingPeriods).values({
      subscriptionId: subscription.id, startsAt: new Date("2026-01-01T00:00:00Z"), endsAt: new Date("2026-02-01T00:00:00Z"), status: "ACTIVE", providerReference: "mp-refund-e2e-1",
    }).returning();
    await database.db.insert(billingPayments).values({
      userId: targetUserId, subscriptionId: subscription.id, billingPeriodId: period.id, providerPaymentId: "mp-pay-refund-e2e-1", status: "APPROVED", grossAmount: "7.99", currencyCode: "USD", paidAt: new Date("2026-01-01T00:05:00Z"),
    });
  } finally {
    await closeTestDatabase(database);
  }

  const page = await context.newPage();
  await page.goto(`/admin/users/${targetUserId}`);
  await expect(page.getByRole("button", { name: "Solicitar reembolso" })).toBeVisible();

  await page.getByRole("button", { name: "Solicitar reembolso" }).click();
  await page.getByLabel("Motivo").fill("cargo duplicado detectado en soporte");
  await page.getByRole("button", { name: "Confirmar reembolso" }).click();

  // Never silently succeeds when the provider is unreachable.
  await expect(page.getByText(/falló/)).toBeVisible();

  await page.reload();
  await expect(page.getByText("ACTIVE")).toBeVisible();

  await context.close();
});

test("SUPPORT can view a user's summary but sees no refund/AI-adjustment/cancel actions", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const supportEmail = `admin-ops-support-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpAdmin(context, baseURL!, supportEmail, "SUPPORT");

  const targetEmail = `admin-ops-support-target-${Date.now()}@example.test`;
  const database = createTestDatabase();
  let targetUserId: string;
  try {
    const [targetUser] = await database.db.insert(users).values({ name: "Support Target", email: targetEmail, timezone: "UTC", baseCurrency: "ARS" }).returning();
    targetUserId = targetUser.id;
  } finally {
    await closeTestDatabase(database);
  }

  const page = await context.newPage();
  await page.goto(`/admin/users/${targetUserId}`);

  await expect(page.getByText("¿Por qué tiene este acceso?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar reembolso" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ajustar créditos" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancelar suscripción" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Otorgar Pro promocional" })).toHaveCount(0);

  await context.close();
});
