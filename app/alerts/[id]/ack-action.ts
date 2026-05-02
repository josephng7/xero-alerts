"use server";

import { parseAlertId } from "@/lib/server/alert-id";
import { getAppBaseUrl } from "@/lib/server/app-base-url";

export type AckFormResult = { ok: true; message: string } | { ok: false; message: string };

export async function submitAlertAck(alertId: string): Promise<AckFormResult> {
  const secret = process.env.INTERNAL_ADMIN_SECRET;
  if (!secret) {
    return { ok: false, message: "Acknowledgement is not configured (missing INTERNAL_ADMIN_SECRET)" };
  }

  const id = parseAlertId(alertId);
  if (!id) {
    return { ok: false, message: "Invalid alert id" };
  }

  const url = new URL(`/api/alerts/${id}/ack`, getAppBaseUrl());
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-internal-api-secret": secret }
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string; acknowledgedAt?: string | null };
    if (!res.ok) {
      return { ok: false, message: body.message ?? `Acknowledgement failed (${res.status})` };
    }
    return { ok: true, message: body.message ?? "Alert acknowledged" };
  } catch {
    return { ok: false, message: "Acknowledgement request failed" };
  }
}
