import { describe, expect, it } from "vitest";
import { bucketCohortSize, isEligibleForAggregation } from "@know-finanzas/privacy";

describe("isEligibleForAggregation", () => {
  it("is eligible only with granted consent and a non-internal account", () => {
    expect(isEligibleForAggregation({ externalAggregatedStatisticsConsentGranted: true, isInternalOrTestAccount: false })).toBe(true);
  });

  it("is not eligible without consent", () => {
    expect(isEligibleForAggregation({ externalAggregatedStatisticsConsentGranted: false, isInternalOrTestAccount: false })).toBe(false);
  });

  it("is not eligible for an internal/test account even with consent granted", () => {
    expect(isEligibleForAggregation({ externalAggregatedStatisticsConsentGranted: true, isInternalOrTestAccount: true })).toBe(false);
  });
});

describe("bucketCohortSize", () => {
  it("buckets sizes into coarse, non-exact ranges", () => {
    expect(bucketCohortSize(0)).toBe("<100");
    expect(bucketCohortSize(99)).toBe("<100");
    expect(bucketCohortSize(100)).toBe("100-249");
    expect(bucketCohortSize(999)).toBe("500-999");
    expect(bucketCohortSize(10000)).toBe("5000+");
  });
});
