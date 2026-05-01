export type NotificationDiffSummary = {
  previousCount: number;
  currentCount: number;
  addedCount: number;
  removedCount: number;
  changedCount: number;
};

export type NotificationDiff = {
  added: string[];
  removed: string[];
  changed: string[];
  summary: NotificationDiffSummary;
};

export type NotificationPayload = {
  tenantId: string;
  idempotencyKey?: string;
  diff: NotificationDiff;
};

export function isActionableDiff(summary: NotificationDiffSummary): boolean {
  return summary.addedCount > 0 || summary.removedCount > 0 || summary.changedCount > 0;
}
