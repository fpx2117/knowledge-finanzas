import { desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { analyticsCohortMetrics } from "../schema";

export function createCohortMetricRepository(database: Database) {
  return {
    // Replaces the prior run's rows for the same period wholesale (each GenerateCohortAggregate:v1
    // run is a fresh, complete snapshot for that period — never a partial patch that could leave
    // stale cohorts from a differently-consented population mixed into the current view).
    async replaceForPeriod(period: string, rows: Array<{
      period: string; regionBucket: string; ageBucket: string; incomeBucket: string; employmentBucket: string;
      metricCode: string; cohortSizeBucket: string; suppressed: boolean;
      medianValue: number | null; p25Value: number | null; p75Value: number | null; privacyVersion: string;
    }>) {
      return database.transaction(async (tx) => {
        await tx.delete(analyticsCohortMetrics).where(eq(analyticsCohortMetrics.period, period));
        if (rows.length === 0) return [];
        return tx.insert(analyticsCohortMetrics).values(rows.map((row) => ({
          ...row,
          medianValue: row.medianValue === null ? null : row.medianValue.toString(),
          p25Value: row.p25Value === null ? null : row.p25Value.toString(),
          p75Value: row.p75Value === null ? null : row.p75Value.toString(),
        }))).returning();
      });
    },

    listForPeriod(period: string) {
      return database.select().from(analyticsCohortMetrics).where(eq(analyticsCohortMetrics.period, period));
    },

    async findLatestCohortPeriod() {
      const [row] = await database.select({ period: analyticsCohortMetrics.period }).from(analyticsCohortMetrics)
        .orderBy(desc(analyticsCohortMetrics.generatedAt))
        .limit(1);
      return row?.period ?? null;
    },

    // Admin summary counts — never a per-row/per-user explorer (Security Requirement).
    async countRowsForPeriod(period: string, options: { suppressedOnly?: boolean } = {}) {
      const rows = await this.listForPeriod(period);
      return options.suppressedOnly ? rows.filter((row) => row.suppressed).length : rows.length;
    },
  };
}
