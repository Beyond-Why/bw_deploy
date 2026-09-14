"use client";

import Link from "next/link";
import styles from "./SignInPrompt.module.css";

/**
 * Compact invitation shown in place of a protected action when the
 * visitor is logged out. `redirectTo` should be the internal path the
 * user should land back on after signing in.
 */
export function SignInPrompt({
  message = "Log in to continue.",
  redirectTo,
}: {
  message?: string;
  redirectTo: string;
}) {
  return (
    <span className={styles.prompt} role="status">
      {message}{" "}
      <Link href={`/signin?next=${encodeURIComponent(redirectTo)}`} className={styles.cta}>
        Log in
      </Link>
    </span>
  );
}
