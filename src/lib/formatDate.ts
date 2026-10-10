/** "Sep 14, 2026" — the site-wide short date format used on Deep Dive
 *  cards and the episode reader header. */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
