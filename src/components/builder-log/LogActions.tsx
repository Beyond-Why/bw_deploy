"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLogFold } from "./logState";
import styles from "./LogActions.module.css";

/**
 * The row under a log: "Discuss this log" (the log's thread on its share
 * page), "Copy link" (the series page at this log) and, once a folded log
 * has been opened, "Fold it back".
 */
export default function LogActions({
  series,
  slug,
  day,
}: {
  series: string;
  slug: string;
  day: number;
}) {
  const { canFoldBack, foldBack } = useLogFold();
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetRef.current) clearTimeout(resetRef.current);
  }, []);

  const copyLink = async () => {
    const url = `${window.location.origin}/builder-log/${series}#day-${day}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked (insecure origin, denied permission) — fall back
      // to putting the link in the address bar, where it can be copied.
      window.history.replaceState(null, "", `#day-${day}`);
    }
    setCopied(true);
    if (resetRef.current) clearTimeout(resetRef.current);
    resetRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.actions}>
      <Link href={`/builder-log/${series}/${slug}#discussion`} className={styles.action}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Discuss this log
      </Link>
      <button type="button" className={styles.action} onClick={copyLink}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
      </button>
      {canFoldBack && (
        <button type="button" className={`${styles.action} ${styles.foldBack}`} onClick={foldBack}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m18 15-6-6-6 6" />
          </svg>
          Fold it back
        </button>
      )}
    </div>
  );
}
