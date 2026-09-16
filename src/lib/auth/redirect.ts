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

/**
 * Normalizes a redirect URL (absolute or relative) into a safe internal path.
 * If absolute, verifies that the origin matches the trusted application origin.
 */
export function normalizeRedirectTo(
  redirectTo: string | null | undefined,
  trustedOrigin: string
): string | null {
  if (!redirectTo) return null;

  if (isSafeRedirectPath(redirectTo)) {
    return redirectTo;
  }

  try {
    const url = new URL(redirectTo);
    const trusted = new URL(trustedOrigin);

    if (url.origin === trusted.origin) {
      const internalPath = `${url.pathname}${url.search}${url.hash}`;
      if (isSafeRedirectPath(internalPath)) {
        return internalPath;
      }
    }
  } catch {
    // URL parsing failed
  }

  return null;
}
