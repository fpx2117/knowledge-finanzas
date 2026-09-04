import { desc, eq } from "drizzle-orm";
import { expect, test, type Page } from "@playwright/test";
import { accounts, scheduledTransactions, users } from "../../packages/db/src/schema";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

async function expectDashboardEventually(page: Page, text: string) {
  await expect(async () => {
    await page.goto("/app");
    await expect(page.getByText(text).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
}

test("debt payment reduces dashboard debt summary and spendable", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `dashboard-debt-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Dashboard Debt E2E", email });

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta pago deuda dashboard");
  await page.getByLabel("Saldo inicial").fill("500");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  await page.goto("/obligations/new");
  await page.getByLabel("Nombre").fill("Préstamo Dashboard E2E");
  await page.getByRole("button", { name: "Generar preview" }).click();
  await page.getByRole("button", { name: "Validar preview" }).click();
  await page.getByRole("button", { name: "Confirmar deuda" }).click();
  await expect(page).toHaveURL(/\/obligations$/);

  await expectDashboardEventually(page, "ARS 100,00");

  await page.goto("/obligations");
  await page.getByRole("link", { name: "Préstamo Dashboard E2E" }).click();
  await page.getByLabel("Monto").fill("40");
  await page.getByRole("button", { name: "Confirmar pago" }).click();
  await expect(page).toHaveURL(/\/obligations\//);
  await expect(page.getByText("ARS 60.00").first()).toBeVisible();

  await expectDashboardEventually(page, "ARS 60,00");

  await context.close();
});

test("confirming a scheduled transaction updates dashboard totals and recent activity", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `dashboard-scheduled-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Dashboard Scheduled E2E", email });

  await page.goto("/accounts/new");
  await page.getByLabel("Nombre de la cuenta").fill("Cuenta programada dashboard");
  await page.getByLabel("Saldo inicial").fill("1000");
  await page.getByLabel("Fecha de apertura").fill("2026-01-01");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/accounts$/);

  const database = createTestDatabase();
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    // Most recently created account — the test's own "Cuenta programada dashboard", not the
    // placeholder account financial onboarding created first.
    const [account] = await database.db.select().from(accounts).where(eq(accounts.userId, user.id)).orderBy(desc(accounts.createdAt)).limit(1);
    const today = new Date().toISOString().slice(0, 10);
    await database.db.insert(scheduledTransactions).values({
      userId: user.id,
      accountId: account.id,
      type: "EXPENSE",
      expectedAmount: "150",
      currencyCode: "ARS",
      description: "Gasto programado dashboard E2E",
      scheduledDate: today,
      status: "SCHEDULED",
      source: "MANUAL",
    });
  } finally {
    await closeTestDatabase(database);
  }

  await expectDashboardEventually(page, "ARS 1.000,00");

  await page.goto("/transactions/scheduled?tab=scheduled");
  await expect(page.getByText("Gasto programado dashboard E2E")).toBeVisible();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await page.getByLabel("Importe real").fill("150");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.getByText("Gasto programado dashboard E2E")).not.toBeVisible();

  await expectDashboardEventually(page, "ARS 850,00");
  await expect(page.getByText("Gasto programado dashboard E2E")).toBeVisible();

  await context.close();
});
