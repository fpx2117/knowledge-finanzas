import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { debtInstallments, debts, notifications, users } from "../../packages/db/src/schema";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

test("a seeded notification appears in the center, marks read, and navigates to its related entity", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `notifications-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Notifications E2E", email });

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta notificaciones");
  await page.getByLabel("Saldo inicial").fill("500");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  const database = createTestDatabase();
  let debtId: string;
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    const [debt] = await database.db.insert(debts).values({ userId: user.id, name: "Deuda notificada", type: "OTHER", currencyCode: "ARS", originalAmount: "100", startDate: "2026-01-01", interestType: "NO_INTEREST" }).returning();
    debtId = debt.id;
    await database.db.insert(debtInstallments).values({ debtId: debt.id, installmentNumber: 1, dueDate: "2026-02-01", principalAmount: "100", interestAmount: "0", feeAmount: "0", totalAmount: "100" });
  } finally {
    await closeTestDatabase(database);
  }

  // No manual notification insert: the debt above is genuinely overdue relative to "now", so
  // visiting the dashboard triggers the real TASK-049 rule evaluation, which creates the
  // DEBT_OVERDUE notification itself — this is the actual end-to-end path, not a synthetic seed.
  await page.goto("/app");
  await expect(page.getByRole("link", { name: /Notificaciones, 1 sin leer/ })).toBeVisible();

  await page.goto("/notifications");
  const relatedLink = page.getByRole("link", { name: "Cuota vencida" });
  await expect(relatedLink).toBeVisible();
  await expect(relatedLink).toHaveAttribute("href", `/obligations/${debtId}`);

  await page.getByRole("button", { name: "Marcar leída" }).click();
  await expect(page.getByRole("button", { name: "Marcar leída" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Notificaciones", exact: true })).toBeVisible();

  await relatedLink.click();
  await expect(page).toHaveURL(new RegExp(`/obligations/${debtId}$`));
  await expect(page.getByRole("heading", { name: "Deuda notificada" })).toBeVisible();

  await context.close();
});

test("reconnecting to the notification center reloads unread state from Postgres", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `notifications-reconnect-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Notifications Reconnect E2E", email });
  await expect(page.getByRole("link", { name: "Notificaciones", exact: true })).toBeVisible();

  const database = createTestDatabase();
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    await database.db.insert(notifications).values({ userId: user.id, type: "BUDGET_EXCEEDED", category: "FINANCIAL", priority: "NORMAL", titleKey: "BUDGET_EXCEEDED", bodyKey: "BUDGET_EXCEEDED" });
  } finally {
    await closeTestDatabase(database);
  }

  // Simulates reconnect: a fresh navigation (new server render + a fresh SSE handshake) must
  // reflect Postgres truth even though the notification was written by a process outside this
  // page's own SSE connection.
  await page.goto("/app");
  await expect(page.getByRole("link", { name: /Notificaciones, 1 sin leer/ })).toBeVisible();

  await context.close();
});

test("the SSE stream requires authentication", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/api/notifications/stream`);
  expect(response.status()).toBe(401);
});
