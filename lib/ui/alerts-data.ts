import type { AlertRow } from "@/lib/db/alerts";
import { parseAlertId } from "@/lib/server/alert-id";
import { getAppBaseUrl } from "@/lib/server/app-base-url";

type ListResponse = {
  items: AlertRow[];
  nextCursor: string | null;
};

type AlertDetailResponse = {
  alert: AlertRow;
};

/**
 * Server-only: calls admin-protected alert list API with `INTERNAL_ADMIN_SECRET`.
 */
export async function getUiAlertsList(params?: { limit?: number }): Promise<{
  items: AlertRow[];
  nextCursor: string | null;
  unavailable: boolean;
}> {
  const secret = process.env.INTERNAL_ADMIN_SECRET;
  if (!secret) {
    return { items: [], nextCursor: null, unavailable: true };
  }

  const limit = params?.limit ?? 25;
  const url = new URL("/api/alerts", getAppBaseUrl());
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 100)));

  try {
    const res = await fetch(url, {
      headers: { "x-internal-api-secret": secret },
      cache: "no-store"
    });
    if (!res.ok) {
      return { items: [], nextCursor: null, unavailable: true };
    }
    const body = (await res.json()) as ListResponse;
    return {
      items: body.items ?? [],
      nextCursor: body.nextCursor ?? null,
      unavailable: false
    };
  } catch {
    return { items: [], nextCursor: null, unavailable: true };
  }
}

/**
 * Server-only: loads a single alert for the detail page.
 */
export async function getUiAlertById(id: string): Promise<{
  alert: AlertRow | null;
  unavailable: boolean;
}> {
  const secret = process.env.INTERNAL_ADMIN_SECRET;
  if (!secret) {
    return { alert: null, unavailable: true };
  }

  const alertId = parseAlertId(id);
  if (!alertId) {
    return { alert: null, unavailable: false };
  }

  const url = new URL(`/api/alerts/${alertId}`, getAppBaseUrl());
  try {
    const res = await fetch(url, {
      headers: { "x-internal-api-secret": secret },
      cache: "no-store"
    });
    if (res.status === 404) {
      return { alert: null, unavailable: false };
    }
    if (!res.ok) {
      return { alert: null, unavailable: true };
    }
    const body = (await res.json()) as AlertDetailResponse;
    return { alert: body.alert ?? null, unavailable: false };
  } catch {
    return { alert: null, unavailable: true };
  }
}
