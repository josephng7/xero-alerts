import type { NotificationDiffSummary, NotificationPayload } from "@/lib/notifications/logic";

function formatCountLine(label: string, count: number): string {
  return `${label}: ${count}`;
}

export function buildNotificationSubject(
  tenantId: string,
  summary: NotificationDiffSummary
): string {
  return `Xero alerts update for ${tenantId} (+${summary.addedCount} / -${summary.removedCount} / ~${summary.changedCount})`;
}

export function formatTeamsMessage(payload: NotificationPayload): string {
  const { tenantId, idempotencyKey, diff } = payload;
  const lines = [
    `Xero account changes detected for tenant ${tenantId}.`,
    formatCountLine("Added", diff.summary.addedCount),
    formatCountLine("Removed", diff.summary.removedCount),
    formatCountLine("Changed", diff.summary.changedCount)
  ];

  if (idempotencyKey) {
    lines.push(`Event key: ${idempotencyKey}`);
  }

  return lines.join("\n");
}

export function formatEmailHtmlMessage(payload: NotificationPayload): string {
  const { tenantId, idempotencyKey, diff } = payload;
  const keyLine = idempotencyKey ? `<p><strong>Event key:</strong> ${idempotencyKey}</p>` : "";

  return [
    "<h2>Xero account changes detected</h2>",
    `<p><strong>Tenant:</strong> ${tenantId}</p>`,
    "<ul>",
    `<li>Added: ${diff.summary.addedCount}</li>`,
    `<li>Removed: ${diff.summary.removedCount}</li>`,
    `<li>Changed: ${diff.summary.changedCount}</li>`,
    "</ul>",
    keyLine
  ].join("");
}
