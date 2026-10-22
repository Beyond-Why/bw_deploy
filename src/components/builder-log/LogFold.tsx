"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useLogFold } from "./logState";
import styles from "./LogFold.module.css";

/** A body over this height folds (unless it's one of the first three). */
const FOLD_LIMIT = 720;

/**
 * Wraps a log's body. When folded the body is cut to 300px with a fade,
 * made inert, and followed by the "Read the whole log" pill and a hint
 * of what's inside. Short logs never fold — the body's natural height is
 * measured with a ResizeObserver (images loading, a Toggle opening, a
 * font swap all re-measure).
 */
export default function LogFold({ hint, children }: { hint?: string; children: ReactNode }) {
  const { folded, expand, setTall } = useLogFold();
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const observer = new ResizeObserver(() => setTall(inner.offsetHeight > FOLD_LIMIT));
    observer.observe(inner);
    return () => observer.disconnect();
  }, [setTall]);

  return (
    <div className={folded ? styles.folded : undefined}>
      <div className={styles.clip} inert={folded}>
        <div ref={innerRef}>{children}</div>
      </div>
      {folded && (
        <div className={styles.bar}>
          <button type="button" className={styles.pill} onClick={expand}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
            Read the whole log
          </button>
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}
    </div>
  );
}
