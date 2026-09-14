"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./Toast.module.css";

export type ToastType = "default" | "success" | "error";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** Ms before auto-dismiss. */
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
}

const DEFAULT_DURATION = 2500;
// Must match the .toastExit animation-duration in Toast.module.css.
const EXIT_DURATION = 150;

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToastContext() {
  return useContext(ToastContext);
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function BookmarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

interface ActiveToast {
  key: number;
  message: string;
  type: ToastType;
}

/**
 * Shared toast primitive — a single-slot queue (a new toast immediately
 * replaces whatever's showing) rather than a stack, since Beyond Why's
 * toasts are quiet, low-stakes confirmations, not a notification center.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [exiting, setExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    dismissTimerRef.current = null;
    exitTimerRef.current = null;
  }, []);

  const show = useCallback(
    ({ message, type = "default", duration = DEFAULT_DURATION }: ToastOptions) => {
      clearTimers();
      keyRef.current += 1;
      setExiting(false);
      setToast({ key: keyRef.current, message, type });

      dismissTimerRef.current = setTimeout(() => {
        setExiting(true);
        exitTimerRef.current = setTimeout(() => {
          setToast(null);
          setExiting(false);
        }, EXIT_DURATION);
      }, duration);
    },
    [clearTimers]
  );

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          key={toast.key}
          className={cx(styles.toast, styles[toast.type], exiting ? styles.toastExit : styles.toastEnter)}
          role="status"
          aria-live="polite"
        >
          <span className={styles.icon}>
            {toast.type === "error" ? <ErrorIcon /> : <BookmarkIcon />}
          </span>
          <span className={styles.message}>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}
