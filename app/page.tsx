import Link from "next/link";

import { getUiAlertsList } from "@/lib/ui/alerts-data";
import { getUiDashboardBaseline } from "@/lib/ui/baseline";
import { formatOpsDateTime } from "@/lib/ui/format-ops-datetime";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [baseline, alertsList] = await Promise.all([getUiDashboardBaseline(), getUiAlertsList({ limit: 25 })]);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 920 }}>
      <h1>Xero Alerts Dashboard</h1>
      <p style={{ marginTop: "0.5rem" }}>Alerts and processing summary from persisted data and admin APIs.</p>
      <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "#555" }}>
        Times below are shown in <code>Asia/Shanghai</code> with explicit UTC offset (+08:00) to match ops logbook entries.
      </p>

      {alertsList.unavailable ? (
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Alert list is unavailable (set <code>INTERNAL_ADMIN_SECRET</code> and ensure the app can reach its own base
          URL for server-side fetches).
        </p>
      ) : null}

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Alerts</h2>
        {alertsList.items.length === 0 ? (
          <p>
            No alerts yet. Alerts are created when process-event detects contact bank detail changes for a connected
            organization.
          </p>
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
                  <td style={{ paddingTop: "0.5rem" }}>{formatOpsDateTime(alert.createdAt)}</td>
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
          <li>Latest webhook received: {formatOpsDateTime(baseline.latestWebhookReceivedAt)}</li>
          <li>Latest snapshot fetched: {formatOpsDateTime(baseline.snapshot?.fetchedAt ?? null)}</li>
          <li>Latest snapshot source: {baseline.snapshot?.source ?? "N/A"}</li>
          <li>Latest snapshot contact bank line count: {baseline.snapshot?.lineCount ?? 0}</li>
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
                  <td style={{ paddingTop: "0.5rem" }}>{formatOpsDateTime(event.receivedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
