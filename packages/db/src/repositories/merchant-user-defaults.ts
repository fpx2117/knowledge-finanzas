import { and, eq } from "drizzle-orm";

import type { Database } from "../client";
import { merchantUserDefaults } from "../schema";

export type MerchantUserDefaultSource = "USER_EXPLICIT" | "MODEL";

export function createMerchantUserDefaultRepository(database: Database) {
  return {
    /** The user's personal canonical category for a merchant, if they have taught one. */
    findForUserMerchant(userId: string, merchantId: string) {
      return database
        .select({ taxonomyNodeId: merchantUserDefaults.taxonomyNodeId, source: merchantUserDefaults.source })
        .from(merchantUserDefaults)
        .where(and(eq(merchantUserDefaults.userId, userId), eq(merchantUserDefaults.merchantId, merchantId)))
        .limit(1)
        .then(([row]) => row);
    },

    listForUser(userId: string) {
      return database
        .select({
          merchantId: merchantUserDefaults.merchantId,
          taxonomyNodeId: merchantUserDefaults.taxonomyNodeId,
          source: merchantUserDefaults.source,
        })
        .from(merchantUserDefaults)
        .where(eq(merchantUserDefaults.userId, userId));
    },

    /** Insert or replace the user's override for a merchant. Unique on (user, merchant). */
    upsert(input: {
      userId: string;
      merchantId: string;
      taxonomyNodeId: string;
      source?: MerchantUserDefaultSource;
      confidence?: number;
    }) {
      const source = input.source ?? "USER_EXPLICIT";
      const confidence = (input.confidence ?? 1).toFixed(3);
      return database
        .insert(merchantUserDefaults)
        .values({
          userId: input.userId,
          merchantId: input.merchantId,
          taxonomyNodeId: input.taxonomyNodeId,
          source,
          confidence,
        })
        .onConflictDoUpdate({
          target: [merchantUserDefaults.userId, merchantUserDefaults.merchantId],
          set: { taxonomyNodeId: input.taxonomyNodeId, source, confidence, updatedAt: new Date() },
        })
        .returning()
        .then(([row]) => row);
    },
  };
}
