import { describe, expect, it } from "vitest";

import { createUserPreferencesRepository, DEFAULT_USER_PREFERENCES } from "../../packages/db/src/repositories/user-preferences";
import { createUserRepository } from "../../packages/db/src/repositories/users";
import { users } from "../../packages/db/src/schema";
import { getTestDatabase } from "../support/postgres-test-setup";

// WP-SETTINGS-MISSING (spec 11 §4): preferences persist per user, default sanely when absent, and
// carry nothing that could break a financial invariant (§4.3).

const userId = "00000000-0000-0000-0000-0000000ee001";

async function seed() {
  const database = getTestDatabase().db;
  await database.insert(users).values({ id: userId, name: "User", email: "user-preferences@example.test", timezone: "UTC", baseCurrency: "ARS" });
  return { database, prefs: createUserPreferencesRepository(database), userRepo: createUserRepository(database) };
}

describe("user preferences", () => {
  it("returns the defaults for a user with no row and persists an upsert", async () => {
    const { prefs } = await seed();

    expect(await prefs.getForUser(userId)).toEqual(DEFAULT_USER_PREFERENCES);

    await prefs.upsert(userId, { theme: "DARK", showCents: false, defaultReportPeriod: "LAST_30_DAYS" });
    const after = await prefs.getForUser(userId);
    expect(after.theme).toBe("DARK");
    expect(after.showCents).toBe(false);
    expect(after.defaultReportPeriod).toBe("LAST_30_DAYS");
    expect(after.rememberLastAccount).toBe(true); // untouched fields keep their value

    await prefs.upsert(userId, { theme: "LIGHT" });
    expect((await prefs.getForUser(userId)).theme).toBe("LIGHT");
    expect((await prefs.getForUser(userId)).showCents).toBe(false); // still the earlier upsert
  });

  it("the preference keys never include a financial-semantics toggle (§4.3)", async () => {
    const forbidden = ["transfer", "income", "available", "currenc", "balance", "sum"];
    for (const key of Object.keys(DEFAULT_USER_PREFERENCES)) {
      for (const bad of forbidden) {
        expect(key.toLowerCase()).not.toContain(bad);
      }
    }
  });

  it("updateBasicProfile changes timezone and base currency", async () => {
    const { userRepo } = await seed();
    const updated = await userRepo.updateBasicProfile(userId, { timezone: "America/Argentina/Buenos_Aires", baseCurrency: "USD", country: "AR", language: "es" });
    expect(updated?.timezone).toBe("America/Argentina/Buenos_Aires");
    expect(updated?.baseCurrency).toBe("USD");
  });
});
