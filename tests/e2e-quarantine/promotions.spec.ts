import { eq } from "drizzle-orm";
import { expect, test } from "@playwright/test";
import { promotionCodes, users } from "../../packages/db/src/schema";
import { closeTestDatabase, createTestDatabase } from "../support/test-database";
import { signUpCompleteOnboardingAndStartTrial } from "./support/onboarding-flow";

test("a trial user redeems a valid promo code and immediately sees the Pro promocional banner", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `promotions-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Promotions E2E", email });

  const database = createTestDatabase();
  const code = `E2EWELCOME${Date.now()}`;
  try {
    const [user] = await database.db.select().from(users).where(eq(users.email, email));
    await database.db.insert(promotionCodes).values({
      code,
      normalizedCode: code,
      name: "E2E welcome code",
      status: "ACTIVE",
      durationValue: 30,
      durationUnit: "DAYS",
      maxRedemptions: null,
      maxRedemptionsPerUser: 1,
      stackingPolicy: "NOT_STACKABLE",
      aiCreditsPerPeriod: 0,
      whatsappMessagesPerPeriod: 0,
      createdBy: user.id,
    });
  } finally {
    await closeTestDatabase(database);
  }

  await page.goto("/settings/plan");
  await expect(page.getByText("¿Tenés un código promocional?")).toBeVisible();

  await page.getByLabel("Código promocional").fill(code);
  await page.getByRole("button", { name: "Aplicar código" }).click();

  // The Server Action's revalidatePath re-renders the whole settings page with the now-real
  // accessSource=PROMOTION state, which is what the StateBanner reflects immediately — the
  // redeem form itself unmounts as part of that same re-render (it only shows for
  // TRIAL/NONE access), so the persisted banner is the meaningful thing to assert on here.
  await expect(page.getByText("Pro promocional")).toBeVisible();
  await expect(page.getByText(/Acceso Pro hasta el/)).toBeVisible();

  // Reload confirms the applied state is real, persisted server state — not just this one render.
  await page.reload();
  await expect(page.getByText("Pro promocional")).toBeVisible();
  await expect(page.getByText(/Acceso Pro hasta el/)).toBeVisible();

  await context.close();
});

test("an invalid code shows a generic error and never reveals whether the code exists", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `promotions-invalid-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`;
  await signUpCompleteOnboardingAndStartTrial(page, baseURL!, { name: "Promotions Invalid E2E", email });

  await page.goto("/settings/plan");
  await page.getByLabel("Código promocional").fill("NOEXISTE1234");
  await page.getByRole("button", { name: "Aplicar código" }).click();

  await expect(page.getByText("Ese código no es válido o ya no está disponible.")).toBeVisible();

  await context.close();
});
