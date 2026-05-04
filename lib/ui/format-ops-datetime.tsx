/**
 * Operator-facing datetimes: fixed IANA zone matching ops logbook (+08:00).
 * Shared across dashboard and alert detail server components.
 */

export const OPS_DISPLAY_TIME_ZONE = "Asia/Shanghai" as const;

/**
 * Formats an ISO-8601 instant for display in {@link OPS_DISPLAY_TIME_ZONE}
 * with an explicit numeric offset and zone id (e.g. `+08:00 (Asia/Shanghai)`).
 */
export function formatOpsDateTime(iso: string | null): string {
  if (!iso) {
    return "N/A";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: OPS_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset"
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const offsetRaw = get("timeZoneName");
  const offset = offsetRaw.replace(/^GMT/i, "").trim();

  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get(
    "second"
  )} ${offset} (${OPS_DISPLAY_TIME_ZONE})`;
}
