import { describe, expect, it } from "vitest";

import { applicationErrorCodes } from "@know-finanzas/shared";
import { OWNERSHIP_LOOKUP_ERROR_CODES, isOwnershipLookupError, SECURITY_EVENT } from "@know-finanzas/observability";

// WP-OBSERVABILITY (gate G7): the ownership-lookup code list drives the "possible IDOR probing"
// security signal. It's a plain string set in a dependency-free package — this test is what keeps
// it honest against the real ApplicationError union.

describe("OWNERSHIP_LOOKUP_ERROR_CODES", () => {
  it("only contains codes that actually exist in the ApplicationError union", () => {
    const real = new Set<string>(applicationErrorCodes);
    for (const code of OWNERSHIP_LOOKUP_ERROR_CODES) {
      expect(real.has(code), `${code} is not a real ApplicationErrorCode`).toBe(true);
    }
  });

  it("classifies the resource-lookup failures a user can trigger by supplying an ID", () => {
    expect(isOwnershipLookupError("ACCOUNT_NOT_FOUND")).toBe(true);
    expect(isOwnershipLookupError("TRANSACTION_NOT_FOUND")).toBe(true);
    expect(isOwnershipLookupError("GOAL_NOT_FOUND")).toBe(true);
    expect(isOwnershipLookupError("BUDGET_NOT_FOUND")).toBe(true);
    expect(isOwnershipLookupError("TRANSFER_ACCOUNT_NOT_FOUND")).toBe(true);
    expect(isOwnershipLookupError("FORBIDDEN")).toBe(true);
  });

  it("does not flag ordinary validation / business-rule errors as a security signal", () => {
    expect(isOwnershipLookupError("INVALID_INPUT")).toBe(false);
    expect(isOwnershipLookupError("INVALID_AMOUNT")).toBe(false);
    expect(isOwnershipLookupError("ACCOUNT_ARCHIVED")).toBe(false);
    expect(isOwnershipLookupError("GOAL_WITHDRAWAL_EXCEEDS_PROGRESS")).toBe(false);
    expect(isOwnershipLookupError("BUDGET_ALREADY_EXISTS")).toBe(false);
  });

  it("exposes stable event names for the aggregator's alert rules", () => {
    expect(SECURITY_EVENT.ownershipLookupFailed).toBe("security.ownership_lookup_failed");
    expect(SECURITY_EVENT.actionUnexpectedError).toBe("action.unexpected_error");
  });
});
