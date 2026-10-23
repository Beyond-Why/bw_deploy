"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { LogMeta } from "./logState";
import styles from "./LogPeek.module.css";

const PEEK_WIDTH = 244;
/** Distance kept from the edge of the bounds. */
const EDGE = 8;

/**
 * A quick look at one log — its cover, "Day N" + date and title — shown
 * above a node on a track (the journey bar, the homepage banner's road).
 * Placed by its bottom-centre at `left` / `bottom` (any CSS length) in its
 * containing block, then nudged sideways to stay inside `boundsRef` (the
 * viewport when absent); the caret keeps pointing at the node. Never takes
 * pointer events, so it can't block the track under it. No animation.
 *
 *   <LogPeek log={log} left="40%" bottom="calc(100% + 12px)" />
 */
export default function LogPeek({
  log,
  left,
  bottom,
  boundsRef,
}: {
  log: Pick<LogMeta, "day" | "dateLabel" | "title" | "thumbnail" | "hasThumbnail">;
  left: string | number;
  bottom: string | number;
  boundsRef?: RefObject<HTMLElement | null>;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef(0);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const naturalLeft = rect.left - shiftRef.current;
    const bounds = boundsRef?.current?.getBoundingClientRect();
    const min = (bounds?.left ?? 0) + EDGE;
    const max = (bounds?.right ?? window.innerWidth) - EDGE - rect.width;
    const next = Math.min(max, Math.max(min, naturalLeft)) - naturalLeft;
    shiftRef.current = next;
    setShift(next);
  }, [log.day, left, bottom, boundsRef]);

  return (
    <div
      ref={cardRef}
      className={styles.peek}
      style={{ left, bottom, "--peek-shift": `${shift}px` } as CSSProperties}
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
