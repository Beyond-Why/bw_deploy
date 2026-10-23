"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import LogGlyph from "./LogGlyph";
import { LogPositionProvider, useCurrentLog, useLogOrder, usePager } from "./logState";
import styles from "./LogFeed.module.css";

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
  const { currentDay } = useCurrentLog();
  const { isPager, slide } = usePager();
  const feedRef = useRef<HTMLDivElement>(null);
  const [openRequest, setOpenRequest] = useState<{ day: number; token: number } | null>(null);

  const ordered = [...logs].sort((a, b) => (order === "newest" ? b.day - a.day : a.day - b.day));

  // After switching order, start reading from the top of the feed.
  useEffect(() => {
    if (switchCount > 0) feedRef.current?.scrollIntoView({ block: "start" });
  }, [switchCount]);

  // #day-N: unfold that log and bring it into view — on arrival (a fresh
  // load or a link from another page) and on later hash changes. Arrival
  // jumps instantly and re-applies as images and folds above it settle:
  // a smooth scroll here would race the browser's / router's own hash
  // scroll and could stop halfway down the page.
  useEffect(() => {
    const openFromHash = (arrival: boolean) => {
      const match = /^#day-(\d+)$/.exec(window.location.hash);
      if (!match) return;
      const day = Number(match[1]);
      setOpenRequest({ day, token: Date.now() });
      const scroll = () =>
        document
          .getElementById(`day-${day}`)
          ?.scrollIntoView({ block: "start", behavior: arrival ? "instant" : "smooth" });
      requestAnimationFrame(scroll);
      setTimeout(scroll, 350);
      if (arrival) setTimeout(scroll, 900);
    };
    openFromHash(true);
    const onHashChange = () => openFromHash(false);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div ref={feedRef} id="log-feed" className={styles.feed}>
      <div className={styles.logs}>
        {ordered.map((log, index) => {
          // Phone pager: every log stays in the page; only the current one
          // shows (the rest are display:none until chosen).
          const active = log.day === currentDay;
          const slideClass =
            isPager && active && slide ? (slide.from === "left" ? styles.slideLeft : styles.slideRight) : "";
          return (
            <div
              key={isPager && active && slide ? `${log.day}-${slide.key}` : log.day}
              className={`${styles.slot} ${slideClass}`}
              data-active={active ? "" : undefined}
            >
              <LogPositionProvider value={{ index, openRequest }}>{log.node}</LogPositionProvider>
            </div>
          );
        })}
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
