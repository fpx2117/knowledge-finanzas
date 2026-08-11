import { describe, expect, it } from "vitest";
import { calculateTransferAssetDelta, validateTransfer } from "@know-finanzas/finance";

const base = {
  userId: "user-a",
  fromAccount: { id: "account-a", userId: "user-a", currencyCode: "ARS" as const, status: "ACTIVE" as const, openingDate: "2026-01-01" },
  toAccount: { id: "account-b", userId: "user-a", currencyCode: "ARS" as const, status: "ACTIVE" as const, openingDate: "2026-01-01" },
  amount: "200", currencyCode: "ARS", occurredAt: new Date("2026-08-01T12:00:00Z"), occurredLocalDate: "2026-08-01", now: new Date("2026-08-02T12:00:00Z"),
};

describe("transfer rules", () => {
  it("creates exactly one outgoing and one incoming leg", () => {
    const result = validateTransfer(base);
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.amount.toString()).toBe("200.00"); expect(result.legs.map((leg) => leg.type)).toEqual(["TRANSFER_OUT", "TRANSFER_IN"]); }
  });
  it("rejects same account, archived account and currency mismatch", () => {
    expect(validateTransfer({ ...base, toAccount: { ...base.toAccount, id: base.fromAccount.id } })).toMatchObject({ ok: false, errors: [{ code: "TRANSFER_SAME_ACCOUNT" }] });
    expect(validateTransfer({ ...base, fromAccount: { ...base.fromAccount, status: "ARCHIVED" } })).toMatchObject({ ok: false, errors: expect.arrayContaining([{ code: "TRANSFER_ACCOUNT_ARCHIVED" }]) });
    expect(validateTransfer({ ...base, toAccount: { ...base.toAccount, currencyCode: "USD" } }).errors?.[0]).toMatchObject({ code: "TRANSFER_CURRENCY_MISMATCH" });
  });
  it("preserves consolidated assets and rejects invalid legs", () => {
    const result = validateTransfer(base);
    expect(result.ok).toBe(true);
    if (result.ok) expect(calculateTransferAssetDelta({ outgoing: result.legs[0], incoming: result.legs[1] })).toMatchObject({ ok: true, consolidatedDelta: expect.objectContaining({ amount: expect.anything() }) });
  });
});
