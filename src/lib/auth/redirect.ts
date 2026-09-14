/**
 * Guards against open-redirect targets. Only an internal, single-leading-
 * slash path is considered safe — this rejects absolute URLs
 * (`https://evil.com`), protocol-relative URLs (`//evil.com`), and
 * backslash tricks some browsers normalize to `//`.
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.includes("\\")) return false;
  return true;
}

export function safeRedirectPath(path: string | null | undefined, fallback = "/"): string {
  return isSafeRedirectPath(path) ? path : fallback;
}
