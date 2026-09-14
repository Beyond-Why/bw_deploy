"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type {
  EpisodeFrontmatter,
  EpisodeInfo,
  SeriesFrontmatter,
  InsightCardFrontmatter,
} from "@/lib/content";
import styles from "./EpisodeReader.module.css";
import { ExploreSidebar } from "./ExploreSidebar";
import { setLastOpenedEpisode } from "@/lib/progress";
import { TableOfContents } from "./TableOfContents";
import { LikeButton } from "./LikeButton";
import { BookmarkButton } from "./BookmarkButton";
import type { BookmarkMetadata } from "@/hooks/useBookmark";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { CommentSection, type CurrentUser } from "@/components/comments/CommentSection";
import { ShareModal } from "@/components/ShareModal";

// Must match TOC's TOP_ID (see TableOfContents.tsx) — no shared
// constants module between the two files, so it's duplicated deliberately.
const TOP_ID = "episode-top";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface ChapterSegmentsProps {
  series: string;
  episodes: EpisodeInfo[];
  currentIndex: number;
  scrollProgress: number;
}

/* ──────────────────────────────────────────────────────────────
   Segmented chapter navigator — one flex segment per episode,
   replacing the old single index-based progress line. The current
   segment's fill tracks live in-page scroll progress.
   ────────────────────────────────────────────────────────────── */
function ChapterSegments({
  series,
  episodes,
  currentIndex,
  scrollProgress,
}: ChapterSegmentsProps) {
  const segmentRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    index: number
  ) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      segmentRefs.current[index + 1]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      segmentRefs.current[index - 1]?.focus();
    } else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      e.currentTarget.click();
    }
  };

  if (episodes.length === 0) return null;

  return (
    <div className={styles.chapterNav}>
      <nav aria-label="Episode navigation" className={styles.segments}>
        {episodes.map((ep, index) => {
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;
          const isLast = index === episodes.length - 1;
          const epLabel = String(index + 1).padStart(2, "0");
          // Never render an empty tooltip — fall back to just "EP 0N" if
          // the title is missing for any reason.
          const tooltipText = ep?.frontmatter?.title
            ? `EP ${epLabel} · ${ep.frontmatter.title}`
            : `EP ${epLabel}`;

          return (
            // One link covers the whole episode control — the bar AND its
            // label below it — so hovering/clicking either triggers the
            // same state and both are part of the same target.
            <Link
              key={ep.slug}
              href={`/deep-dives/${series}/${ep.slug}`}
              ref={(el) => {
                segmentRefs.current[index] = el;
              }}
              className={styles.episodeItem}
              aria-current={isCurrent ? "page" : undefined}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <span
                className={cx(
                  styles.segment,
                  isCurrent && styles.segmentCurrent,
                  isPast && styles.segmentPast,
                  !isCurrent && !isPast && styles.segmentFuture
                )}
              >
                {isCurrent && (
                  <span
                    className={styles.segmentFill}
                    style={{ width: `${scrollProgress * 100}%` }}
                  />
                )}
                <span
                  className={cx(styles.tooltip, isLast && styles.tooltipRight)}
                >
                  {tooltipText}
                </span>
              </span>
              <span
                className={cx(
                  styles.chapterLabel,
                  isCurrent && styles.chapterLabelCurrent
                )}
                aria-hidden="true"
              >
                EP {epLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Action bar — Like, Comment, Bookmark (left), Share (right).
   Like and Bookmark are wired to the DB (see LikeButton/useLike and
   BookmarkButton/useBookmark); Comment and Share remain local UI
   state only, no persistence.
   ────────────────────────────────────────────────────────────── */
interface ActionBarProps {
  contentId: string;
  title: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialBookmarkCount: number;
  initialBookmarked: boolean;
  bookmarkMetadata: BookmarkMetadata;
  isAuthenticated: boolean;
  scrollPercent: number;
  onCommentClick: () => void;
}

function ActionBar({
  contentId,
  title,
  initialLikeCount,
  initialLiked,
  initialBookmarkCount,
  initialBookmarked,
  bookmarkMetadata,
  isAuthenticated,
  scrollPercent,
  onCommentClick,
}: ActionBarProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className={styles.actionBar}>
      <div className={styles.actionGroupLeft}>
        <LikeButton
          contentId={contentId}
          contentType="episode"
          initialCount={initialLikeCount}
          initialLiked={initialLiked}
          isAuthenticated={isAuthenticated}
          scrollPercent={scrollPercent}
        />

        <button
          type="button"
          className={styles.actionBtn}
          aria-label="Discussion"
          title="Discussion"
          onClick={onCommentClick}
        >
          <svg
            className={cx(styles.actionIcon, styles.iconRotateOnHover)}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>

        <BookmarkButton
          contentId={contentId}
          contentType="episode"
          initialCount={initialBookmarkCount}
          initialBookmarked={initialBookmarked}
          isAuthenticated={isAuthenticated}
          metadata={bookmarkMetadata}
          scrollPercent={scrollPercent}
        />
      </div>

      <div className={styles.actionGroupRight}>
        <button
          type="button"
          className={cx(styles.actionBtn, styles.shareBtn)}
          aria-label="Share"
          onClick={() => setShareOpen(true)}
        >
          <svg
            className={styles.actionIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
            <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          </svg>
          <span>Share</span>
        </button>
      </div>

      {shareOpen && (
        <ShareModal
          url={typeof window !== "undefined" ? window.location.href : ""}
          shareTitle={title}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

interface EpisodeReaderProps {
  series: string;
  seriesTitle: string;
  frontmatter: EpisodeFrontmatter;
  episodes: EpisodeInfo[];
  currentIndex: number;
  currentEpisodeSlug: string;
  prevEpisode: EpisodeInfo | null;
  nextEpisode: EpisodeInfo | null;
  relatedSeries: {
    slug: string;
    frontmatter: SeriesFrontmatter;
    episodes: EpisodeInfo[];
  }[];
  builderLogs: {
    slug: string;
    frontmatter: SeriesFrontmatter;
    episodes: EpisodeInfo[]
  }[];
  insightCards: { slug: string; frontmatter: InsightCardFrontmatter; collectionTitle: string }[];
  /** Globally-unique id for likes/reading-progress, e.g. "deep-dives/{series}/{episode}". */
  contentId: string;
  /** Same shape one level up, e.g. "deep-dives/{series}" — for Continue Reading grouping. */
  seriesId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialBookmarkCount: number;
  initialBookmarked: boolean;
  bookmarkMetadata: BookmarkMetadata;
  isAuthenticated: boolean;
  /** Scroll position (0–1) to restore to on mount, only when the visitor arrived via a "Continue Reading" link. */
  resumeScrollPercent?: number | null;
  /** Signed-in user, shaped for the comment section's author-identity snapshot. Null when signed out. */
  user: CurrentUser | null;
  children?: React.ReactNode;
}

export function EpisodeReader({
  series,
  seriesTitle,
  frontmatter,
  episodes,
  currentIndex,
  currentEpisodeSlug,
  prevEpisode,
  nextEpisode,
  relatedSeries,
  builderLogs,
  insightCards,
  contentId,
  seriesId,
  initialLikeCount,
  initialLiked,
  initialBookmarkCount,
  initialBookmarked,
  bookmarkMetadata,
  isAuthenticated,
  resumeScrollPercent,
  user,
  children,
}: EpisodeReaderProps) {
  const [mode, setMode] = useState<"focus" | "explore">("focus");
  // paneVisible drives the fade: false = transparent, true = opaque
  const [paneVisible, setPaneVisible] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"explore" | "comments">("explore");
  const switchingRef = useRef(false);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const handleRequestCommentAuth = useCallback(() => {
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  // ── Guard: never enter explore below 768px ──────────────────────────────
  const enterExplore = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    setMode("explore");
  }, []);

  const exitExplore = useCallback(() => {
    setMode("focus");
  }, []);

  // ── Crossfade transition wrapper ─────────────────────────────────────
  // Fade out (150ms) → switch mode → fade in (150ms)
  const switchMode = useCallback((next: "focus" | "explore") => {
    if (switchingRef.current) return;
    switchingRef.current = true;
    setPaneVisible(false);
    setTimeout(() => {
      if (next === "explore") {
        // Re-check width at switch time
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          switchingRef.current = false;
          setPaneVisible(true);
          return;
        }
      }
      setMode(next);
      // Give React one tick to re-render the new layout, then fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPaneVisible(true);
          switchingRef.current = false;
        });
      });
    }, 150);
  }, []);

  // Comment action-bar button: jump straight to the Comments tab, entering
  // Explore mode first if we're currently in Focus mode. The sidebar is
  // its own scroll container, so switching tabs should reset ITS scroll
  // position, not the page's.
  const handleCommentClick = useCallback(() => {
    setSidebarTab("comments");
    if (mode === "focus") {
      switchMode("explore");
    } else {
      rightPaneRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [mode, switchMode]);

  // ── Resize listener: keep mode + viewport in sync ──────────────────────
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768 && mode === "explore") {
        setMode("focus");
        setPaneVisible(true);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode]);

  // ── Announce mode changes to ModeToggleBtn in the navbar ─────────────
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("explore-mode-change", {
        detail: { explore: mode === "explore" },
      })
    );
  }, [mode]);

  // ── Tell navbar button this reader is mounted / unmounted ─────────────
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("episode-reader-mounted"));
    return () => {
      window.dispatchEvent(new CustomEvent("episode-reader-unmounted"));
    };
  }, []);

  // ── Listen for toggle requests from navbar button ────────────────────
  useEffect(() => {
    const onToggle = () => {
      if (mode === "explore") {
        switchMode("focus");
      } else {
        // Entering explore via the normal mode toggle always resets to the
        // Explore tab — only the Comment action-bar button opens Comments.
        setSidebarTab("explore");
        switchMode("explore");
      }
    };
    window.addEventListener("explore-toggle", onToggle);
    return () => window.removeEventListener("explore-toggle", onToggle);
  }, [mode, switchMode]);

  // ── Track last opened episode in progress utility ─────────────────────
  useEffect(() => {
    if (series && currentEpisodeSlug) {
      setLastOpenedEpisode(series, currentEpisodeSlug);
    }
  }, [series, currentEpisodeSlug]);

  // ── In-page scroll progress for the current chapter segment's fill ────
  // Focus mode scrolls the window; Explore mode scrolls .leftPane itself.
  useEffect(() => {
    let ticking = false;

    const computeProgress = () => {
      let ratio = 0;
      if (mode === "explore" && leftPaneRef.current) {
        const el = leftPaneRef.current;
        const max = el.scrollHeight - el.clientHeight;
        ratio = max > 0 ? el.scrollTop / max : 0;
      } else {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        ratio = max > 0 ? window.scrollY / max : 0;
      }
      setScrollProgress(Math.min(1, Math.max(0, ratio)));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(computeProgress);
      }
    };

    const target: Window | HTMLDivElement =
      mode === "explore" && leftPaneRef.current ? leftPaneRef.current : window;

    target.addEventListener("scroll", onScroll, { passive: true });
    computeProgress();

    return () => target.removeEventListener("scroll", onScroll);
  }, [mode, currentEpisodeSlug]);

  const { markCompleted } = useReadingProgress({
    contentId,
    contentType: "episode",
    seriesId,
    scrollProgress,
    isAuthenticated,
  });

  // ── Scroll restoration — only when arriving via a "Continue Reading" link ──
  // Deliberately empty deps: this should only ever apply the initial
  // resume value once, not re-fire as scrollProgress/resumeScrollPercent change.
  useEffect(() => {
    if (resumeScrollPercent == null) return;
    const timer = setTimeout(() => {
      const max = document.body.scrollHeight - window.innerHeight;
      if (max > 0) {
        window.scrollTo({ top: resumeScrollPercent * max, behavior: "smooth" });
      }
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const articleContent = (
    <article className={styles.article}>
      <header id={TOP_ID} className={styles.header}>
        {/* ── Sticky image layer — pinned via CSS `position: sticky`,
             height driven by the --hero-h budget (see .shellFocus /
             .shellExplore). Absent when the episode has no thumbnail. ── */}
        {frontmatter.thumbnail && (
          <div className={styles.imageLayer}>
            <img
              src={frontmatter.thumbnail}
              alt={frontmatter.title}
              className={styles.heroImage}
            />
          </div>
        )}

        {/* ── Article block — rises over the pinned image via negative
             margin (only when an image actually renders above it). ── */}
        <div
          className={cx(
            styles.articleBlock,
            frontmatter.thumbnail && styles.articleBlockOverlap
          )}
        >
          {/* ── Title ── */}
          <h1 className={styles.title}>{frontmatter.title}</h1>

          {/* ── Series link ── */}
          <Link href={`/deep-dives/${series}`} className={styles.seriesLink}>
            ← {seriesTitle}
          </Link>

          {/* ── Action Bar ── */}
          <ActionBar
            contentId={contentId}
            title={frontmatter.title}
            initialLikeCount={initialLikeCount}
            initialLiked={initialLiked}
            initialBookmarkCount={initialBookmarkCount}
            initialBookmarked={initialBookmarked}
            bookmarkMetadata={bookmarkMetadata}
            isAuthenticated={isAuthenticated}
            scrollPercent={scrollProgress}
            onCommentClick={handleCommentClick}
          />
        </div>
      </header>

      {/* ── Segmented chapter navigator ── */}
      <ChapterSegments
        series={series}
        episodes={episodes}
        currentIndex={currentIndex}
        scrollProgress={scrollProgress}
      />

      {/* ── MDX Content — rendered as children from server ── */}
      <div className={styles.prose}>{children}</div>

      {/* ── Episode navigation ── */}
      <nav className={styles.navigation}>
        {prevEpisode ? (
          <Link
            href={`/deep-dives/${series}/${prevEpisode.slug}`}
            className={styles.navLink}
          >
            <span className={styles.navEpNumber}>
              EP {String(prevEpisode.episode).padStart(2, "0")}
            </span>
            <span className={styles.navDirection}>← Previous</span>
            <span className={styles.navTitle}>{prevEpisode.frontmatter.title}</span>
          </Link>
        ) : (
          <Link
            href={`/deep-dives/${series}`}
            className={`${styles.navLink} ${styles.navLinkMuted}`}
          >
            <span className={styles.navDirection}>← Back</span>
            <span className={styles.navTitle}>Series Overview</span>
          </Link>
        )}

        {nextEpisode ? (
          <Link
            href={`/deep-dives/${series}/${nextEpisode.slug}`}
            className={`${styles.navLink} ${styles.navLinkNext}`}
            onClick={markCompleted}
          >
            <span className={styles.navEpNumber}>
              EP {String(nextEpisode.episode).padStart(2, "0")}
            </span>
            <span className={styles.navDirection}>Next →</span>
            <span className={styles.navTitle}>{nextEpisode.frontmatter.title}</span>
          </Link>
        ) : (
          <div
            className={`${styles.navLink} ${styles.navLinkNext} ${styles.navLinkMuted} ${styles.navLinkDisabled}`}
          >
            <span className={styles.navDirection}>Fin</span>
            <span className={styles.navTitle}>You&apos;ve reached the end</span>
            <span className={styles.navSubtext}>
              You&apos;ve reached the end of this series.
            </span>
          </div>
        )}
      </nav>
    </article>
  );

  // CSS classes for fade state
  const paneClass = paneVisible ? styles.leftPaneVisible : styles.leftPaneFading;

  return (
    <>
      {/*
        Rendered as a sibling of the mode shell — not nested inside
        .leftPane / .contentWrapper — so it never sits inside either
        mode's scroll container and its `position: fixed` always
        resolves against the viewport, not a scrolling ancestor.
      */}
      <TableOfContents />

      <div className={mode === "explore" ? styles.shellExplore : styles.shellFocus}>
        {/* ── LEFT PANE — article content ── */}
        <div className={`${styles.leftPane} ${paneClass}`}>
          <div className={styles.contentWrapper}>
            {mode === "explore" ? (
              // .articleFrame is the actual scroll container in Explore mode
              // (see EpisodeReader.module.css) — the ref that drives scroll
              // progress needs to be on whichever element really scrolls.
              <div className={styles.articleFrame} ref={leftPaneRef}>
                {articleContent}
              </div>
            ) : (
              articleContent
            )}
          </div>
        </div>

        {/* ── RIGHT PANE — sidebar (explore mode only) ── */}
        {mode === "explore" && (
          <div className={styles.rightPane} ref={rightPaneRef}>
            <div className={styles.sidebarTabBar}>
              <div className={styles.sidebarTabGroup}>
                <button
                  type="button"
                  className={cx(
                    styles.sidebarTab,
                    sidebarTab === "explore" && styles.sidebarTabActive
                  )}
                  aria-current={sidebarTab === "explore" ? "true" : undefined}
                  onClick={() => setSidebarTab("explore")}
                >
                  Explore
                </button>
                <button
                  type="button"
                  className={cx(
                    styles.sidebarTab,
                    sidebarTab === "comments" && styles.sidebarTabActive
                  )}
                  aria-current={sidebarTab === "comments" ? "true" : undefined}
                  onClick={() => setSidebarTab("comments")}
                >
                  Discussion
                </button>
              </div>
            </div>

            {sidebarTab === "explore" ? (
              <ExploreSidebar
                series={series}
                seriesTitle={seriesTitle}
                episodes={episodes}
                currentEpisodeSlug={currentEpisodeSlug}
                relatedSeries={relatedSeries}
                builderLogs={builderLogs}
                insightCards={insightCards}
              />
            ) : (
              <div className={styles.sidebarComments}>
                <CommentSection
                  contentId={contentId}
                  seriesId={series}
                  contentType="episode"
                  episodeNumber={String(frontmatter.episode)}
                  episodeTitle={frontmatter.title}
                  user={user}
                  onRequestAuth={handleRequestCommentAuth}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
