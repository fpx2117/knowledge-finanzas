import { NextResponse } from "next/server";

import { env } from "@know-finanzas/config";

import { refreshBlueQuote } from "@/features/fx/services/fx-service";

export const dynamic = "force-dynamic";

// Scheduled refresh of the dólar-blue quote (dolarapi). A platform scheduler (Vercel/Railway
// cron) hits this with `Authorization: Bearer <CRON_SECRET>`; without CRON_SECRET configured the
// route is closed (the on-demand path in fx-service still refreshes lazily on read).
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ status: "disabled" }, { status: 404 });
  }
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    const quote = await refreshBlueQuote();
    return NextResponse.json({ status: "ok", bid: quote.bid, ask: quote.ask, asOf: quote.asOf });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: error instanceof Error ? error.message : "unknown" },
      { status: 502 },
    );
  }
}
