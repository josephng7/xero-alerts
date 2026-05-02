import Link from "next/link";
import { notFound } from "next/navigation";

import { getUiAlertById } from "@/lib/ui/alerts-data";

import { AckForm } from "./ack-form";

export const dynamic = "force-dynamic";

function formatIso(iso: string | null) {
  if (!iso) {
    return "N/A";
  }
  return new Date(iso).toLocaleString();
}

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { alert, unavailable } = await getUiAlertById(id);

  if (unavailable) {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 760 }}>
        <p>
          <Link href="/">Back to dashboard</Link>
        </p>
        <h1>Alert unavailable</h1>
        <p>
          Configure <code>INTERNAL_ADMIN_SECRET</code> and server-side base URL so this page can load alert details.
        </p>
      </main>
    );
  }

  if (!alert) {
    notFound();
  }

  const diff = alert.diff;

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 760 }}>
      <p>
        <Link href="/">Back to dashboard</Link>
      </p>
      <h1>{alert.title}</h1>
      <p style={{ marginTop: "0.5rem", color: "#444" }}>
        Tenant <code>{alert.xeroTenantId}</code> · Source <code>{alert.source}</code>
      </p>
      <ul style={{ marginTop: "1rem" }}>
        <li>Created: {formatIso(alert.createdAt)}</li>
        <li>Status: {alert.acknowledgedAt ? `Acknowledged at ${formatIso(alert.acknowledgedAt)}` : "Open"}</li>
        {alert.webhookEventId ? (
          <li>
            Webhook event: <code>{alert.webhookEventId}</code>
          </li>
        ) : null}
        {alert.idempotencyKey ? (
          <li>
            Idempotency: <code>{alert.idempotencyKey}</code>
          </li>
        ) : null}
      </ul>

      <section style={{ marginTop: "1.25rem" }}>
        <h2>Diff summary</h2>
        <ul>
          <li>Previous accounts: {diff.summary.previousCount}</li>
          <li>Current accounts: {diff.summary.currentCount}</li>
          <li>Added: {diff.summary.addedCount}</li>
          <li>Removed: {diff.summary.removedCount}</li>
          <li>Changed: {diff.summary.changedCount}</li>
        </ul>
        <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
          Account IDs - added: {diff.added.length ? diff.added.join(", ") : "none"}; removed:{" "}
          {diff.removed.length ? diff.removed.join(", ") : "none"}; changed:{" "}
          {diff.changed.length ? diff.changed.join(", ") : "none"}
        </p>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <h2>Acknowledge</h2>
        <AckForm alertId={alert.id} initiallyAcknowledged={Boolean(alert.acknowledgedAt)} />
      </section>
    </main>
  );
}
