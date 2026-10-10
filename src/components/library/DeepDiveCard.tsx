"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { SeriesFrontmatter, EpisodeInfo, EpisodeStats } from "@/lib/content";
import { StatusPill } from "./StatusPill";
import { NewTag } from "@/components/ui/NewTag";
import { formatDate } from "@/lib/formatDate";
import styles from "./DeepDiveCard.module.css";

interface DeepDiveCardProps {
  slug: string;
  frontmatter: SeriesFrontmatter;
  href: string;
  episodes?: EpisodeInfo[];
  /** Episode like/comment counts keyed by contentId
   *  (`deep-dives/<slug>/<episode>`). Missing entries render date only. */
  episodeStats?: EpisodeStats;
  /** When true: column layout, no hover strip, no hover animations (used in sidebar) */
  compact?: boolean;
}

const GAP = 12; // px — must match .episodeScroll's `gap` in DeepDiveCard.module.css

export function DeepDiveCard({ slug, frontmatter, href, episodes = [], episodeStats, compact = false }: DeepDiveCardProps) {
  const date = formatDate(frontmatter.date);

  // Sort episodes ascending by episode number
  const sortedEpisodes = [...episodes].sort((a, b) => a.episode - b.episode);

  // ── Hover-reveal state — lives on the card, not the title ────────────────
  // Previously this was pure CSS (`.body:has(.titleLink:hover) .episodeStrip`),
  // which meant leaving the title — including moving DOWN into the strip it
  // had just revealed — collapsed it instantly, since nothing else kept the
  // hover condition true. State on the card + onMouseLeave on the card (not
  // the title) means the reveal survives moving anywhere inside the card,
  // including the strip itself.
  const [expanded, setExpanded] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  useEffect(() => clearCloseTimer, []);

  const openStrip = () => {
    if (compact) return;
    clearCloseTimer();
    setExpanded(true);
  };

  // Small delay so a fast diagonal mouse movement across the card's corner
  // (title → strip, cutting outside the card boundary for a frame) doesn't
  // flicker the strip closed and immediately back open.
  const scheduleClose = () => {
    if (compact) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setExpanded(false);
      closeTimerRef.current = null;
    }, 100);
  };

  // ── Carousel state — mirrors InsightRow's carousel exactly ──────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, sortedEpisodes.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    const tile = tileRefs.current[0];
    if (!el) return;
    // One whole tile width + gap — never a fixed pixel guess — so a press
    // always lands a tile edge flush with the track start.
    const step = tile ? tile.offsetWidth + GAP : el.clientWidth * 0.8;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tileRefs.current.findIndex((el) => el === document.activeElement);
    if (currentIndex === -1) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      tileRefs.current[currentIndex + 1]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      tileRefs.current[currentIndex - 1]?.focus();
    }
  };

  return (
    <div
      className={`${styles.card} ${compact ? styles.cardCompact : ""} ${expanded ? styles.cardExpanded : ""}`}
      onMouseLeave={scheduleClose}
    >
      {/* ── Left zone: 16:9 thumbnail — links to series page ── */}
      <Link href={href} className={styles.thumbnailWrapper} tabIndex={-1}>
        {frontmatter.thumbnail ? (
          <img
            src={frontmatter.thumbnail}
            alt={frontmatter.title}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnailPlaceholder} aria-hidden="true" />
        )}
      </Link>

      {/* ── Right zone: text + hover carousel ── */}
      <div className={styles.body}>

        {/* Text hierarchy */}
        <div className={styles.textBlock}>
          {/* 1. Category */}
          <div className={styles.categoryRow}>
            <span className={styles.category}>
              {(frontmatter.category as string) || "Deep Dive"}
            </span>
            <NewTag publishedAt={frontmatter.publishedAt} date={frontmatter.date} />
          </div>

          {/* 2. Title */}
          <Link
            href={href}
            className={styles.titleLink}
            onMouseEnter={openStrip}
            onFocus={openStrip}
            onBlur={scheduleClose}
          >
            <h2 className={styles.title}>{frontmatter.title}</h2>
          </Link>

          {/* 3. Description */}
          {frontmatter.description && (
            <div className={styles.descriptionWrapper}>
              <p className={styles.description}>{frontmatter.description}</p>
            </div>
          )}

          {/* 4. Meta row */}
          <div className={styles.meta}>
            {date && <span className={styles.date}>{date}</span>}
            {frontmatter.status && <StatusPill status={frontmatter.status} />}
          </div>
        </div>

        {/* ── Hover Progress Bar ── */}
        {sortedEpisodes.length > 0 && (
          <div className={styles.progressContainer} aria-hidden="true">
            <div className={styles.progressBar} />
          </div>
        )}

        {/* ── Episode carousel — revealed on hover ── */}
        {sortedEpisodes.length > 0 && (
          <div className={styles.episodeStrip}>
            <div className={styles.carouselWrapper}>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollBy(-1)}
                disabled={!canScrollLeft}
                aria-label="Previous episodes"
              >
                ‹
              </button>

              {/* Scrollable tile row */}
              <div
                className={styles.episodeScroll}
                ref={scrollRef}
                onKeyDown={handleKeyDown}
              >
                {sortedEpisodes.map((ep, i) => {
                  const epHref = `/deep-dives/${slug}/${ep.slug}`;
                  const epLabel = `EP ${String(ep.episode).padStart(2, "0")}`;
                  const epDate = formatDate(ep.frontmatter.date);
                  const stats = episodeStats?.[`deep-dives/${slug}/${ep.slug}`];
                  const likeCount = stats?.likeCount ?? 0;
                  const commentCount = stats?.commentCount ?? 0;
                  return (
                    <Link
                      key={ep.slug}
                      href={epHref}
                      className={styles.episodeTile}
                      aria-label={`Episode ${ep.episode}: ${ep.frontmatter.title}`}
                      ref={(el) => {
                        tileRefs.current[i] = el;
                      }}
                    >
                      {/* Thumbnail + episode-number overlay */}
                      <div className={styles.tileThumbnail}>
                        {ep.frontmatter.thumbnail ? (
                          <img
                            src={ep.frontmatter.thumbnail}
                            alt=""
                            className={styles.tileThumbnailImg}
                          />
                        ) : (
                          <div className={styles.tileThumbnailPlaceholder} />
                        )}
                        {/* Centred label at rest, cross-fades to the corner
                            one on hover/focus — two spans on opacity rather
                            than animating flex alignment. */}
                        <div className={styles.tileScrim}>
                          <span className={styles.tileEpCentre}>{epLabel}</span>
                          <span className={styles.tileEpCorner} aria-hidden="true">
                            {epLabel}
                          </span>
                        </div>
                      </div>
                      {/* Label */}
                      <div className={styles.tileLabel}>
                        <span className={styles.tileTitle}>{ep.frontmatter.title}</span>
                        <div className={styles.tileMeta}>
                          {epDate && <span>{epDate}</span>}
                          {(likeCount > 0 || commentCount > 0) && (
                            <span className={styles.tileStats}>
                              {likeCount > 0 && (
                                <span className={styles.tileStat}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                  </svg>
                                  {likeCount}
                                </span>
                              )}
                              {commentCount > 0 && (
                                <span className={styles.tileStat}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                  </svg>
                                  {commentCount}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollBy(1)}
                disabled={!canScrollRight}
                aria-label="Next episodes"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
