"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { SeriesFrontmatter, EpisodeInfo } from "@/lib/content";
import { StatusPill } from "./StatusPill";
import { NewTag } from "@/components/ui/NewTag";
import styles from "./DeepDiveCard.module.css";

interface DeepDiveCardProps {
  slug: string;
  frontmatter: SeriesFrontmatter;
  href: string;
  episodes?: EpisodeInfo[];
  /** When true: column layout, no hover strip, no hover animations (used in sidebar) */
  compact?: boolean;
}

const GAP = 12; // px — must match .episodeScroll's `gap` in DeepDiveCard.module.css

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DeepDiveCard({ slug, frontmatter, href, episodes = [], compact = false }: DeepDiveCardProps) {
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
                  return (
                    <Link
                      key={ep.slug}
                      href={epHref}
                      className={styles.episodeTile}
                      ref={(el) => {
                        tileRefs.current[i] = el;
                      }}
                    >
                      {/* Thumbnail */}
                      <div className={styles.tileThumbnail}>
                        {ep.frontmatter.thumbnail ? (
                          <img
                            src={ep.frontmatter.thumbnail}
                            alt={ep.frontmatter.title}
                            className={styles.tileThumbnailImg}
                          />
                        ) : (
                          <div className={styles.tileThumbnailPlaceholder} />
                        )}
                      </div>
                      {/* Label */}
                      <div className={styles.tileLabel}>
                        <span className={styles.tileEpNum}>
                          EP {String(ep.episode).padStart(2, "0")}
                        </span>
                        <span className={styles.tileTitle}>{ep.frontmatter.title}</span>
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
