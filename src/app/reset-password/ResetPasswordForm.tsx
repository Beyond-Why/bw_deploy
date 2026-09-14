"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PasswordField } from "@/components/auth/PasswordField";
import styles from "./ResetPasswordForm.module.css";

const GENERIC_ERROR = "Something went wrong. Try again.";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(GENERIC_ERROR);
      setBusy(false);
      return;
    }

    setBusy(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className={styles.form}>
        <h1 className={styles.heading}>Password updated!</h1>
        <p className={styles.body}>Sign in with your new password.</p>
        <Link href="/signin" className={styles.link}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h1 className={styles.heading}>Choose a new password</h1>

      <form onSubmit={handleSubmit} className={styles.formEl} noValidate>
        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submitButton} disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
