import { z } from "zod";

import {
  buildNotificationSubject,
  formatEmailHtmlMessage,
  formatTeamsMessage
} from "@/lib/notifications/formatting";
import { isActionableDiff, type NotificationDiffSummary, type NotificationPayload } from "@/lib/notifications/logic";
import { sendEmailNotification, sendTeamsNotification } from "@/lib/notifications/senders";
import {
  recordNotifyDispatchIfNew,
  removeNotifyDispatchByDedupeKey
} from "@/lib/db/notify-dispatches";
import type { Env } from "@/lib/env";

export const notifyPayloadSchema = z.object({
  tenantId: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
  diff: z.object({
    added: z.array(z.string()).default([]),
    removed: z.array(z.string()).default([]),
    changed: z.array(z.string()).default([]),
    summary: z.object({
      previousCount: z.number().int().nonnegative(),
      currentCount: z.number().int().nonnegative(),
      addedCount: z.number().int().nonnegative(),
      removedCount: z.number().int().nonnegative(),
      changedCount: z.number().int().nonnegative()
    })
  })
});

export type NotifyJobResult = {
  message: string;
  status: "no-op" | "deduped" | "sent" | "no-delivery";
  tenantId: string;
  idempotencyKey: string | null;
  dedupeKey?: string;
  channels: {
    teams: Awaited<ReturnType<typeof sendTeamsNotification>>;
    email: Awaited<ReturnType<typeof sendEmailNotification>>;
  };
};

export async function runNotifyJob(payload: NotificationPayload, env: Env): Promise<NotifyJobResult> {
  const summary = payload.diff.summary as NotificationDiffSummary;

  if (!isActionableDiff(summary)) {
    return {
      message: "No actionable changes; notification skipped",
      status: "no-op",
      tenantId: payload.tenantId,
      idempotencyKey: payload.idempotencyKey ?? null,
      channels: {
        teams: { status: "skipped", reason: "no-actionable-changes" },
        email: { status: "skipped", reason: "no-actionable-changes" }
      }
    };
  }

  const claimed = await recordNotifyDispatchIfNew(payload);
  if (!claimed.inserted) {
    return {
      message: "Duplicate notification digest; dispatch skipped",
      status: "deduped",
      tenantId: payload.tenantId,
      idempotencyKey: payload.idempotencyKey ?? null,
      dedupeKey: claimed.dedupeKey,
      channels: {
        teams: { status: "skipped", reason: "duplicate-digest" },
        email: { status: "skipped", reason: "duplicate-digest" }
      }
    };
  }

  const subject = buildNotificationSubject(payload.tenantId, summary);
  const teamsResult = await sendTeamsNotification({
    webhookUrl: env.TEAMS_WEBHOOK_URL,
    text: formatTeamsMessage(payload)
  });
  const emailResult = await sendEmailNotification({
    apiKey: env.RESEND_API_KEY,
    from: env.ALERTS_FROM_EMAIL,
    to: env.ALERTS_TO_EMAIL,
    subject,
    html: formatEmailHtmlMessage(payload)
  });

  if (teamsResult.status !== "sent" && emailResult.status !== "sent") {
    await removeNotifyDispatchByDedupeKey(claimed.dedupeKey);
    return {
      message: "Notify job completed with no successful deliveries",
      status: "no-delivery",
      tenantId: payload.tenantId,
      idempotencyKey: payload.idempotencyKey ?? null,
      dedupeKey: claimed.dedupeKey,
      channels: {
        teams: teamsResult,
        email: emailResult
      }
    };
  }

  return {
    message: "Notify job completed",
    status: "sent",
    tenantId: payload.tenantId,
    idempotencyKey: payload.idempotencyKey ?? null,
    dedupeKey: claimed.dedupeKey,
    channels: {
      teams: teamsResult,
      email: emailResult
    }
  };
}
