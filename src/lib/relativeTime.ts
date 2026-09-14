const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Simple relative-time formatter — "Saved 3 days ago" style, no date library. */
export function formatSavedAt(iso: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());

  if (diffMs < MINUTE) return "Saved just now";

  const units: [number, string][] = [
    [YEAR, "year"],
    [MONTH, "month"],
    [WEEK, "week"],
    [DAY, "day"],
    [HOUR, "hour"],
    [MINUTE, "minute"],
  ];

  for (const [unitMs, label] of units) {
    if (diffMs >= unitMs) {
      const n = Math.floor(diffMs / unitMs);
      return `Saved ${n} ${label}${n === 1 ? "" : "s"} ago`;
    }
  }

  return "Saved just now";
}
