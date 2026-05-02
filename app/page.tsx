import Link from "next/link";

import { getUiAlertsList } from "@/lib/ui/alerts-data";
import { getUiDashboardBaseline } from "@/lib/ui/baseline";

export const dynamic = "force-dynamic";

function formatIso(iso: string | null) {
  if (!iso) {
    return "N/A";
  }
  return new Date(iso).toLocaleString();
}

export default async function HomePage() {
  const [baseline, alertsList] = await Promise.all([getUiDashboardBaseline(), getUiAlertsList({ limit: 25 })]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 920 }}>
      <h1>Xero Alerts Dashboard</h1>
      <p style={{ marginTop: "0.5rem" }}>Alerts and processing summary from persisted data and admin APIs.</p>

      {alertsList.unavailable ? (
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Alert list is unavailable (set <code>INTERNAL_ADMIN_SECRET</code> and ensure the app can reach its own base
          URL for server-side fetches).
        </p>
      ) : null}

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Alerts</h2>
        {alertsList.items.length === 0 ? (
          <p>No alerts yet. Alerts are created when process-event detects account changes for a connected organization.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Title</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Tenant</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Status</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {alertsList.items.map((alert) => (
                <tr key={alert.id}>
                  <td style={{ paddingTop: "0.5rem" }}>
                    <Link href={`/alerts/${alert.id}`}>{alert.title}</Link>
                  </td>
                  <td style={{ paddingTop: "0.5rem" }}>{alert.xeroTenantId}</td>
                  <td style={{ paddingTop: "0.5rem" }}>{alert.acknowledgedAt ? "Acknowledged" : "Open"}</td>
                  <td style={{ paddingTop: "0.5rem" }}>{formatIso(alert.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {alertsList.nextCursor ? (
          <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "#666" }}>More alerts exist; increase limit via API for now.</p>
        ) : null}
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Latest processing/snapshot summary</h2>
        <ul>
          <li>Latest webhook received: {formatIso(baseline.latestWebhookReceivedAt)}</li>
          <li>Latest snapshot fetched: {formatIso(baseline.snapshot?.fetchedAt ?? null)}</li>
          <li>Latest snapshot source: {baseline.snapshot?.source ?? "N/A"}</li>
          <li>Latest snapshot account count: {baseline.snapshot?.accountCount ?? 0}</li>
        </ul>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Recent webhook events</h2>
        {baseline.webhookEvents.length === 0 ? (
          <p>No webhook events yet.</p>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Event</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Category</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Status</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem" }}>Received</th>
              </tr>
            </thead>
            <tbody>
              {baseline.webhookEvents.map((event) => (
                <tr key={event.id}>
                  <td style={{ paddingTop: "0.5rem" }}>{event.id.slice(0, 8)}...</td>
                  <td style={{ paddingTop: "0.5rem" }}>{event.eventCategory ?? "N/A"}</td>
                  <td style={{ paddingTop: "0.5rem" }}>{event.status}</td>
                  <td style={{ paddingTop: "0.5rem" }}>{formatIso(event.receivedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
