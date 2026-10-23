"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { BuilderLogIcon } from "@/components/icons";
import LogGlyph, { glyphForHighlight } from "./LogGlyph";
import { useCurrentLog, useLogs, usePager, type LogMeta } from "./logState";
import styles from "./PhonePager.module.css";

/** Pointer travel before a press on the pill becomes a swipe. */
const DRAG_START = 8;
/** One log per this many px of swipe — also the strip's node spacing. */
const STEP = 48;
/** A swipe shorter than this (ms) and longer than FLICK_DISTANCE is a flick: exactly one log. */
const FLICK_MS = 300;
const FLICK_DISTANCE = 16;
/** Space at the bottom of the log area taken by the pill. */
const PILL_ZONE = 92;

/**
 * The series page on a phone (under 700px, with JS): a series strip, one
 * log filling the screen, and the pill — arrows for older/newer, swipe it
 * to travel (48px a log, a quick flick moves one), tap its middle for the
 * journey sheet. Everything moves through the shared goToDay(), so the
 * URL hash, the slide-in and the reset to the top all happen in one place.
 *
 * Renders nothing outside pager mode; on wider screens the JourneyBar and
 * the feed take over with the same current log.
 */
export default function PhonePager({ seriesTitle }: { seriesTitle: string }) {
  const logs = useLogs();
  const { currentDay, goToDay } = useCurrentLog();
  const { isPager, expanded, setExpanded } = usePager();
  const stripRef = useRef<HTMLDivElement>(null);
  const middleRef = useRef<HTMLButtonElement>(null);
  const [isLong, setIsLong] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const index = Math.max(0, logs.findIndex((log) => log.day === currentDay));
  const current = logs[index];

  // The log area starts where the strip ends.
  useLayoutEffect(() => {
    if (!isPager) return;
    const strip = stripRef.current;
    if (!strip) return;
    const update = () =>
      document.documentElement.style.setProperty("--pager-top", `${strip.getBoundingClientRect().bottom}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(strip);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--pager-top");
    };
  }, [isPager]);

  // Is the current log taller than the screen has room for?
  useEffect(() => {
    if (!isPager) return;
    const area = document.getElementById("log-feed");
    const slot = area?.querySelector<HTMLElement>("[data-active]");
    if (!area || !slot) return;
    const measure = () => {
      const paddingTop = parseFloat(getComputedStyle(area).paddingTop) || 0;
      setIsLong(slot.offsetHeight > area.clientHeight - paddingTop - PILL_ZONE);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    observer.observe(area);
    return () => observer.disconnect();
  }, [isPager, currentDay]);

  if (!isPager || !current) return null;

  const older = index > 0 ? logs[index - 1] : null;
  const newer = index < logs.length - 1 ? logs[index + 1] : null;

  return (
    <>
      <div ref={stripRef} className={styles.strip}>
        <BuilderLogIcon size={16} className={styles.stripIcon} />
        <span className={styles.stripTitle}>{seriesTitle}</span>
        <span className={styles.stripCount}>
          {logs.length} {logs.length === 1 ? "log" : "logs"}
        </span>
      </div>

      {isLong && !expanded && (
        <>
          <div className={styles.fade} aria-hidden="true" />
          <div className={styles.readWhole}>
            <button type="button" className={styles.readButton} onClick={() => setExpanded(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
              Read the whole log
            </button>
            {current.hint && <span className={styles.hint}>{current.hint}</span>}
          </div>
        </>
      )}

      <Pill
        logs={logs}
        index={index}
        older={older}
        newer={newer}
        goToDay={goToDay}
        middleRef={middleRef}
        onOpenSheet={() => setSheetOpen(true)}
      />

      {sheetOpen && (
        <JourneySheet
          logs={logs}
          currentDay={current.day}
          onPick={(day) => {
            setSheetOpen(false);
            goToDay(day);
          }}
          onClose={() => setSheetOpen(false)}
          returnFocusTo={middleRef}
        />
      )}
    </>
  );
}

/* ── THE PILL ── */

function Pill({
  logs,
  index,
  older,
  newer,
  goToDay,
  middleRef,
  onOpenSheet,
}: {
  logs: LogMeta[];
  index: number;
  older: LogMeta | null;
  newer: LogMeta | null;
  goToDay: (day: number) => void;
  middleRef: React.RefObject<HTMLButtonElement | null>;
  onOpenSheet: () => void;
}) {
  const current = logs[index];
  const press = useRef({ id: -1, startX: 0, startTime: 0, dragging: false });
  const swallowClick = useRef(false);
  const [dx, setDx] = useState<number | null>(null);

  const dragging = dx !== null;
  const clamp = useCallback((i: number) => Math.min(logs.length - 1, Math.max(0, i)), [logs.length]);
  // Finger right (dx > 0) travels back in time.
  const target = dragging ? clamp(index - Math.round(dx / STEP)) : index;
  const targetLog = logs[target];
  const progress = logs.length > 1 ? index / (logs.length - 1) : 1;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swallowClick.current = false;
    press.current = { id: event.pointerId, startX: event.clientX, startTime: event.timeStamp, dragging: false };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = press.current;
    if (state.id !== event.pointerId) return;
    const delta = event.clientX - state.startX;
    if (!state.dragging) {
      if (Math.abs(delta) <= DRAG_START) return;
      // Only now take the pointer, so a plain tap still reaches the buttons.
      state.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDx(delta);
  };

  const endPress = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const state = press.current;
    if (state.id !== event.pointerId) return;
    press.current = { id: -1, startX: 0, startTime: 0, dragging: false };
    if (!state.dragging) return;
    swallowClick.current = true;
    const delta = event.clientX - state.startX;
    const elapsed = event.timeStamp - state.startTime;
    setDx(null);
    if (cancelled) return;
    const next =
      elapsed < FLICK_MS && Math.abs(delta) > FLICK_DISTANCE
        ? clamp(index + (delta > 0 ? -1 : 1))
        : clamp(index - Math.round(delta / STEP));
    if (next !== index) goToDay(logs[next].day);
  };

  return (
    <div
      className={`${styles.pill} ${dragging ? styles.pillDragging : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endPress(event)}
      onPointerCancel={(event) => endPress(event, true)}
      onClickCapture={(event) => {
        // The click a browser fires after a swipe isn't a tap.
        if (swallowClick.current) {
          swallowClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {dragging && targetLog && (
        <div className={styles.dragView} aria-hidden="true">
          <div className={styles.dragTop}>
            <span className={styles.dragThumb}>
              {targetLog.thumbnail && targetLog.hasThumbnail ? (
                <Image src={targetLog.thumbnail} alt="" width={100} height={56} sizes="100px" className={styles.thumbImage} />
              ) : (
                <span className={styles.thumbPlaceholder} />
              )}
            </span>
            <span className={styles.dragText}>
              <span className={styles.dayLine}>
                <strong>Day {targetLog.day}</strong> {targetLog.dateLabel}
              </span>
              <span className={styles.dragTitle}>{targetLog.title}</span>
            </span>
          </div>
          <div className={styles.daysStrip}>
            <span className={styles.window} />
            <div
              className={styles.days}
              style={{ "--offset": `${-(index * STEP + STEP / 2) + dx}px` } as CSSProperties}
            >
              {logs.map((log, i) => (
                <span key={log.day} className={`${styles.dayNode} ${i === target ? styles.dayNodeOn : ""}`}>
                  <LogGlyph kind={glyphForHighlight(log.highlight)} size={12} state={i === target ? "current" : "past"} />
                  <span>{log.day}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.rest} hidden={dragging}>
        <button
          type="button"
          className={styles.arrow}
          aria-label="Older log"
          aria-disabled={!older}
          onClick={() => older && goToDay(older.day)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          ref={middleRef}
          type="button"
          className={styles.middle}
          aria-label={`Open the journey. Day ${current.day}: ${current.title}`}
          aria-haspopup="dialog"
          onClick={onOpenSheet}
        >
          <span className={styles.dayLine}>
            <strong>Day {current.day}</strong> {current.dateLabel}
          </span>
          <span className={styles.middleTitle}>{current.title}</span>
          <span className={styles.progress} aria-hidden="true">
            <span style={{ width: `${progress * 100}%` }} />
          </span>
        </button>
        <button
          type="button"
          className={styles.arrow}
          aria-label="Newer log"
          aria-disabled={!newer}
          onClick={() => newer && goToDay(newer.day)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── THE JOURNEY SHEET ── */

function JourneySheet({
  logs,
  currentDay,
  onPick,
  onClose,
  returnFocusTo,
}: {
  logs: LogMeta[];
  currentDay: number;
  onPick: (day: number) => void;
  onClose: () => void;
  returnFocusTo: React.RefObject<HTMLButtonElement | null>;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // Held in a ref so a parent re-render doesn't re-run the focus effect.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const first = logs[0];
  const latest = logs[logs.length - 1];
  const newestFirst = [...logs].reverse();

  // Focus in on open, back to the pill on close; Escape closes; Tab stays inside.
  useEffect(() => {
    const returnTarget = returnFocusTo.current;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>("button, a[href]");
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnTarget?.focus();
    };
  }, [returnFocusTo]);

  return (
    <div className={styles.sheetLayer}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.sheetHeader}>
          <span className={styles.grabber} aria-hidden="true" />
          <div className={styles.sheetHeading}>
            <h2 id={titleId} className={styles.sheetTitle}>
              The journey
            </h2>
            <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className={styles.sheetMeta}>
            {logs.length} {logs.length === 1 ? "log" : "logs"} over {latest.day} {latest.day === 1 ? "day" : "days"}, newest first
          </p>
          <div className={styles.sheetButtons}>
            {currentDay !== first.day && (
              <button type="button" className={styles.sheetButton} onClick={() => onPick(first.day)}>
                Start from Day 1
              </button>
            )}
            {currentDay !== latest.day && (
              <button type="button" className={styles.sheetButton} onClick={() => onPick(latest.day)}>
                Jump to the latest
              </button>
            )}
          </div>
        </div>
        <ul className={styles.rows}>
          {newestFirst.map((log) => (
            <li key={log.day}>
              <button
                type="button"
                className={`${styles.row} ${log.day === currentDay ? styles.rowCurrent : ""}`}
                aria-current={log.day === currentDay ? "true" : undefined}
                onClick={() => onPick(log.day)}
              >
                <span className={styles.rowThumb}>
                  {log.thumbnail && log.hasThumbnail ? (
                    <Image src={log.thumbnail} alt="" width={104} height={58} sizes="104px" className={styles.thumbImage} />
                  ) : (
                    <span className={styles.thumbPlaceholder} />
                  )}
                </span>
                <span className={styles.rowText}>
                  <span className={styles.dayLine}>
                    {log.highlight && <LogGlyph kind={glyphForHighlight(log.highlight)} size={10} />}
                    <strong>Day {log.day}</strong> {log.dateLabel}
                  </span>
                  <span className={styles.rowTitle}>{log.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
