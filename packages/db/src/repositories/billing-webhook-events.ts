import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import type { Database } from "../client";
import { billingWebhookEvents } from "../schema";

export function createBillingWebhookEventRepository(database: Database) {
  return {
    // Idempotent record: if the provider gives a stable event id, dedup on (provider, id) via
    // the partial unique index. Otherwise fall back to a (provider, payloadHash) lookup, since
    // Mercado Pago does not always guarantee a stable event id.
    async recordReceived(input: {
      provider: "MERCADO_PAGO";
      providerEventId: string | null;
      eventType: string;
      externalResourceId: string | null;
      payloadHash: string;
    }) {
      if (!input.providerEventId) {
        const [existing] = await database.select().from(billingWebhookEvents)
          .where(and(eq(billingWebhookEvents.provider, input.provider), eq(billingWebhookEvents.payloadHash, input.payloadHash)))
          .limit(1);
        if (existing) return { event: existing, created: false };

        const [created] = await database.insert(billingWebhookEvents)
          .values({
            provider: input.provider,
            providerEventId: null,
            eventType: input.eventType,
            externalResourceId: input.externalResourceId,
            payloadHash: input.payloadHash,
            status: "RECEIVED",
          })
          .returning();

        return { event: created, created: true };
      }

      // The unique index on (provider, providerEventId) is partial ("where providerEventId is
      // not null"), so Postgres only matches it as a conflict target when the same predicate is
      // repeated here.
      const inserted = await database.insert(billingWebhookEvents)
        .values({
          provider: input.provider,
          providerEventId: input.providerEventId,
          eventType: input.eventType,
          externalResourceId: input.externalResourceId,
          payloadHash: input.payloadHash,
          status: "RECEIVED",
        })
        .onConflictDoNothing({
          target: [billingWebhookEvents.provider, billingWebhookEvents.providerEventId],
          where: sql`${billingWebhookEvents.providerEventId} is not null`,
        })
        .returning();

      if (inserted[0]) return { event: inserted[0], created: true };

      const [existing] = await database.select().from(billingWebhookEvents)
        .where(and(eq(billingWebhookEvents.provider, input.provider), isNotNull(billingWebhookEvents.providerEventId), eq(billingWebhookEvents.providerEventId, input.providerEventId)))
        .limit(1);

      return { event: existing, created: false };
    },

    markProcessed(id: string) {
      return database.update(billingWebhookEvents)
        .set({ status: "PROCESSED", processedAt: new Date() })
        .where(eq(billingWebhookEvents.id, id))
        .returning()
        .then(([event]) => event);
    },

    markFailed(id: string, errorCode: string) {
      return database.update(billingWebhookEvents)
        .set({ status: "FAILED", processedAt: new Date(), errorCode })
        .where(eq(billingWebhookEvents.id, id))
        .returning()
        .then(([event]) => event);
    },

    markIgnored(id: string) {
      return database.update(billingWebhookEvents)
        .set({ status: "IGNORED", processedAt: new Date() })
        .where(eq(billingWebhookEvents.id, id))
        .returning()
        .then(([event]) => event);
    },

    findById(id: string) {
      return database.select().from(billingWebhookEvents).where(eq(billingWebhookEvents.id, id)).limit(1).then(([event]) => event);
    },

    // Unscoped by design: powers the admin reconciliation dashboard's failed-webhooks queue, a
    // system-wide operational view, not a per-user query.
    listFailed(limit: number) {
      return database.select().from(billingWebhookEvents)
        .where(eq(billingWebhookEvents.status, "FAILED"))
        .orderBy(desc(billingWebhookEvents.receivedAt))
        .limit(limit);
    },
  };
}
