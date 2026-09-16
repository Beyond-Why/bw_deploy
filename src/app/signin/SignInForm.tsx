"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import styles from "./SignInForm.module.css";

const GENERIC_ERROR = "Something went wrong. Try again.";
const INVALID_CREDENTIALS_ERROR = "Incorrect email/username or password.";

function nextQuery(redirectTo: string): string {
  return redirectTo && redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : "";
}

export function SignInForm({
  redirectTo,
  initialErrored = false,
}: {
  redirectTo: string;
  initialErrored?: boolean;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialErrored ? GENERIC_ERROR : null
  );
  const identifierId = useId();

  async function resolveEmail(): Promise<string | null> {
    const trimmed = identifier.trim();
    if (trimmed.includes("@")) return trimmed;

    try {
      const res = await fetch("/api/auth/lookup-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      if (!res.ok) return null;
      const data: { email?: string } = await res.json();
      return data.email ?? null;
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password) return;

    setBusy(true);
    setError(null);

    const supabase = createClient();
    const trimmed = identifier.trim();

    // Try the identifier as an email first — this covers the common case
    // and, for an actual email address, is the only request needed.
    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });

    if (signInError && !trimmed.includes("@")) {
      const resolvedEmail = await resolveEmail();
      if (resolvedEmail) {
        ({ error: signInError } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        }));
      }
    }

    if (signInError) {
      setError(INVALID_CREDENTIALS_ERROR);
      setBusy(false);
      return;
    }

    window.location.href = redirectTo || "/";
  }

  return (
    <div className={styles.form}>
      <h1 className={styles.heading}>Welcome back</h1>
      <p className={styles.switchLine}>
        Don&apos;t have an account?{" "}
        <Link href={`/signup${nextQuery(redirectTo)}`} className={styles.link}>
          Sign up
        </Link>
      </p>

      <GoogleButton
        onStart={() => {
          setBusy(true);
          setError(null);
        }}
        onError={(message) => {
          setError(message);
          setBusy(false);
        }}
        disabled={busy}
      />

      <div className={styles.divider} aria-hidden="true">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit} className={styles.formEl} noValidate>
        <div className={styles.fieldGroup}>
          <label htmlFor={identifierId} className={styles.label}>
            Email or username
          </label>
          <input
            id={identifierId}
            type="text"
            className={styles.input}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            disabled={busy}
            required
          />
        </div>

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={busy}
        />

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <Link href="/forgot-password" className={styles.forgotLink}>
          Forgot your password?
        </Link>

        <button type="submit" className={styles.submitButton} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
