import { describe, expect, it } from "vitest";
import { CAPABILITY_KEYS, hasCapability, listEntitlements } from "@know-finanzas/billing";

const READ_CAPABILITIES = [
  "accounts.read",
  "transactions.read",
  "debts.read",
  "budgets.read",
  "planning.read",
  "reports.read",
  "notifications.in_app",
  "exports.data",
  "billing.manage",
] as const;

const WRITE_CAPABILITIES = CAPABILITY_KEYS.filter((key) => !(READ_CAPABILITIES as readonly string[]).includes(key));

describe("entitlement matrix", () => {
  it("grants every capability during TRIAL", () => {
    for (const key of CAPABILITY_KEYS) expect(hasCapability("TRIAL", key)).toBe(true);
  });

  it("grants every capability while PRO", () => {
    for (const key of CAPABILITY_KEYS) expect(hasCapability("PRO", key)).toBe(true);
  });

  it("keeps read capabilities available in EXPIRED_READ_ONLY", () => {
    for (const key of READ_CAPABILITIES) expect(hasCapability("EXPIRED_READ_ONLY", key)).toBe(true);
  });

  it("blocks every write/premium capability in EXPIRED_READ_ONLY", () => {
    for (const key of WRITE_CAPABILITIES) expect(hasCapability("EXPIRED_READ_ONLY", key)).toBe(false);
  });

  it("blocks the explicitly documented cannot-do capabilities (docs/10.1 §30)", () => {
    const mustBeBlocked = ["transactions.create", "transactions.edit", "accounts.create", "transfers.create", "debts.create", "debts.pay", "budgets.create", "planning.manage", "ai.assistant", "ai.scenarios", "ai.actionPreparation", "notifications.whatsapp", "categories.create"] as const;
    for (const key of mustBeBlocked) expect(hasCapability("EXPIRED_READ_ONLY", key)).toBe(false);
  });

  it("listEntitlements returns the full matrix row for a state", () => {
    const entitlements = listEntitlements("EXPIRED_READ_ONLY");
    expect(entitlements["accounts.read"]).toBe(true);
    expect(entitlements["accounts.create"]).toBe(false);
    expect(Object.keys(entitlements)).toHaveLength(CAPABILITY_KEYS.length);
  });
});
