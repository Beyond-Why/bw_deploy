"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./ForgotPasswordForm.module.css";

const GENERIC_ERROR = "Something went wrong. Try again.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "/reset-password",
    });

    if (resetError) {
      setError(GENERIC_ERROR);
      setBusy(false);
      return;
    }

    setBusy(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className={styles.form}>
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.body}>Check your email for a reset link.</p>
        <Link href="/signin" className={styles.link}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h1 className={styles.heading}>Reset your password</h1>
      <p className={styles.body}>Enter your email and we&apos;ll send you a reset link.</p>

      <form onSubmit={handleSubmit} className={styles.formEl} noValidate>
        <div className={styles.fieldGroup}>
          <label htmlFor={emailId} className={styles.label}>
            Email
          </label>
          <input
            id={emailId}
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={busy}
            required
          />
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submitButton} disabled={busy}>
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className={styles.switchLine}>
        <Link href="/signin" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
