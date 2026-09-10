import { NextResponse } from "next/server";

import { env } from "@know-finanzas/config";
import { createUserRepository, db } from "@know-finanzas/db";

import { evaluateFinancialAlerts } from "@/features/notifications/services/evaluate-financial-alerts.instance";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PAGE_SIZE = 200;

// Recurring notification sweep: debt/obligation reminders, promotion-expiry and trial countdowns.
// `evaluateFinancialAlerts` (and the notify pipeline it calls) own dedup + the premium-access
// gate, so this is safe to run on any cadence. A platform scheduler (Vercel/Railway cron) hits it
// with `Authorization: Bearer <CRON_SECRET>`; without CRON_SECRET the route is closed.
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ status: "disabled" }, { status: 404 });
  }
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const users = createUserRepository(db);
  const now = new Date();
  let afterId: string | null = null;
  let processed = 0;
  let failed = 0;

  for (;;) {
    const page = await users.listForNotificationSweep({ limit: PAGE_SIZE, afterId });
    if (page.length === 0) break;

    for (const user of page) {
      try {
        await evaluateFinancialAlerts({
          userId: user.id,
          userTimezone: user.timezone ?? "UTC",
          now,
          trialEndsAt: user.trialEndsAt ?? null,
        });
        processed += 1;
      } catch {
        // One user's failure must not abort the sweep — the delivery rows record their own errors.
        failed += 1;
      }
    }

    afterId = page[page.length - 1]?.id ?? null;
    if (page.length < PAGE_SIZE) break;
  }

  return NextResponse.json({ status: "ok", processed, failed });
}
