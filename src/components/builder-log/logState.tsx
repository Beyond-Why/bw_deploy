"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ──────────────────────────────────────────────────────────────
   Client state shared across a Builder Log series page.

   - Order (newest / oldest first): the header buttons, the feed's end
     section and the journey bar all switch it; the feed re-sorts.
     Mirrored in the URL as ?order=oldest without a reload.
   - Current log: the log being read, synced to the scroll position;
     goToDay() scrolls to a log (journey bar, phone pager).
   - Position: the feed tells each log where it sits in the current
     order, so a log knows whether it's one of the first three (never
     folded).
   - Open requests: a #day-N link asks that log to unfold.
   - Fold: per log, shared by the body wrapper (LogFold) and the actions
     row (LogActions) so "Fold it back" sits outside the body.

   Outside a feed (the single-log share page) every default means
   "first log, always open", so nothing folds there.
   ────────────────────────────────────────────────────────────── */

export type LogOrder = "newest" | "oldest";

/** Logs at these positions in the current order never fold. */
const ALWAYS_OPEN_COUNT = 3;

/* ── ORDER ── */

interface OrderState {
  order: LogOrder;
  setOrder: (order: LogOrder) => void;
  /** Bumped on every switch, so the feed knows to scroll to its top. */
  switchCount: number;
}

const OrderContext = createContext<OrderState>({
  order: "newest",
  setOrder: () => {},
  switchCount: 0,
});

function orderFromLocation(): LogOrder {
  return new URLSearchParams(window.location.search).get("order") === "oldest"
    ? "oldest"
    : "newest";
}

/* ── LOGS + CURRENT LOG ── */

/** What every piece of navigation needs to know about a log. */
export interface LogMeta {
  day: number;
  slug: string;
  title: string;
  /** "Tue 11 Nov". */
  dateLabel: string;
  highlight?: "breakthrough" | "milestone";
  thumbnail?: string;
  thumbnailAlt?: string;
  /** The thumbnail file exists (checked on the server). */
  hasThumbnail: boolean;
}

interface CurrentLogState {
  /** The log being read, or null outside a series page. */
  currentDay: number | null;
  /** Scroll to a log (it stays folded if it was). */
  goToDay: (day: number, options?: { instant?: boolean }) => void;
}

const LogsContext = createContext<LogMeta[]>([]);

const CurrentLogContext = createContext<CurrentLogState>({
  currentDay: null,
  goToDay: () => {},
});

/** A log becomes "the one being read" once its top passes this point. */
const READ_LINE = 0.34;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Where a section's top should land when we scroll to it — just under
 *  the sticky site nav (the same offset its scroll-margin-top gives). */
function scrollTargetFor(section: HTMLElement) {
  const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
  return window.scrollY + section.getBoundingClientRect().top - margin;
}

/** Resolves once a programmatic scroll has settled: on `scrollend` where
 *  the browser has it, otherwise after ~6 still frames (1.5s at most). */
function whenScrollSettles(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    let lastY = window.scrollY;
    let still = 0;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", finish);
      clearTimeout(timeout);
      resolve();
    };
    const watch = () => {
      if (done) return;
      still = window.scrollY === lastY ? still + 1 : 0;
      lastY = window.scrollY;
      if (still >= 6) finish();
      else requestAnimationFrame(watch);
    };
    window.addEventListener("scrollend", finish, { once: true });
    const timeout = setTimeout(finish, 1500);
    requestAnimationFrame(watch);
  });
}

/**
 * The one source of truth for a series page: the reading order and the
 * log being read, plus the list of logs every navigation piece draws
 * (header button, feed end section, journey bar, rail numerals, phone
 * pager).
 *
 * "Being read" follows the scroll: the last log whose top has passed 34%
 * of the viewport. One requestAnimationFrame per scroll burst, and state
 * only changes when the day does, so nothing re-renders per pixel. While
 * goToDay's own scroll is running the sync is paused, so the journey bar
 * thumb doesn't jitter through every log on the way.
 */
export function LogStateProvider({
  initialOrder,
  logs,
  children,
}: {
  initialOrder: LogOrder;
  /** Oldest first. */
  logs: LogMeta[];
  children: ReactNode;
}) {
  const [order, setOrderState] = useState<LogOrder>(initialOrder);
  const [switchCount, setSwitchCount] = useState(0);
  const [currentDay, setCurrentDay] = useState<number | null>(() => {
    if (logs.length === 0) return null;
    return initialOrder === "newest" ? logs[logs.length - 1].day : logs[0].day;
  });
  const syncPausedRef = useRef(false);
  const goToTokenRef = useRef(0);

  const setOrder = useCallback((next: LogOrder) => {
    setOrderState(next);
    setSwitchCount((n) => n + 1);
    const url = new URL(window.location.href);
    if (next === "oldest") url.searchParams.set("order", "oldest");
    else url.searchParams.delete("order");
    // A #day-N from before the switch would point somewhere else now.
    url.hash = "";
    window.history.pushState(null, "", url);
  }, []);

  // Back/forward between the two orders.
  useEffect(() => {
    const onPopState = () => setOrderState(orderFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // ── Scroll sync ──
  const syncFromScroll = useCallback(() => {
    if (syncPausedRef.current) return;
    const sections = document.querySelectorAll<HTMLElement>("section[data-day]");
    if (sections.length === 0) return;
    const readLine = window.innerHeight * READ_LINE;
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let current: HTMLElement = sections[0];
    if (atBottom) {
      current = sections[sections.length - 1];
    } else {
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= readLine) current = section;
        else break;
      }
    }
    setCurrentDay(Number(current.dataset.day));
  }, []);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncFromScroll();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [syncFromScroll]);

  // The feed re-sorts after an order switch — re-read once it has.
  useEffect(() => {
    const frame = requestAnimationFrame(syncFromScroll);
    return () => cancelAnimationFrame(frame);
  }, [order, syncFromScroll]);

  const goToDay = useCallback(
    (day: number, { instant = false }: { instant?: boolean } = {}) => {
      const section = document.getElementById(`day-${day}`);
      if (!section) return;
      const token = ++goToTokenRef.current;
      syncPausedRef.current = true;
      setCurrentDay(day);
      window.scrollTo({
        top: scrollTargetFor(section),
        behavior: instant || prefersReducedMotion() ? "instant" : "smooth",
      });
      whenScrollSettles().then(() => {
        // A newer goToDay (the next drag step) owns the pause now.
        if (token !== goToTokenRef.current) return;
        syncPausedRef.current = false;
        syncFromScroll();
      });
    },
    [syncFromScroll]
  );

  const orderValue = useMemo(() => ({ order, setOrder, switchCount }), [order, setOrder, switchCount]);
  const currentValue = useMemo(() => ({ currentDay, goToDay }), [currentDay, goToDay]);

  return (
    <OrderContext.Provider value={orderValue}>
      <LogsContext.Provider value={logs}>
        <CurrentLogContext.Provider value={currentValue}>{children}</CurrentLogContext.Provider>
      </LogsContext.Provider>
    </OrderContext.Provider>
  );
}

export function useLogOrder() {
  return useContext(OrderContext);
}

/** Every log in the series, oldest first. */
export function useLogs() {
  return useContext(LogsContext);
}

export function useCurrentLog() {
  return useContext(CurrentLogContext);
}

/* ── POSITION + OPEN REQUESTS (provided by LogFeed) ── */

interface PositionState {
  /** 0-based position in the current order. */
  index: number;
  /** The day a #day-N link most recently asked to open, with a fresh
   *  token each time so the same link twice still re-opens. */
  openRequest: { day: number; token: number } | null;
}

const PositionContext = createContext<PositionState>({ index: 0, openRequest: null });

export const LogPositionProvider = PositionContext.Provider;

/* ── FOLD (one per log) ── */

interface FoldState {
  /** The body is cut to its folded height right now. */
  folded: boolean;
  /** Unfolded by the reader, and tall enough to fold again. */
  canFoldBack: boolean;
  expand: () => void;
  foldBack: () => void;
  /** Reported by LogFold's ResizeObserver: is the body over the fold limit? */
  setTall: (tall: boolean) => void;
}

const FoldContext = createContext<FoldState>({
  folded: false,
  canFoldBack: false,
  expand: () => {},
  foldBack: () => {},
  setTall: () => {},
});

export function LogFoldScope({
  day,
  likelyTall,
  children,
}: {
  day: number;
  /** Server-side guess at whether the body will be over the limit, used
   *  until the client has measured — so a log that will fold renders
   *  folded from the first paint instead of jumping. */
  likelyTall: boolean;
  children: ReactNode;
}) {
  const { index, openRequest } = useContext(PositionContext);
  const alwaysOpen = index < ALWAYS_OPEN_COUNT;
  const [expanded, setExpanded] = useState(false);
  const [measuredTall, setMeasuredTall] = useState<boolean | null>(null);

  useEffect(() => {
    if (openRequest?.day === day) setExpanded(true);
  }, [openRequest, day]);

  const tall = measuredTall ?? likelyTall;

  const foldBack = useCallback(() => {
    setExpanded(false);
    // Folding shrinks the log; if its top has scrolled off screen, bring
    // it back so the reader isn't dropped somewhere further down the feed.
    requestAnimationFrame(() => {
      const section = document.getElementById(`day-${day}`);
      if (section && section.getBoundingClientRect().top < 0) {
        section.scrollIntoView({ block: "start" });
      }
    });
  }, [day]);

  const value = useMemo<FoldState>(
    () => ({
      folded: !alwaysOpen && !expanded && tall,
      canFoldBack: !alwaysOpen && expanded && tall,
      expand: () => setExpanded(true),
      foldBack,
      setTall: setMeasuredTall,
    }),
    [alwaysOpen, expanded, tall, foldBack]
  );

  return <FoldContext.Provider value={value}>{children}</FoldContext.Provider>;
}

export function useLogFold() {
  return useContext(FoldContext);
}
