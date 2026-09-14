const SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Derives a username from a display name, e.g. "Madhav Bangad" →
 * "madhav_bangad_k7p2": lowercase, spaces to underscores, strip
 * anything outside [a-z0-9_], then append a 4-character random
 * alphanumeric suffix so two people with the same name don't collide.
 *
 * Used both client-side at signup (before the account exists) and
 * server-side in /api/auth/complete-profile for Google sign-ins that
 * didn't get a chance to generate one there — same algorithm, so the
 * result looks the same regardless of which path produced it. The
 * `handle_new_user` DB trigger re-sanitizes whatever it's given anyway,
 * so this doesn't need to be perfectly collision-proof on its own.
 */
export function generateUsername(name: string): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "") || "user";

  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }

  return `${base}_${suffix}`;
}
