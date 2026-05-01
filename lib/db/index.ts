import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sql: ReturnType<typeof postgres> | undefined;
};

function getSql(url: string) {
  if (!globalForDb.sql) {
    globalForDb.sql = postgres(url, { max: 10 });
  }
  return globalForDb.sql;
}

/**
 * Returns a Drizzle instance backed by a shared `postgres.js` client.
 * Set `DATABASE_URL` to your Supabase Postgres URI (pooler recommended for Next.js).
 * Safe to call from route handlers; reuses one pool in dev via `globalThis`.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = getSql(url);
  return drizzle(sql, { schema });
}

export * from "./schema";
