"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { InsightBarCard } from "./InsightBarCard";
import type { InsightRowCardItem } from "./InsightRow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./InsightCollectionBlock.module.css";

// SSR-safe default — matches the desktop count so the server-rendered
// markup and the client's first render agree (a media-query read can't
// happen inside a useState initializer without risking a hydration
// mismatch). The mobile breakpoint effect below corrects it right after
// mount if the viewport is actually narrow.
const DEFAULT_PER_PAGE = 2;
const MOBILE_PER_PAGE = 1;
const MOBILE_QUERY = "(max-width: 600px)";
const TRANSITION_MS = 280;

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface InsightCollectionBlockProps {
  title: string;
  cards: InsightRowCardItem[];
  /** Passed through to each bar's Link — set false where the caller drives its own scroll. */
  linkScroll?: boolean;
  /** Card position to open on (e.g. a bookmark's saved reading spot) —
   *  resolved to whichever page that card falls on. Defaults to page 0. */
  initialIndex?: number;
  /** Appended after the card count in the header, e.g. a bookmark's
   *  "Saved 1h ago" — so a caller can fold extra context into the
   *  existing meta line instead of appending a separate row below. */
  trailingLabel?: string;
  /** Extra control rendered in the header's button cluster, alongside
   *  the pagination arrows (e.g. a bookmark's remove control) — kept
   *  generic here so the block itself stays free of bookmark concerns. */
  headerAction?: ReactNode;
  /** Renders the collection name as a quiet label instead of a page
   *  heading — for a bookmark preview context (Recently Saved, the
   *  Insight Cards tab) where the carousel itself is the content. */
  quietHeading?: boolean;
}

/**
 * One collection shown as a heading + one row of bar cards, paginated
 * in place with "‹ ›" — no navigation, no page scroll, no carousel drag.
 * The visible pair slides out/in as a unit on each page change.
 */
export function InsightCollectionBlock({
  title,
  cards,
  linkScroll,
  initialIndex,
  trailingLabel,
  headerAction,
  quietHeading,
}: InsightCollectionBlockProps) {
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [page, setPage] = useState(() => {
    const pageCount = Math.max(1, Math.ceil(cards.length / DEFAULT_PER_PAGE));
    const initialPage = Math.floor((initialIndex ?? 0) / DEFAULT_PER_PAGE);
    return Math.min(Math.max(initialPage, 0), pageCount - 1);
  });
  const [outgoingPage, setOutgoingPage] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile shows one card per page instead of two — re-checked on resize
  // (e.g. rotating a tablet), not just at mount.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setPerPage(mq.matches ? MOBILE_PER_PAGE : DEFAULT_PER_PAGE);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(cards.length / perPage));

  // perPage changing (the effect above, or the card count itself
  // changing) can leave `page` pointing past the new last page — pull it
  // back into range rather than rendering an empty page.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  if (cards.length === 0) return null;

  const cardsForPage = (p: number) => cards.slice(p * perPage, p * perPage + perPage);
  const visible = cardsForPage(page);

  const goToPage = (next: number, dir: 1 | -1) => {
    if (next < 0 || next > pageCount - 1) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (reduceMotion) {
      setPage(next);
      setOutgoingPage(null);
      return;
    }

    setDirection(dir);
    setOutgoingPage(page);
    setPage(next);
    timerRef.current = setTimeout(() => setOutgoingPage(null), TRANSITION_MS);
  };

  const outClass = direction === 1 ? styles.slideOutFwd : styles.slideOutRev;
  const inClass = direction === 1 ? styles.slideInFwd : styles.slideInRev;

  const renderBars = (pageCards: ReturnType<typeof cardsForPage>, pageIndex: number) =>
    pageCards.map((card, i) => (
      <InsightBarCard
        key={card.slug}
        slug={card.slug}
        frontmatter={card.frontmatter}
        href={card.href}
        numberLabel={String(pageIndex * perPage + i + 1).padStart(2, "0")}
        motif={card.motif}
        scroll={linkScroll}
      />
    ));

  return (
    <section className={styles.block}>
      <div className={styles.header}>
        <div className={styles.headingLeft}>
          {quietHeading ? (
            <>
              <h2 className={cx(styles.headingText, styles.headingTextQuiet)}>{title}</h2>
              <span className={styles.count}>
                {cards.length} card{cards.length !== 1 ? "s" : ""}
                {trailingLabel ? ` · ${trailingLabel}` : ""}
              </span>
            </>
          ) : (
            <SectionHeading
              level="sub"
              label={title}
              meta={`${cards.length} card${cards.length !== 1 ? "s" : ""}${
                trailingLabel ? ` · ${trailingLabel}` : ""
              }`}
            />
          )}
        </div>

        {/* Pagination steps perPage-at-a-time — with a page's worth of
            cards or fewer there's never a second page, so the controls
            would just sit disabled. headerAction (e.g. a remove control)
            still needs the cluster even then, so the row renders
            whenever either is present. */}
        {(cards.length > perPage || headerAction) && (
          <div className={styles.swipe}>
            {cards.length > perPage && (
              <>
                <button
                  type="button"
                  className={styles.swipeBtn}
                  onClick={() => goToPage(page - 1, -1)}
                  disabled={page === 0}
                  aria-label="Previous cards"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.swipeBtn}
                  onClick={() => goToPage(page + 1, 1)}
                  disabled={page >= pageCount - 1}
                  aria-label="Next cards"
                >
                  ›
                </button>
              </>
            )}
            {headerAction}
          </div>
        )}
      </div>

      <div className={styles.stack}>
        {outgoingPage !== null && (
          <div className={cx(styles.barsLayer, styles.barsLayerOverlay, outClass)}>
            {renderBars(cardsForPage(outgoingPage), outgoingPage)}
          </div>
        )}
        <div className={cx(styles.barsLayer, outgoingPage !== null && inClass)}>
          {renderBars(visible, page)}
        </div>
      </div>
    </section>
  );
}
