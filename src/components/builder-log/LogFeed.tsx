"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import LogGlyph from "./LogGlyph";
import { LogPositionProvider, useLogOrder } from "./logState";
import styles from "./LogFeed.module.css";

/** The site sets `scroll-behavior: smooth` on html for everyone; honour
 *  reduced motion here by asking for an instant jump explicitly. */
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
}

export interface FeedLog {
  day: number;
  /** The server-rendered <LogEntry>. */
  node: ReactNode;
}

/**
 * The series page feed: every log, newest or oldest first, along one
 * continuous rail line, then the end section for that order. Logs arrive
 * already rendered on the server; this only re-orders them, tells each
 * one its position (the first three never fold) and handles #day-N links.
 */
export default function LogFeed({
  logs,
  oldestEndActions,
}: {
  logs: FeedLog[];
  /** Extra buttons for the oldest-first ending ("Bookmark this build"). */
  oldestEndActions?: ReactNode;
}) {
  const { order, setOrder, switchCount } = useLogOrder();
  const feedRef = useRef<HTMLDivElement>(null);
  const [openRequest, setOpenRequest] = useState<{ day: number; token: number } | null>(null);

  const ordered = [...logs].sort((a, b) => (order === "newest" ? b.day - a.day : a.day - b.day));

  // After switching order, start reading from the top of the feed.
  useEffect(() => {
    if (switchCount > 0) feedRef.current?.scrollIntoView({ block: "start", behavior: scrollBehavior() });
  }, [switchCount]);

  // #day-N: unfold that log and bring it into view — on load (the browser's
  // own jump happens before folds settle, so scroll again) and on later
  // hash changes.
  useEffect(() => {
    const openFromHash = () => {
      const match = /^#day-(\d+)$/.exec(window.location.hash);
      if (!match) return;
      const day = Number(match[1]);
      setOpenRequest({ day, token: Date.now() });
      const scroll = () =>
        document.getElementById(`day-${day}`)?.scrollIntoView({ block: "start", behavior: scrollBehavior() });
      requestAnimationFrame(scroll);
      // Images and folds above it can still shift the page as they settle.
      setTimeout(scroll, 350);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <div ref={feedRef} id="log-feed" className={styles.feed}>
      <div className={styles.logs}>
        {ordered.map((log, index) => (
          <LogPositionProvider key={log.day} value={{ index, openRequest }}>
            {log.node}
          </LogPositionProvider>
        ))}
      </div>

      <div className={styles.end}>
        <span className={styles.endNode}>
          <LogGlyph kind={order === "newest" ? "dot" : "ring"} size={order === "newest" ? 14 : 16} />
        </span>
        {order === "newest" ? (
          <div className={styles.endText}>
            <p className={styles.endTitle}>This is where it started.</p>
            <div className={styles.endButtons}>
              <button type="button" className={styles.endButton} onClick={() => setOrder("oldest")}>
                Read it from Day 1
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.endText}>
            <p className={styles.endTitle}>That&apos;s everything so far.</p>
            <p className={styles.endLine}>The next log gets written the day something works.</p>
            <div className={styles.endButtons}>
              {oldestEndActions}
              <button type="button" className={styles.endButton} onClick={() => setOrder("newest")}>
                Back to latest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
