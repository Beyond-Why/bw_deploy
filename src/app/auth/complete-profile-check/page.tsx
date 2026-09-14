"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { safeRedirectPath } from "@/lib/auth/redirect";
import styles from "./page.module.css";

/**
 * One-hop landing spot for every /auth/callback exchange (Google OAuth,
 * signup email confirmation, and the password-reset link) — fires the
 * idempotent complete-profile API, which is a no-op when a profile
 * already exists (the normal case, since the handle_new_user trigger
 * creates one at signup) and a defensive fallback insert otherwise, then
 * continues on to wherever the user was actually headed.
 *
 * window.location.href (not router.push) for the final redirect, same
 * as every other post-auth navigation — the destination may depend on a
 * server-rendered check (e.g. a profile that didn't exist a moment ago)
 * that a client-side route transition wouldn't naturally re-fetch.
 */
function CompleteProfileCheck() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirectTo = safeRedirectPath(searchParams.get("redirect"));

    fetch("/api/auth/complete-profile", { method: "POST" })
      .catch(() => {
        // Best-effort — even if this fails, the trigger has already
        // created a usable profile in the normal case, so don't strand
        // the user on a spinner over it.
      })
      .finally(() => {
        window.location.href = redirectTo;
      });
  }, [searchParams]);

  return (
    <div className={styles.wrap}>
      <div className={styles.spinner} aria-label="Finishing sign-in" role="status" />
    </div>
  );
}

export default function CompleteProfileCheckPage() {
  return (
    <Suspense fallback={<div className={styles.wrap} />}>
      <CompleteProfileCheck />
    </Suspense>
  );
}
