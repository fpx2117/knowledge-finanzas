import { NextResponse } from "next/server";

import { checkDatabaseConnection } from "@know-finanzas/db";

export async function GET() {
  try {
    await checkDatabaseConnection();
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}
