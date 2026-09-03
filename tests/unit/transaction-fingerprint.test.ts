import { describe, expect, it } from "vitest";

import {
  DUPLICATE_BLOCK_THRESHOLD,
  DUPLICATE_REVIEW_THRESHOLD,
  duplicateScore,
  transactionFingerprint,
  type FingerprintInput,
} from "../../apps/web/src/features/transactions/lib/transaction-fingerprint";

function t(over: Partial<FingerprintInput>): FingerprintInput {
  return {
    merchantId: "m-carrefour",
    merchant: "Carrefour",
    amount: "15400.00",
    currencyCode: "ARS",
    occurredOn: "2026-09-03",
    accountId: "acc-1",
    paymentMethod: "DEBIT",
    externalId: null,
    ...over,
  };
}

describe("transactionFingerprint", () => {
  it("is equal for the same account/currency/amount/day/merchant", () => {
    expect(transactionFingerprint(t({}))).toBe(transactionFingerprint(t({ merchant: "CARREFOUR SA 0443", paymentMethod: "CREDIT" })));
  });
  it("differs when the amount or day differs", () => {
    expect(transactionFingerprint(t({}))).not.toBe(transactionFingerprint(t({ amount: "15400.50" })));
    expect(transactionFingerprint(t({}))).not.toBe(transactionFingerprint(t({ occurredOn: "2026-09-04" })));
  });
});

describe("duplicateScore", () => {
  it("scores an identical same-day entry as a near-certain duplicate", () => {
    expect(duplicateScore(t({}), t({}))).toBeGreaterThanOrEqual(DUPLICATE_BLOCK_THRESHOLD);
  });

  it("treats matching external ids as definitive and mismatching ones as distinct", () => {
    expect(duplicateScore(t({ externalId: "bank-99" }), t({ externalId: "bank-99", amount: "1", accountId: "other" }))).toBe(1);
    expect(duplicateScore(t({ externalId: "bank-99" }), t({ externalId: "bank-100" }))).toBe(0);
  });

  it("returns 0 across different accounts or currencies", () => {
    expect(duplicateScore(t({}), t({ accountId: "acc-2" }))).toBe(0);
    expect(duplicateScore(t({}), t({ currencyCode: "USD" }))).toBe(0);
  });

  it("returns 0 when amounts are far apart", () => {
    expect(duplicateScore(t({}), t({ amount: "99999.00" }))).toBe(0);
  });

  it("lands in the ask-the-user band for same amount a few days apart with same merchant", () => {
    const score = duplicateScore(t({}), t({ occurredOn: "2026-09-06" }));
    expect(score).toBeGreaterThanOrEqual(DUPLICATE_REVIEW_THRESHOLD);
    expect(score).toBeLessThan(DUPLICATE_BLOCK_THRESHOLD);
  });

  it("penalises different known merchants", () => {
    expect(duplicateScore(t({}), t({ merchantId: "m-coto", merchant: "Coto" }))).toBeLessThan(DUPLICATE_REVIEW_THRESHOLD);
  });

  it("still matches a near-equal amount within tolerance", () => {
    expect(duplicateScore(t({ amount: "15400.00" }), t({ amount: "15400.05" }))).toBeGreaterThanOrEqual(DUPLICATE_REVIEW_THRESHOLD);
  });
});
