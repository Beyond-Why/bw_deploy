"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { InsightSquareCard } from "./InsightSquareCard";
import { InsightCollectionBlock } from "./InsightCollectionBlock";
import { InsightRowHeadingProvider, useMixedHeading } from "./InsightRowHeadingProvider";
import { InsightReaderBlock } from "./InsightReaderBlock";
import { InsightCardIcon } from "@/components/icons";
import { LikeButton, type LikeState } from "@/components/reading/LikeButton";
import { BookmarkButton, type BookmarkState } from "@/components/reading/BookmarkButton";
import type { BookmarkMetadata } from "@/hooks/useBookmark";
import type { InsightCollection } from "@/lib/content";
import type { InsightRowCardItem } from "./InsightRow";
import styles from "./InsightCardsPanel.module.css";

interface InsightCardsPanelProps {
  /** Every collection, in frontmatter.order. The active one is derived from
   *  activeCollectionSlug — this panel owns no selection state of its own,
   *  the URL (route params) is the single source of truth. */
  collections: InsightCollection[];
  activeCollectionSlug: string;
  /**
   * Every card's MDX body IN THE ACTIVE COLLECTION, keyed by card slug —
   * rendered server-side by [collection]/layout.tsx. The active card slug
   * itself isn't a prop: this component derives it from the URL (see
   * `pathname` below), because the layout that renders this panel only
   * receives the `collection` param, not `card` — see the layout for why
   * that's the boundary that has to persist across navigation.
   */
  cardContent: Record<string, ReactNode>;
  /** Server-generated once per request — see the layout — so the zone 3
   *  heading shuffle matches between SSR and client hydration. */
  headingShuffleSeed: number;
  isAuthenticated: boolean;
  /** Like/bookmark state for activeCollectionSlug, fetched once server-side —
   *  see InsightReaderBlock for why this is per-collection, not per-card. */
  initialLikeCount: number;
  initialLiked: boolean;
  initialBookmarkCount: number;
  initialBookmarked: boolean;
}

// mulberry32 — small, fast, deterministic PRNG for a given seed. Needed
// (instead of plain Math.random) because — unlike the old homepage tab,
// which only ever rendered this panel post-hydration — this panel is now
// server-rendered as the page itself, so its first client render must
// reproduce the exact same shuffle the server produced or React flags a
// hydration mismatch.
function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ZoneThreeHeading() {
  const heading = useMixedHeading();
  return (
    <div className={styles.rowsHeadingRow}>
      <InsightCardIcon size={18} className={styles.rowsHeadingIcon} />
      <h2 className={styles.rowsHeading}>{heading}</h2>
    </div>
  );
}

export function InsightCardsPanel({
  collections,
  activeCollectionSlug,
  cardContent,
  headingShuffleSeed,
  isAuthenticated,
  initialLikeCount,
  initialLiked,
  initialBookmarkCount,
  initialBookmarked,
}: InsightCardsPanelProps) {
  const pathname = usePathname();
  const readerRef = useRef<HTMLDivElement>(null);

  // "/insight-cards/{collection}/{card}" — this layout only persists across
  // same-collection navigation, so the collection segment is always
  // activeCollectionSlug; the card segment is the one thing that actually
  // needs to come from the live URL.
  const activeCardSlug = pathname.split("/").filter(Boolean)[2] ?? "";

  // Captured once on mount. Every navigation is a fresh server render with
  // a fresh random seed, but this component instance persists across
  // card-to-card navigation (same tree position, same type — React never
  // remounts it), so re-shuffling zone 3 on every click would reorder rows
  // out from under the reader — see InsightReaderBlock's fade for the same
  // "stable shell, only the active bits move" principle.
  const [stableSeed] = useState(() => headingShuffleSeed);
  const [shuffledCollections] = useState(() => seededShuffle(collections, stableSeed));

  // Controlled scroll-to-top-of-reader-block, on landing and on every
  // subsequent card navigation — Links into/within this panel pass
  // scroll={false} so this is meant to be the only thing that moves the
  // viewport. Deferred two animation frames so it runs after Next's own
  // post-navigation focus handling (which can nudge scroll on its own) —
  // otherwise that can win the race and leave the block slightly offset.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        readerRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  const activeCollection =
    collections.find((c) => c.slug === activeCollectionSlug) ?? collections[0];

  // Computed unconditionally, ahead of the early return below, so this
  // component never calls a different number of hooks between renders.
  const otherCollections = useMemo(
    () => shuffledCollections.filter((c) => c.slug !== activeCollection?.slug),
    [shuffledCollections, activeCollection]
  );

  // Like/bookmark live here (not in InsightReaderBlock) since the buttons
  // now render in the "More from ___" header below, a sibling of the
  // reader block — both need the same live state, so it's owned by their
  // common parent. A real collection change remounts this whole panel
  // (see InsightCollectionLayout's doc comment), so no re-seed effect is
  // needed for that case; card-to-card navigation within the same
  // collection doesn't touch either state.
  const [likeState, setLikeState] = useState<LikeState>({
    count: initialLikeCount,
    liked: initialLiked,
  });
  const [bookmarkState, setBookmarkState] = useState<BookmarkState>({
    count: initialBookmarkCount,
    bookmarked: initialBookmarked,
  });

  if (!activeCollection) return null;

  const cardIndex = Math.max(
    0,
    activeCollection.cards.findIndex((c) => c.slug === activeCardSlug)
  );
  const prevCard = activeCollection.cards[cardIndex - 1];
  const nextCard = activeCollection.cards[cardIndex + 1];
  const prevHref = prevCard ? `/insight-cards/${activeCollection.slug}/${prevCard.slug}` : null;
  const nextHref = nextCard ? `/insight-cards/${activeCollection.slug}/${nextCard.slug}` : null;

  const bookmarkMetadata: BookmarkMetadata = {
    contentTitle: activeCollection.frontmatter.title,
    contentUrl: `/insight-cards/${activeCollection.slug}`,
    seriesTitle: activeCollection.frontmatter.domain,
    thumbnailUrl: activeCollection.cards[0]?.frontmatter.thumbnail ?? null,
    activeCardIndex: cardIndex,
  };

  return (
    <div className={styles.panel}>
      {/* ── Zone 1: persistent reader block ── */}
      <div ref={readerRef} className={styles.readerWrapper}>
        <InsightReaderBlock
          collection={activeCollection}
          cardIndex={cardIndex}
          content={cardContent[activeCollection.cards[cardIndex]?.slug]}
          prevHref={prevHref}
          nextHref={nextHref}
          bookmarked={bookmarkState.bookmarked}
        />
      </div>

      {/* ── Zone 2: active collection grid — square cards, the one exception to bars ── */}
      <section className={styles.grid}>
        <div className={styles.gridHeader}>
          <h2 className={styles.gridHeading}>More from {activeCollection.frontmatter.title}</h2>
          <div className={styles.gridActions}>
            <LikeButton
              contentId={activeCollection.slug}
              contentType="insight-collection"
              initialCount={likeState.count}
              initialLiked={likeState.liked}
              isAuthenticated={isAuthenticated}
              onStateChange={setLikeState}
            />
            <BookmarkButton
              contentId={activeCollection.slug}
              contentType="insight-collection"
              initialCount={bookmarkState.count}
              initialBookmarked={bookmarkState.bookmarked}
              isAuthenticated={isAuthenticated}
              metadata={bookmarkMetadata}
              onStateChange={setBookmarkState}
            />
          </div>
        </div>
        <div className={styles.gridCards}>
          {activeCollection.cards.map((card, i) => (
            <InsightSquareCard
              key={card.slug}
              slug={`${activeCollection.slug}/${card.slug}`}
              frontmatter={card.frontmatter}
              href={`/insight-cards/${activeCollection.slug}/${card.slug}`}
              motif={activeCollection.frontmatter.motif}
              position={String(i + 1).padStart(2, "0")}
              active={i === cardIndex}
              scroll={false}
            />
          ))}
        </div>
      </section>

      {/* ── Zone 3: every other collection, one swipe-paginated bar block each ── */}
      {otherCollections.length > 0 && (
        <InsightRowHeadingProvider seed={stableSeed}>
          <section className={styles.rows}>
            <ZoneThreeHeading />
            {otherCollections.map((collection) => {
              const cards: InsightRowCardItem[] = collection.cards.map((card) => ({
                slug: `${collection.slug}/${card.slug}`,
                href: `/insight-cards/${collection.slug}/${card.slug}`,
                frontmatter: card.frontmatter,
                motif: collection.frontmatter.motif,
              }));
              return (
                <InsightCollectionBlock
                  key={collection.slug}
                  title={collection.frontmatter.title}
                  cards={cards}
                  linkScroll={false}
                />
              );
            })}
          </section>
        </InsightRowHeadingProvider>
      )}
    </div>
  );
}
