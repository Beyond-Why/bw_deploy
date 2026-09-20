/** Formats a stored username as an @handle for display — dedupes an
 *  already-prefixed handle rather than doubling the "@", and returns null
 *  for an empty/missing one so callers can fall back to something else
 *  instead of rendering a bare "@". Shared by the Deep Dive discussion and
 *  the profile's Recent Comments, so both surfaces treat a handle the
 *  same way. */
export function formatHandle(handle: string | null | undefined): string | null {
  const trimmed = (handle ?? "").trim();
  if (!trimmed) return null;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}
