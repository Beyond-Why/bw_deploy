"use client";

import { useSyncExternalStore } from "react";
import { daysBetween } from "@/lib/dates";
import styles from "./Countdown.module.css";

/** Today's date in the reader's time zone, YYYY-MM-DD. A string, so the
 *  snapshot is stable between renders. */
function localToday(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const subscribe = () => () => {};

/** Days to a target date. It depends on the reader's today, so it renders
 *  nothing on the server and fills in after hydration (no mismatch). */
export function Countdown({ target, variant = "hero" }: { target: string; variant?: "hero" | "inline" }) {
  const today = useSyncExternalStore(subscribe, localToday, () => null);

  if (variant === "inline") {
    if (!today) return <span className={styles.placeholder} aria-hidden="true" />;
    const days = daysBetween(today, target);
    return <span>{days > 1 ? `in ${days} days` : days === 1 ? "tomorrow" : days === 0 ? "today" : "overdue"}</span>;
  }

  if (!today) return <span className={styles.heroPlaceholder} aria-hidden="true" />;
  const days = Math.max(daysBetween(today, target), 0);
  return (
    <span className={styles.hero}>
      <span className={styles.num}>{days}</span> <span className={styles.unit}>{days === 1 ? "day" : "days"}</span>
    </span>
  );
}
