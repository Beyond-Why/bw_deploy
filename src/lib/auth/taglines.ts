export const AUTH_TAGLINES = [
  "Think deeper. Read better.",
  "Every answer opens another question.",
  "Curiosity is a better teacher than certainty.",
  "The obvious is rarely the whole story.",
  "Follow the question a little further.",
  "Look closer. There is more underneath.",
  "Understand first. Decide later.",
] as const;

export const DEFAULT_AUTH_TAGLINE = AUTH_TAGLINES[0];

const STORAGE_KEY_TAGLINE = "beyondwhy_auth_tagline";
const STORAGE_KEY_EXPIRES = "beyondwhy_auth_tagline_expires";
const ONE_HOUR_MS = 60 * 60 * 1000;

export function getPersistedAuthTagline(): string {
  if (typeof window === "undefined") {
    return DEFAULT_AUTH_TAGLINE;
  }

  try {
    const storedTagline = localStorage.getItem(STORAGE_KEY_TAGLINE);
    const storedExpiresStr = localStorage.getItem(STORAGE_KEY_EXPIRES);
    const now = Date.now();

    if (storedTagline && storedExpiresStr) {
      const expires = parseInt(storedExpiresStr, 10);
      if (
        !isNaN(expires) &&
        expires > now &&
        AUTH_TAGLINES.includes(storedTagline as typeof AUTH_TAGLINES[number])
      ) {
        return storedTagline;
      }
    }

    // Choose a new tagline
    const randomIndex = Math.floor(Math.random() * AUTH_TAGLINES.length);
    const newTagline = AUTH_TAGLINES[randomIndex];

    localStorage.setItem(STORAGE_KEY_TAGLINE, newTagline);
    localStorage.setItem(STORAGE_KEY_EXPIRES, String(now + ONE_HOUR_MS));

    return newTagline;
  } catch {
    return DEFAULT_AUTH_TAGLINE;
  }
}
