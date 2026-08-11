import { describe, expect, it } from "vitest";
import { assertSafeRecoveryTarget } from "../../packages/db/scripts/recovery-validate";

describe("assertSafeRecoveryTarget", () => {
  it("accepts a database URL whose name clearly identifies it as a recovery/test target", () => {
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@localhost:5432/know_finanzas_recovery_scratch")).not.toThrow();
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@localhost:5432/know_finanzas_test")).not.toThrow();
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@localhost:5432/restore_isolated_db")).not.toThrow();
  });

  it("rejects a database URL whose name suggests production", () => {
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@db.example.com:5432/know_finanzas_production")).toThrow(/production/);
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@db.example.com:5432/prod")).toThrow(/production/);
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@db.example.com:5432/live_db")).toThrow(/production/);
  });

  it("rejects a database name that doesn't identify itself as a recovery target at all", () => {
    expect(() => assertSafeRecoveryTarget("postgresql://u:p@db.example.com:5432/some_other_database")).toThrow(/isolated recovery target/);
  });
});
