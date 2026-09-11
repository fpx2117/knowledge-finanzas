import { NextResponse } from "next/server";
import { asc, gt } from "drizzle-orm";

import { env } from "@know-finanzas/config";
import { db, users } from "@know-finanzas/db";

import { createInsightService } from "@/features/insights/services/insight-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PAGE_SIZE = 150;

/**
 * WP-KAI-INSIGHTS-CRON — nightly insight generation per user. Insights are otherwise only
 * refreshed lazily when someone opens `/insights`; this keeps the queue current so KAI's
 * proactive engine has something to surface. Idempotent (reconcileInsights dedups). A platform
 * scheduler hits it with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) return NextResponse.json({ status: "disabled" }, { status: 404 });
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const service = createInsightService();
  let afterId: string | null = null;
  let processed = 0;
  let failed = 0;

  for (;;) {
    const page = await db
      .select({ id: users.id, timezone: users.timezone, baseCurrency: users.baseCurrency })
      .from(users)
      .where(afterId ? gt(users.id, afterId) : undefined)
      .orderBy(asc(users.id))
      .limit(PAGE_SIZE);
    if (page.length === 0) break;

    for (const user of page) {
      try {
        await service.refreshInsights({
          id: user.id,
          timezone: user.timezone ?? "UTC",
          baseCurrency: user.baseCurrency ?? "ARS",
        });
        processed += 1;
      } catch {
        failed += 1;
      }
    }

    afterId = page[page.length - 1]?.id ?? null;
    if (page.length < PAGE_SIZE) break;
  }

  return NextResponse.json({ status: "ok", processed, failed });
}
