import { NextResponse } from "next/server";

// Pure liveness (docs/18-production-readiness.md §37): "is the process alive," no dependencies
// checked at all — never touches the database, never blocks on a slow provider. A platform's
// liveness probe hitting this should only ever fail if the process itself is unresponsive.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
