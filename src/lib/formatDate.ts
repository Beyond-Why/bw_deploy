/** "Sep 14, 2026" — the site-wide short date format used on Deep Dive
 *  cards and the episode reader header. */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const DAY_LABEL_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Tue 11 Nov" — the Builder Log's per-log date. Assembled from en-US
 *  parts (always three-letter months; en-GB now gives "Sept") in
 *  day-month order. Frontmatter dates are plain YYYY-MM-DD (parsed as UTC
 *  midnight), so this formats in UTC to avoid slipping a day in timezones
 *  west of Greenwich. Accepts a Date too, since gray-matter parses
 *  unquoted YAML dates into one. */
export function formatDayLabel(date?: string | Date): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const parts = Object.fromEntries(
    DAY_LABEL_FORMAT.formatToParts(d).map((part) => [part.type, part.value])
  );
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}
