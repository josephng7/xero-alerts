import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db/index";

export async function GET() {
  try {
    const db = getDb();
    const [{ server_time: serverTime }] = await db.execute<{ server_time: string }>(
      sql`select now()::text as server_time`
    );

    return NextResponse.json(
      { status: "ok", service: "xero-alerts", db: { status: "ok", serverTime } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check database probe failed", error);
    return NextResponse.json(
      { status: "degraded", service: "xero-alerts", db: { status: "error", message: "db unavailable" } },
      { status: 503 }
    );
  }
}
