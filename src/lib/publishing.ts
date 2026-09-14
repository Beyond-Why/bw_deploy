const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * True when `publishedAt` (falling back to `date`, since most existing
 * content only carries that field) is within the last 7 days. Used by
 * NewTag — both server- and client-rendered, so this must be pure and
 * deterministic given `now`.
 */
export function isNew(publishedAt?: string, date?: string, now: Date = new Date()): boolean {
  const raw = publishedAt || date;
  if (!raw) return false;
  const published = new Date(raw);
  if (isNaN(published.getTime())) return false;
  const diff = now.getTime() - published.getTime();
  return diff >= 0 && diff < NEW_WINDOW_MS;
}
