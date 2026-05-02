/**
 * Public base URL for server-side calls into this app (OAuth redirect URI, QStash target, internal fetches).
 * Prefer explicit `NEXTAUTH_URL` (e.g. custom domain) over `VERCEL_URL` (often *.vercel.app).
 */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
