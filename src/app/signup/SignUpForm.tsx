"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { generateUsername } from "@/lib/auth/generateUsername";
import styles from "./SignUpForm.module.css";

const GENERIC_ERROR = "Something went wrong. Try again.";
const RESEND_COOLDOWN_SECONDS = 60;

function nextQuery(redirectTo: string): string {
  return redirectTo && redirectTo !== "/" ? `?next=${encodeURIComponent(redirectTo)}` : "";
}

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function callbackUrl(redirectTo: string): string {
  return `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo || "/")}`;
}

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const [state, setState] = useState<"form" | "sent">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const nameId = useId();
  const emailId = useId();

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailExists(false);

    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    const username = generateUsername(name);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          username,
        },
        emailRedirectTo: callbackUrl(redirectTo),
      },
    });

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setEmailExists(true);
      } else {
        setError(GENERIC_ERROR);
      }
      setBusy(false);
      return;
    }

    setBusy(false);
    setState("sent");
    startCooldown();
  }

  async function handleResend() {
    if (cooldown > 0) return;
    const supabase = createClient();
    await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(redirectTo) },
    });
    startCooldown();
  }

  function useAnotherEmail() {
    setState("form");
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setEmailExists(false);
  }

  if (state === "sent") {
    return (
      <div className={styles.form}>
        <svg
          className={styles.checkIcon}
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12.5l2.5 2.5 5.5-6" />
        </svg>
        <h1 className={styles.heading}>Check your email</h1>
        <p className={styles.body}>
          We sent a confirmation link to <span className={styles.emailHighlight}>{email}</span>.
          Click it to activate your account.
        </p>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleResend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Resend in ${formatCooldown(cooldown)}` : "Resend email"}
        </button>
        <button type="button" className={styles.textLink} onClick={useAnotherEmail}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h1 className={styles.heading}>Create your account</h1>
      <p className={styles.switchLine}>
        Already have an account?{" "}
        <Link href={`/signin${nextQuery(redirectTo)}`} className={styles.link}>
          Sign in
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
          <label htmlFor={nameId} className={styles.label}>
            Full name
          </label>
          <input
            id={nameId}
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            disabled={busy}
            required
          />
        </div>

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

        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
        />

        {emailExists && (
          <p className={styles.error} role="alert">
            An account with this email exists.{" "}
            <Link href={`/signin${nextQuery(redirectTo)}`} className={styles.link}>
              Sign in instead.
            </Link>
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.submitButton} disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </button>

        <p className={styles.termsNote}>
          By creating an account, you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </div>
  );
}
