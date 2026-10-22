"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import LogGlyph, { glyphForHighlight } from "./LogGlyph";
import { useCurrentLog, useLogOrder, useLogs, type LogMeta } from "./logState";
import styles from "./JourneyBar.module.css";

const PEEK_WIDTH = 244;
const PEEK_EDGE = 8;
/** Pointer travel (px) after which a press on the track counts as a drag. */
const DRAG_THRESHOLD = 3;

/**
 * The series page's bottom bar (700px and up): which day you're on, a
 * track with one node per log (Day 1 → latest, evenly spaced by log),
 * and the order button. The track is a native range input laid over the
 * nodes, so arrow keys and screen readers work; dragging scrolls the page
 * instantly, a click or key press scrolls smoothly. Hovering (or dragging)
 * peeks at a log: its cover, day, date and title.
 *
 * Nodes line up with the range thumb: both sit `--thumb / 2` in from each
 * end of the track and are spread over the remaining width.
 *
 *   <LogStateProvider …><JourneyBar /></LogStateProvider>
 */
export default function JourneyBar() {
  const logs = useLogs();
  const { currentDay, goToDay } = useCurrentLog();
  const { order, setOrder } = useLogOrder();

  const trackRef = useRef<HTMLDivElement>(null);
  const press = useRef({ down: false, startX: 0, dragging: false, pending: null as number | null });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [peekIndex, setPeekIndex] = useState<number | null>(null);

  const count = logs.length;
  const currentIndex = Math.max(0, logs.findIndex((log) => log.day === currentDay));
  const shownIndex = dragIndex ?? currentIndex;
  const shown = logs[shownIndex];

  /** The node nearest a pointer x position. */
  const indexAt = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || count < 2) return 0;
      const rect = track.getBoundingClientRect();
      const thumb = parseFloat(getComputedStyle(track).getPropertyValue("--thumb")) || 20;
      const ratio = (clientX - rect.left - thumb / 2) / (rect.width - thumb);
      return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
    },
    [count]
  );

  // Pointer release can land anywhere (the browser captures a thumb drag),
  // so listen on the window. A press that never moved is a click.
  useEffect(() => {
    const onPointerUp = () => {
      const state = press.current;
      if (!state.down) return;
      if (!state.dragging && state.pending !== null) goToDay(logs[state.pending].day);
      press.current = { down: false, startX: 0, dragging: false, pending: null };
      setDragIndex(null);
      setPeekIndex(null);
    };
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [goToDay, logs]);

  if (count === 0 || !shown) return null;

  const onRangeChange = (index: number) => {
    const state = press.current;
    if (!state.down) {
      // Keyboard: one smooth step at a time.
      goToDay(logs[index].day);
      return;
    }
    setDragIndex(index);
    setPeekIndex(index);
    if (state.dragging) goToDay(logs[index].day, { instant: true });
    else state.pending = index;
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const state = press.current;
    if (state.down && !state.dragging && Math.abs(event.clientX - state.startX) > DRAG_THRESHOLD) {
      state.dragging = true;
      if (state.pending !== null) goToDay(logs[state.pending].day, { instant: true });
    }
    // Mouse: peek wherever it hovers. Touch/pen: only while pressed.
    if (event.pointerType === "mouse" || state.down) {
      setPeekIndex(state.dragging && dragIndex !== null ? dragIndex : indexAt(event.clientX));
    }
  };

  const ratio = (index: number) => (count > 1 ? index / (count - 1) : 0);
  const at = (index: number) => `calc(var(--thumb) / 2 + ${ratio(index)} * (100% - var(--thumb)))`;

  return (
    <div className={styles.bar} role="region" aria-label="Journey through the build">
      <div className={styles.inner}>
        <div className={styles.readout} aria-hidden="true">
          <span className={styles.day}>Day {shown.day}</span>
          <span className={styles.readoutText}>
            <span className={styles.date}>{shown.dateLabel}</span>
            <span className={styles.title}>{shown.title}</span>
          </span>
        </div>

        <div className={styles.trackArea}>
          <div
            ref={trackRef}
            className={styles.track}
            onPointerDown={(event) => {
              press.current = { down: true, startX: event.clientX, dragging: false, pending: null };
            }}
            onPointerMove={onPointerMove}
            onPointerLeave={() => {
              if (!press.current.down) setPeekIndex(null);
            }}
          >
            <span className={styles.line} aria-hidden="true" />
            <span className={styles.fill} style={{ width: `calc(${ratio(shownIndex)} * (100% - var(--thumb)))` }} aria-hidden="true" />
            {logs.map((log, index) => (
              <span key={log.day} className={styles.node} style={{ left: at(index) }} aria-hidden="true">
                <LogGlyph
                  kind={glyphForHighlight(log.highlight)}
                  state={index < shownIndex ? "past" : index > shownIndex ? "future" : "current"}
                />
                {index === peekIndex && index !== shownIndex && <span className={styles.hoverRing} />}
              </span>
            ))}
            <input
              type="range"
              className={styles.range}
              min={0}
              max={Math.max(count - 1, 0)}
              step={1}
              value={shownIndex}
              disabled={count < 2}
              onChange={(event) => onRangeChange(Number(event.target.value))}
              onKeyDown={() => setPeekIndex(null)}
              aria-label="Travel through the build, one log at a time"
              aria-valuetext={`Day ${shown.day}, ${shown.dateLabel}: ${shown.title}`}
            />
            {peekIndex !== null && (
              <Peek log={logs[peekIndex]} ratio={ratio(peekIndex)} at={at(peekIndex)} trackRef={trackRef} />
            )}
          </div>
          <span className={styles.tail} aria-hidden="true">
            <span className={styles.dash} />
            <LogGlyph kind="ring" size={14} />
          </span>
        </div>

        <button
          type="button"
          className={styles.orderButton}
          onClick={() => setOrder(order === "newest" ? "oldest" : "newest")}
        >
          {order === "newest" ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 5v14" />
                <path d="m18 6-8 6 8 6z" fill="currentColor" />
              </svg>
              Start from Day 1
            </>
          ) : (
            <>
              Back to latest
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 5v14" />
                <path d="m6 6 8 6-8 6z" fill="currentColor" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * The hover/drag card above a node. Centred on the node, then nudged back
 * inside the viewport at the ends of the track; the caret keeps pointing
 * at the node. Never takes pointer events, so it can't block the track.
 */
function Peek({
  log,
  ratio,
  at,
  trackRef,
}: {
  log: LogMeta;
  ratio: number;
  /** The node's CSS left position on the track. */
  at: string;
  trackRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const thumb = parseFloat(getComputedStyle(track).getPropertyValue("--thumb")) || 20;
    const nodeX = rect.left + thumb / 2 + ratio * (rect.width - thumb);
    const left = nodeX - PEEK_WIDTH / 2;
    const min = PEEK_EDGE;
    const max = window.innerWidth - PEEK_EDGE - PEEK_WIDTH;
    setShift(Math.min(max, Math.max(min, left)) - left);
  }, [ratio, trackRef]);

  return (
    <div
      className={styles.peek}
      style={{ left: at, "--peek-shift": `${shift}px` } as CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.peekThumb}>
        {log.thumbnail && log.hasThumbnail ? (
          <Image
            src={log.thumbnail}
            alt=""
            width={PEEK_WIDTH}
            height={Math.round((PEEK_WIDTH * 9) / 16)}
            sizes={`${PEEK_WIDTH}px`}
            className={styles.peekImage}
          />
        ) : (
          <span className={styles.peekPlaceholder} />
        )}
      </div>
      <div className={styles.peekText}>
        <span className={styles.peekMeta}>
          <strong>Day {log.day}</strong> {log.dateLabel}
        </span>
        <span className={styles.peekTitle}>{log.title}</span>
      </div>
      <span className={styles.caret} />
    </div>
  );
}
