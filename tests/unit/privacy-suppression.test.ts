import { describe, expect, it } from "vitest";
import { DEFAULT_MIN_EXTERNAL_COHORT_SIZE, generateCohortAggregateV1, isCohortSuppressed, type EligibleUserMetricInput } from "@know-finanzas/privacy";

describe("isCohortSuppressed", () => {
  it("suppresses a cohort below the default minimum", () => {
    expect(isCohortSuppressed(99)).toBe(true);
  });

  it("does not suppress a cohort exactly at the default minimum", () => {
    expect(isCohortSuppressed(DEFAULT_MIN_EXTERNAL_COHORT_SIZE)).toBe(false);
  });

  it("respects a custom minimum", () => {
    expect(isCohortSuppressed(50, 10)).toBe(false);
    expect(isCohortSuppressed(5, 10)).toBe(true);
  });
});

function cohortOf(count: number, value = 0.2): EligibleUserMetricInput[] {
  return Array.from({ length: count }, () => ({
    cohortKey: { regionBucket: "AR", ageBucket: "25-34", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME" },
    metrics: { savings_rate: value },
  }));
}

describe("generateCohortAggregateV1", () => {
  it("suppresses a cohort below the threshold — median/p25/p75 are never computed at all", () => {
    const rows = generateCohortAggregateV1({ eligibleUsers: cohortOf(50), period: "2026-06", minCohortSize: 100 });
    expect(rows).toHaveLength(1);
    expect(rows[0].suppressed).toBe(true);
    expect(rows[0].medianValue).toBeNull();
    expect(rows[0].p25Value).toBeNull();
    expect(rows[0].p75Value).toBeNull();
    expect(rows[0].cohortSizeBucket).toBe("<100");
  });

  it("reveals stats for a cohort at or above the threshold", () => {
    const rows = generateCohortAggregateV1({ eligibleUsers: cohortOf(120, 0.3), period: "2026-06", minCohortSize: 100 });
    expect(rows[0].suppressed).toBe(false);
    expect(rows[0].medianValue).toBe(0.3);
    expect(rows[0].cohortSizeBucket).toBe("100-249");
  });

  it("never includes a user identifier of any kind in the output rows", () => {
    const rows = generateCohortAggregateV1({ eligibleUsers: cohortOf(120), period: "2026-06" });
    for (const row of rows) {
      expect(Object.keys(row)).not.toContain("userId");
      expect(Object.keys(row)).not.toContain("accountId");
      expect(Object.keys(row)).not.toContain("transactionId");
    }
  });

  it("groups separately per cohort key and per metric code, never mixing cohorts", () => {
    const groupA: EligibleUserMetricInput[] = Array.from({ length: 150 }, () => ({
      cohortKey: { regionBucket: "AR", ageBucket: "25-34", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME" },
      metrics: { savings_rate: 0.1 },
    }));
    const groupB: EligibleUserMetricInput[] = Array.from({ length: 150 }, () => ({
      cohortKey: { regionBucket: "AR", ageBucket: "35-44", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME" },
      metrics: { savings_rate: 0.9 },
    }));

    const rows = generateCohortAggregateV1({ eligibleUsers: [...groupA, ...groupB], period: "2026-06" });
    expect(rows).toHaveLength(2);
    const byAge = Object.fromEntries(rows.map((row) => [row.ageBucket, row.medianValue]));
    expect(byAge["25-34"]).toBe(0.1);
    expect(byAge["35-44"]).toBe(0.9);
  });

  it("excludes null metric values from a cohort rather than treating them as zero", () => {
    const users: EligibleUserMetricInput[] = [
      ...cohortOf(150, 0.5),
      { cohortKey: { regionBucket: "AR", ageBucket: "25-34", incomeBucket: "MIDDLE", employmentBucket: "EMPLOYED_FULL_TIME" }, metrics: { savings_rate: null } },
    ];
    const rows = generateCohortAggregateV1({ eligibleUsers: users, period: "2026-06" });
    expect(rows[0].cohortSizeBucket).toBe("100-249");
    // 150, not 151 — the null entry never entered the cohort.
    expect(rows[0].medianValue).toBe(0.5);
  });
});
