import { describe, expect, it } from "vitest";
// Imported from the isolated submodule (not the package's index) so this unit test never triggers
// @know-finanzas/config's eager createEnv() validation, which requires a full real environment.
import { assertProductionHardening } from "../../packages/config/src/production-hardening";

const validProduction = {
  RAILWAY_ENVIRONMENT_NAME: "production",
  BETTER_AUTH_URL: "https://app.example.com",
  BETTER_AUTH_SECRET: "a-real-generated-secret-that-is-long-enough-1234",
  DATABASE_URL: "postgresql://user:pass@db.internal.example.com:5432/prod",
  INTERNAL_HEALTH_TOKEN: "a-real-generated-health-token",
};

describe("assertProductionHardening", () => {
  it("no-ops when RAILWAY_ENVIRONMENT_NAME isn't exactly 'production' (unset, or another Railway environment), regardless of how unsafe the values look", () => {
    for (const RAILWAY_ENVIRONMENT_NAME of [undefined, "staging", "preview", "development"]) {
      expect(() => assertProductionHardening({ ...validProduction, RAILWAY_ENVIRONMENT_NAME, BETTER_AUTH_URL: "http://localhost:3000", DATABASE_URL: "postgresql://u:p@localhost:5433/db" })).not.toThrow();
    }
  });

  it("no-ops for the E2E harness's `next start` run against local test infrastructure (RAILWAY_ENVIRONMENT_NAME never set locally, regardless of Next.js forcing NODE_ENV=production internally)", () => {
    expect(() => assertProductionHardening({ BETTER_AUTH_URL: "http://127.0.0.1:3100", BETTER_AUTH_SECRET: "e2e-local-secret-12345678901234567890", DATABASE_URL: "postgresql://u:p@localhost:5433/know_finanzas_test" })).not.toThrow();
  });

  it("passes for a fully valid production configuration", () => {
    expect(() => assertProductionHardening(validProduction)).not.toThrow();
  });

  it("rejects a non-HTTPS BETTER_AUTH_URL in production", () => {
    expect(() => assertProductionHardening({ ...validProduction, BETTER_AUTH_URL: "http://app.example.com" })).toThrow(/https/);
  });

  it("rejects a DATABASE_URL pointing at localhost/127.0.0.1 in production", () => {
    expect(() => assertProductionHardening({ ...validProduction, DATABASE_URL: "postgresql://u:p@localhost:5432/db" })).toThrow(/localhost/);
    expect(() => assertProductionHardening({ ...validProduction, DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/db" })).toThrow(/localhost/);
  });

  it("rejects known non-production placeholder secrets", () => {
    expect(() => assertProductionHardening({ ...validProduction, BETTER_AUTH_SECRET: "replace-with-a-random-secret-of-at-least-32-characters" })).toThrow(/placeholder/);
    expect(() => assertProductionHardening({ ...validProduction, BETTER_AUTH_SECRET: "e2e-local-secret-12345678901234567890" })).toThrow(/placeholder/);
  });

  it("rejects a missing INTERNAL_HEALTH_TOKEN in production", () => {
    const { INTERNAL_HEALTH_TOKEN, ...withoutToken } = validProduction;
    void INTERNAL_HEALTH_TOKEN;
    expect(() => assertProductionHardening(withoutToken)).toThrow(/INTERNAL_HEALTH_TOKEN/);
  });

  it("reports every problem at once rather than stopping at the first", () => {
    try {
      assertProductionHardening({ RAILWAY_ENVIRONMENT_NAME: "production", BETTER_AUTH_URL: "http://app.example.com", BETTER_AUTH_SECRET: "e2e-local-secret-12345678901234567890", DATABASE_URL: "postgresql://u:p@localhost:5432/db" });
      throw new Error("expected assertProductionHardening to throw");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/https/);
      expect(message).toMatch(/localhost/);
      expect(message).toMatch(/placeholder/);
      expect(message).toMatch(/INTERNAL_HEALTH_TOKEN/);
    }
  });
});
