"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { InsightCardIcon } from "@/components/icons";
import { generateCardMotif, MOTIF_VIEWBOX } from "@/lib/cardMotif";
import type { InsightCollection } from "@/lib/content";
import styles from "./InsightReaderBlock.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface InsightReaderBlockProps {
  collection: InsightCollection;
  cardIndex: number;
  content: ReactNode;
  /** Card-to-card navigation is real routing — arrows are links, null at the ends (no looping). */
  prevHref: string | null;
  nextHref: string | null;
  /** Whether the collection is currently bookmarked. The like/bookmark
   *  buttons themselves live in the parent panel's "More from ___" header
   *  (not in this block), but this still needs the flag to know whether
   *  to keep the silent activeCardIndex PATCH (below) firing. */
  bookmarked: boolean;
}

interface Snapshot {
  key: string;
  collection: InsightCollection;
  cardIndex: number;
  content: ReactNode;
}

/** One card's two-pane content: left = meta/diagram/question, right = MDX body. */
function ReaderPane({ collection, cardIndex, content }: Omit<Snapshot, "key">) {
  const card = collection.cards[cardIndex];
  const total = collection.cards.length;
  const hasThumbnail = Boolean(card.frontmatter.thumbnail);
  const cardKey = `${collection.slug}/${card.slug}`;

  // Tier 2 fallback (same generative motif as the card face) — never
  // load-bearing, so a throw just drops to the plain Tier 3 surface.
  let motif = null;
  if (!hasThumbnail) {
    try {
      motif = generateCardMotif(collection.frontmatter.motif ?? "radial", cardKey);
    } catch {
      motif = null;
    }
  }

  return (
    <div className={styles.split}>
      {/* ── Left pane: meta, concept diagram, question ── */}
      <div className={styles.leftPane}>
        <div className={styles.meta}>
          <div className={styles.metaLeft}>
            <InsightCardIcon size={14} className={styles.metaIcon} />
            <span className={styles.collectionName}>{collection.frontmatter.title}</span>
          </div>

          <span className={styles.position}>
            {String(cardIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        <div className={styles.visual}>
          {hasThumbnail && (
            <img src={card.frontmatter.thumbnail} alt="" className={styles.visualImage} />
          )}
          {!hasThumbnail && motif && (
            <svg
              className={styles.visualMotif}
              viewBox={MOTIF_VIEWBOX}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              {motif.paths.map((p, i) => (
                <path key={`p-${i}`} d={p.d} className={styles.motifStroke} />
              ))}
              {motif.lines.map((l, i) => (
                <line
                  key={`l-${i}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  className={styles.motifStroke}
                />
              ))}
              {motif.circles.map((c, i) => (
                <circle
                  key={`c-${i}`}
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  className={c.filled ? styles.motifFill : styles.motifStroke}
                />
              ))}
            </svg>
          )}
        </div>

        <h1 className={styles.title}>{card.frontmatter.title}</h1>
      </div>

      {/* ── Right pane: MDX body, inner-scrolls if long ── */}
      <div className={styles.rightPane}>
        {card.frontmatter.description && (
          <p className={styles.description}>{card.frontmatter.description}</p>
        )}
        <div className={styles.body}>{content}</div>
      </div>
    </div>
  );
}

export function InsightReaderBlock({
  collection,
  cardIndex,
  content,
  prevHref,
  nextHref,
  bookmarked,
}: InsightReaderBlockProps) {
  const card = collection.cards[cardIndex];
  const cardKey = `${collection.slug}/${card.slug}`;

  // Already-bookmarked collections silently track the card the user
  // last landed on, so the profile's saved carousel resumes there —
  // debounced so a fast prev/next flick doesn't fire a PATCH per card.
  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!bookmarked) return;
    if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    patchTimerRef.current = setTimeout(() => {
      fetch("/api/bookmarks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: collection.slug,
          contentType: "insight-collection",
          activeCardIndex: cardIndex,
        }),
      }).catch(() => {});
    }, 2000);
    return () => {
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    };
  }, [cardIndex, collection.slug, bookmarked]);

  // Stack-slide transition: when the card changes, the previous render's
  // pane is kept around as `outgoing` (sliding out) while the new props
  // render as the incoming layer (rising from the deck). Direction is
  // forward/back based on index within the same collection; a cross-
  // collection jump has no natural "position" to compare, so it defaults
  // forward. Skipped entirely under prefers-reduced-motion (instant swap).
  const prevRef = useRef<Snapshot>({ key: cardKey, collection, cardIndex, content });
  const [outgoing, setOutgoing] = useState<Snapshot | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.key === cardKey) return;

    const dir: 1 | -1 =
      collection.slug === prev.collection.slug ? (cardIndex > prev.cardIndex ? 1 : -1) : 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setDirection(dir);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (reduceMotion) {
      setOutgoing(null);
    } else {
      setOutgoing(prev);
      timerRef.current = setTimeout(() => setOutgoing(null), 320);
    }

    prevRef.current = { key: cardKey, collection, cardIndex, content };
  }, [cardKey, collection, cardIndex, content]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const outClass = direction === 1 ? styles.slideOutFwd : styles.slideOutRev;
  const inClass = direction === 1 ? styles.slideInFwd : styles.slideInRev;

  return (
    <div className={styles.gutterGrid}>
      {prevHref ? (
        <Link href={prevHref} scroll={false} className={styles.arrow} aria-label="Previous card">
          ‹
        </Link>
      ) : (
        <button type="button" className={styles.arrow} disabled aria-label="Previous card">
          ‹
        </button>
      )}

      {/* ── Deck — the card plus two faint layers peeking out behind it ── */}
      <div className={styles.deck}>
        <div className={styles.deckLayer2} aria-hidden="true" />
        <div className={styles.deckLayer1} aria-hidden="true" />

        <div className={styles.inner}>
          {outgoing && (
            <div key={outgoing.key} className={cx(styles.layer, outClass)}>
              <ReaderPane
                collection={outgoing.collection}
                cardIndex={outgoing.cardIndex}
                content={outgoing.content}
              />
            </div>
          )}
          <div key={cardKey} className={cx(styles.layer, outgoing ? inClass : undefined)}>
            <ReaderPane collection={collection} cardIndex={cardIndex} content={content} />
          </div>
        </div>
      </div>

      {nextHref ? (
        <Link href={nextHref} scroll={false} className={styles.arrow} aria-label="Next card">
          ›
        </Link>
      ) : (
        <button type="button" className={styles.arrow} disabled aria-label="Next card">
          ›
        </button>
      )}

      {/* ── Mobile-only nav — hidden on desktop via CSS, where the gutter
          arrows above serve the same purpose. Same hrefs/handlers as those
          arrows, so navigating here triggers the exact same route change
          and the same slide transition. ── */}
      <div className={styles.mobileNav}>
        {prevHref ? (
          <Link href={prevHref} scroll={false} className={styles.mobileNavBtn} aria-label="Previous card">
            ‹
          </Link>
        ) : (
          <button type="button" className={styles.mobileNavBtn} disabled aria-label="Previous card">
            ‹
          </button>
        )}
        <span className={styles.mobileNavPosition}>
          {String(cardIndex + 1).padStart(2, "0")} / {String(collection.cards.length).padStart(2, "0")}
        </span>
        {nextHref ? (
          <Link href={nextHref} scroll={false} className={styles.mobileNavBtn} aria-label="Next card">
            ›
          </Link>
        ) : (
          <button type="button" className={styles.mobileNavBtn} disabled aria-label="Next card">
            ›
          </button>
        )}
      </div>
    </div>
  );
}
