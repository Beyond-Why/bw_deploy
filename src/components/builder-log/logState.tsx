"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ──────────────────────────────────────────────────────────────
   Client state shared across a Builder Log series page.

   - Order (newest / oldest first): the header buttons and the feed's
     end section both switch it; the feed re-sorts. Mirrored in the URL
     as ?order=oldest without a reload.
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

export function LogOrderProvider({
  initialOrder,
  children,
}: {
  initialOrder: LogOrder;
  children: ReactNode;
}) {
  const [order, setOrderState] = useState<LogOrder>(initialOrder);
  const [switchCount, setSwitchCount] = useState(0);

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

  const value = useMemo(() => ({ order, setOrder, switchCount }), [order, setOrder, switchCount]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useLogOrder() {
  return useContext(OrderContext);
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
