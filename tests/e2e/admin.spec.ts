import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { adminRoles, users } from "../../packages/db/src/schema";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";

async function signUp(context: import("@playwright/test").BrowserContext, baseURL: string, email: string) {
  const response = await context.request.post(`${baseURL}/api/auth/sign-up/email`, {
    headers: { "Content-Type": "application/json", Origin: baseURL, Referer: `${baseURL}/` },
    data: { name: "E2E User", email, password: "UnaPasswordSegura123!", rememberMe: true },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

test("an admin logs in, searches a user, and sees the why-access breakdown", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const adminEmail = `admin-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  const targetEmail = `admin-target-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUp(context, baseURL!, adminEmail);

  const database = createTestDatabase();
  try {
    const [adminUserRow] = await database.db.select().from(users).where(eq(users.email, adminEmail));
    await database.db.insert(users).values({ name: "Target User", email: targetEmail, timezone: "UTC", baseCurrency: "ARS" });
    await database.db.insert(adminRoles).values({ userId: adminUserRow.id, role: "ADMIN" });
  } finally {
    await closeTestDatabase(database);
  }

  const page = await context.newPage();
  await page.goto("/admin");
  await expect(page.getByText(adminEmail).first()).toBeVisible();

  await page.getByRole("link", { name: "Usuarios" }).click();
  await page.getByLabel("Email (exacto/prefijo) o ID interno").fill(targetEmail.split("@")[0]);
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page.getByRole("link", { name: "Ver resumen" })).toBeVisible();
  await page.getByRole("link", { name: "Ver resumen" }).click();

  await expect(page.getByText("¿Por qué tiene este acceso?")).toBeVisible();
  await expect(page.getByText("Prueba activa")).toBeVisible();

  await context.close();
});

test("a non-admin authenticated user is rejected when navigating to /admin", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const email = `admin-nonadmin-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUp(context, baseURL!, email);

  const page = await context.newPage();
  const response = await page.goto("/admin");

  expect(response?.status()).toBe(404);

  await context.close();
});

test("an unauthenticated visitor is rejected when navigating to /admin", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});
