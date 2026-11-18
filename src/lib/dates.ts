// Pure date helpers for content dates written as "YYYY-MM-DD".
// They never read the clock: anything relative ("2 days ago") takes the
// reference day as an argument, so server and client render the same text.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

/** "2026-12-07" → UTC midnight in ms. Throws on anything else. */
export function isoDayToUtc(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Expected a YYYY-MM-DD date, got "${iso}"`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** "2026-12-07" → "7 Dec". */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

/** Whole days from `from` to `to` (both YYYY-MM-DD); negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((isoDayToUtc(to) - isoDayToUtc(from)) / DAY_MS);
}

/** "Today", "Yesterday", "3 days ago", else "7 Dec". */
export function relativeDay(iso: string, today: string): string {
  const ago = daysBetween(iso, today);
  if (ago <= 0) return "Today";
  if (ago === 1) return "Yesterday";
  if (ago < 7) return `${ago} days ago`;
  return formatDayMonth(iso);
}
