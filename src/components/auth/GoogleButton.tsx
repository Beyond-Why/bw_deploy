"use client";

import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "./GoogleIcon";
import styles from "./GoogleButton.module.css";

/**
 * Reusable "Continue with Google" button — used on both /signin and
 * /signup. Fires supabase.auth.signInWithOAuth itself so callers don't
 * each need to wire up the redirect URL; `onError` surfaces a failure to
 * start the OAuth redirect (a successful call navigates the browser away
 * immediately, so there's no success callback).
 */
export function GoogleButton({
  onStart,
  onError,
  disabled,
}: {
  /** Called synchronously right before starting the OAuth redirect — use
   *  it to flip the caller's own busy state. */
  onStart: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  async function handleClick() {
    onStart();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          new URLSearchParams(window.location.search).get("next") || "/"
        )}`,
      },
    });
    if (error) {
      onError("Something went wrong. Try again.");
    }
    // On success the browser navigates away to Google — no further
    // state update needed here.
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      disabled={disabled}
    >
      <GoogleIcon />
      <span>Continue with Google</span>
    </button>
  );
}
