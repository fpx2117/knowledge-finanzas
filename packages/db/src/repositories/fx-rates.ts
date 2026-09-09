import { and, desc, eq } from "drizzle-orm";

import type { Database } from "../client";
import { fxRates, type FxRate } from "../schema";

export type FxRateSource = FxRate["source"];

export type FxRateInput = {
  source: FxRateSource;
  base: string;
  quote: string;
  bid: string;
  ask: string;
  asOf: Date;
};

export function createFxRateRepository(database: Database) {
  return {
    /** The quote currently in effect for a pair — newest by when we fetched it. */
    async getLatest(source: FxRateSource, base: string, quote: string): Promise<FxRate | null> {
      const [row] = await database
        .select()
        .from(fxRates)
        .where(and(eq(fxRates.source, source), eq(fxRates.base, base), eq(fxRates.quote, quote)))
        .orderBy(desc(fxRates.fetchedAt))
        .limit(1);
      return row ?? null;
    },

    /**
     * Stores a freshly fetched quote. If the source hasn't published a new `asOf` since the
     * last time (same source+pair+asOf), the insert is a no-op — we still return the row in
     * effect so callers can read `fetchedAt`. Pass `touch` to bump `fetchedAt` on that
     * existing row so staleness checks reset even when the provider's value didn't move.
     */
    async record(input: FxRateInput, options: { touch?: boolean } = {}): Promise<FxRate> {
      const [inserted] = await database
        .insert(fxRates)
        .values({
          source: input.source,
          base: input.base,
          quote: input.quote,
          bid: input.bid,
          ask: input.ask,
          asOf: input.asOf,
        })
        .onConflictDoUpdate({
          target: [fxRates.source, fxRates.base, fxRates.quote, fxRates.asOf],
          set: options.touch
            ? { fetchedAt: new Date(), bid: input.bid, ask: input.ask }
            : { bid: input.bid, ask: input.ask },
        })
        .returning();
      return inserted;
    },
  };
}
