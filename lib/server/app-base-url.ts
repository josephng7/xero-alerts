/**
 * Base URL for server-side HTTP calls back into this app (e.g. internal API routes).
 */
export function getAppBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const nextAuth = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (nextAuth) {
    return nextAuth;
  }
  return "http://localhost:3000";
}
