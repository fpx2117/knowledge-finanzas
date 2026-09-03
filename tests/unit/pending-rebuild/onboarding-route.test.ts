import { describe, expect, it } from "vitest";
import { resolveOnboardingGate, type AccessRouteProductAccessState } from "../../apps/web/src/features/onboarding/services/resolve-onboarding-route";

const ACCESS_STATES: AccessRouteProductAccessState[] = ["NO_ACCESS", "TRIAL", "PRO", "EXPIRED_READ_ONLY"];

describe("resolveOnboardingGate", () => {
  it("routes to ONBOARDING for NOT_STARTED/IN_PROGRESS regardless of access state or financial onboarding", () => {
    for (const onboardingStatus of ["NOT_STARTED", "IN_PROGRESS"] as const) {
      for (const productAccessState of ACCESS_STATES) {
        for (const financialOnboardingCompleted of [true, false]) {
          expect(resolveOnboardingGate({ onboardingStatus, productAccessState, financialOnboardingCompleted })).toEqual({ destination: "ONBOARDING" });
        }
      }
    }
  });

  it("routes COMPLETED + NO_ACCESS to ACCESS_SELECTION regardless of financial onboarding", () => {
    for (const financialOnboardingCompleted of [true, false]) {
      expect(resolveOnboardingGate({ onboardingStatus: "COMPLETED", productAccessState: "NO_ACCESS", financialOnboardingCompleted })).toEqual({ destination: "ACCESS_SELECTION" });
    }
  });

  it("routes COMPLETED + EXPIRED_READ_ONLY straight to CONTINUE (read-only app access), never blocked on financial onboarding", () => {
    for (const financialOnboardingCompleted of [true, false]) {
      expect(resolveOnboardingGate({ onboardingStatus: "COMPLETED", productAccessState: "EXPIRED_READ_ONLY", financialOnboardingCompleted })).toEqual({ destination: "CONTINUE" });
    }
  });

  it("routes COMPLETED + (TRIAL/PRO) + financial onboarding not done to FINANCIAL_ONBOARDING", () => {
    for (const productAccessState of ["TRIAL", "PRO"] as const) {
      expect(resolveOnboardingGate({ onboardingStatus: "COMPLETED", productAccessState, financialOnboardingCompleted: false })).toEqual({ destination: "FINANCIAL_ONBOARDING" });
    }
  });

  it("routes COMPLETED + (TRIAL/PRO) + financial onboarding done to CONTINUE", () => {
    for (const productAccessState of ["TRIAL", "PRO"] as const) {
      expect(resolveOnboardingGate({ onboardingStatus: "COMPLETED", productAccessState, financialOnboardingCompleted: true })).toEqual({ destination: "CONTINUE" });
    }
  });
});
