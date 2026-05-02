import { z } from "zod";

const alertIdSchema = z.string().uuid();

/** Strict UUID parse for alert primary keys — avoids SSRF/path injection in internal fetch URLs. */
export function parseAlertId(raw: string): string | null {
  const parsed = alertIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
