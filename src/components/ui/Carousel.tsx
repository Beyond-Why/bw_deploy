"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Carousel.module.css";

interface CarouselProps {
  children: React.ReactNode[];
  /** Cards visible at once. Omit to auto-size from viewport width
   *  (3 at ≥1100px, 2 at ≥768px, 1 below that). */
  visibleCount?: number;
  /** Gap between cards, px. */
  gap?: number;
}

function useResponsiveVisibleCount(override?: number): number {
  const computeAuto = () =>
    typeof window === "undefined"
      ? 3
      : window.innerWidth >= 1100
        ? 3
        : window.innerWidth >= 768
          ? 2
          : 1;

  const [auto, setAuto] = useState(computeAuto);

  useEffect(() => {
    if (override) return;
    const update = () => setAuto(computeAuto());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [override]);

  return override ?? auto;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );
}

/** Generic reusable carousel — prev/next arrows (hidden at the start/end
 *  boundary and on mobile), plus touch-swipe navigation. Cards-per-view
 *  is either fixed (`visibleCount`) or auto-derived from viewport width. */
export function Carousel({ children, visibleCount, gap = 16 }: CarouselProps) {
  const items = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);
  const resolvedVisibleCount = useResponsiveVisibleCount(visibleCount);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxIndex = Math.max(0, items.length - resolvedVisibleCount);

  // Clamp back into range when a resize grows the visible count past
  // whatever index a narrower layout had scrolled to.
  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const cardWidth =
    containerWidth > 0
      ? (containerWidth - gap * (resolvedVisibleCount - 1)) / resolvedVisibleCount
      : 0;
  const step = cardWidth + gap;

  const atStart = index <= 0;
  const atEnd = index >= maxIndex;
  const showArrows = items.length > resolvedVisibleCount;

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - start.x;
    const deltaY = t.clientY - start.y;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) goNext();
    else goPrev();
  };

  return (
    <div className={styles.wrapper}>
      {showArrows && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft} ${atStart ? styles.arrowHidden : ""}`}
          onClick={goPrev}
          aria-label="Previous"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <div
        className={styles.viewport}
        ref={viewportRef}
        onTouchStart={onTouchStart}
        onTouchMove={() => {}}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * step}px)`, gap: `${gap}px` }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              className={styles.slide}
              style={cardWidth > 0 ? { width: `${cardWidth}px` } : undefined}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showArrows && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowRight} ${atEnd ? styles.arrowHidden : ""}`}
          onClick={goNext}
          aria-label="Next"
        >
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}
