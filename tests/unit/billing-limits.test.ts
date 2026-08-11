import { describe, expect, it } from "vitest";
import { computeRemaining, isLimitReached, resolveLimit, UNLIMITED, type LimitConfig } from "@know-finanzas/billing";

const config: LimitConfig = {
  trialAiCreditsTotal: 50,
  trialWhatsAppTotal: 3,
  proAiCreditsPerPeriod: 300,
  proWhatsAppPerPeriod: 20,
};

describe("plan limits", () => {
  it("resolves the trial allowance for ai credits and whatsapp", () => {
    expect(resolveLimit("TRIAL", "ai.credits", config)).toBe(50);
    expect(resolveLimit("TRIAL", "whatsapp.allowance", config)).toBe(3);
  });

  it("resolves the pro per-period allowance for ai credits and whatsapp", () => {
    expect(resolveLimit("PRO", "ai.credits", config)).toBe(300);
    expect(resolveLimit("PRO", "whatsapp.allowance", config)).toBe(20);
  });

  it("resolves a zero limit for EXPIRED_READ_ONLY", () => {
    expect(resolveLimit("EXPIRED_READ_ONLY", "ai.credits", config)).toBe(0);
    expect(resolveLimit("EXPIRED_READ_ONLY", "whatsapp.allowance", config)).toBe(0);
  });

  it("computes remaining as limit minus used, never below zero", () => {
    expect(computeRemaining(50, 20)).toBe(30);
    expect(computeRemaining(50, 60)).toBe(0);
  });

  it("treats UNLIMITED as always remaining and never reached", () => {
    expect(computeRemaining(UNLIMITED, 999999)).toBe(UNLIMITED);
    expect(isLimitReached(UNLIMITED, 999999)).toBe(false);
  });

  it("flags a finite limit as reached once used meets or exceeds it", () => {
    expect(isLimitReached(50, 49)).toBe(false);
    expect(isLimitReached(50, 50)).toBe(true);
    expect(isLimitReached(50, 51)).toBe(true);
  });
});
