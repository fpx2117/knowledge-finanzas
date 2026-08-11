import { describe, expect, it, vi } from "vitest";
import { createAdminAdjustCredits } from "@know-finanzas/ai";

describe("createAdminAdjustCredits", () => {
  it("delegates directly to the repository's adjustBalance and returns the entry id on success", async () => {
    const repository = { adjustBalance: vi.fn(async () => ({ ok: true as const, entry: { id: "entry-1" } })) };
    const adjust = createAdminAdjustCredits({ repository });

    const result = await adjust({ userId: "user-1", pool: "PLAN_ALLOWANCE", amount: 50, direction: "CREDIT", reason: "support case", adminUserId: "admin-1" });

    expect(result).toEqual({ ok: true, entryId: "entry-1" });
    expect(repository.adjustBalance).toHaveBeenCalledWith({ userId: "user-1", pool: "PLAN_ALLOWANCE", amount: 50, direction: "CREDIT", reason: "support case", adminUserId: "admin-1" });
  });

  it("surfaces the negative-balance guard's available amount on rejection, without throwing", async () => {
    const repository = { adjustBalance: vi.fn(async () => ({ ok: false as const, available: 5 })) };
    const adjust = createAdminAdjustCredits({ repository });

    const result = await adjust({ userId: "user-1", pool: "PLAN_ALLOWANCE", amount: 50, direction: "DEBIT", reason: "support case", adminUserId: "admin-1" });

    expect(result).toEqual({ ok: false, available: 5 });
  });
});
