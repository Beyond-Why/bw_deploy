import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import type { SeriesFrontmatter, EpisodeInfo, InsightCollection } from "@/lib/content";
import { StatusPill } from "@/components/library/StatusPill";
import { ComingSoonCard } from "@/components/library/ComingSoonCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HubDiscussion } from "@/components/reading/HubDiscussion";
import type { CurrentUser } from "@/components/comments/CommentSection";
import type { HubRecommendations } from "@/lib/hubRecommendations";
import styles from "./DeepDiveContent.module.css";
import Link from "next/link";
import Image from "next/image";

/* ──────────────────────────────────────────────────────────────
   Shared Deep Dive content renderer.
   Used by both the full page and the intercepting modal.
   ────────────────────────────────────────────────────────────── */

const EMPTY_RECOMMENDATIONS: HubRecommendations = {
  continueReading: [],
  otherDeepDives: [],
  relatedEpisodes: [],
};

/** Keyed by episode slug — see the hub page's grouped-query fetch. */
export type EpisodeStats = Record<string, { likeCount: number; commentCount: number }>;

interface DeepDiveContentProps {
  series: string;
  frontmatter: SeriesFrontmatter;
  content: string;
  episodes: EpisodeInfo[];
  /** When true, removes outer page-level padding (used inside modal) */
  compact?: boolean;
  /** Signed-in user, for the Discussion section's comment composer. */
  user?: CurrentUser | null;
  collections?: InsightCollection[];
  recommendations?: HubRecommendations;
  episodeStats?: EpisodeStats;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DeepDiveContent({
  series,
  frontmatter,
  content,
  episodes,
  compact = false,
  user = null,
  collections = [],
  recommendations = EMPTY_RECOMMENDATIONS,
  episodeStats = {},
}: DeepDiveContentProps) {
  const formattedDate = formatDate(frontmatter.date);

  return (
    <article className={compact ? styles.compact : styles.fullPage}>
      {!compact && (
        <>
          <section className={styles.heroSection}>
            <div className={`${styles.canvas} ${styles.toneDark}`}>
              {/* RIGHT: image bleeding left */}
              {frontmatter.thumbnail && (
                <div className={styles.imageStage}>
                  <Image
                    src={frontmatter.thumbnail}
                    alt={frontmatter.title}
                    fill
                    className={styles.image}
                    priority
                    sizes="60vw"
                  />
                  <div className={styles.imageFadeLeft} />
                  <div className={styles.imageFadeBottom} />
                </div>
              )}

              {/* LEFT: text block */}
              <div className={styles.content}>
                <div className={styles.badgeRow}>
                  {frontmatter.category && (
                    <span className={styles.badgeCategory}>{frontmatter.category}</span>
                  )}
                  {frontmatter.category && frontmatter.status && (
                    <span className={styles.badgeDivider}>·</span>
                  )}
                  {frontmatter.status && <StatusPill status={frontmatter.status} />}
                </div>

                <h1 className={styles.seriesTitle}>{frontmatter.title}</h1>

              </div>
            </div>
          </section>
        </>
      )}

      {compact && (
        /* Series Header for modal/compact view */
        <header className={styles.header}>
          <span className={styles.label}>Deep Dive</span>
          {frontmatter.category && (
            <span className={styles.category}>{frontmatter.category}</span>
          )}
          {frontmatter.status && <StatusPill status={frontmatter.status} />}
          <h1 className={styles.compactTitle}>{frontmatter.title}</h1>
        </header>
      )}

      {/* Series Content (from index.mdx) - only render in compact/modal view */}
      {compact && (
        <div className={styles.prose}>
          <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
        </div>
      )}

      {/* Lower Section: Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left: Episode List */}
        <div className={styles.mainCol}>
          {episodes.length > 0 && (
            <nav className={styles.episodeList}>
              <SectionHeading
                label="Episodes"
                meta={episodes.length}
                className={styles.episodeListTitle}
              />
              <div className={styles.episodes}>
                {episodes.map((ep, index) => {
                  if (ep.frontmatter.comingSoon) {
                    return (
                      <ComingSoonCard
                        key={ep.slug}
                        title={ep.frontmatter.title}
                        description={ep.frontmatter.description}
                        category={ep.frontmatter.category}
                        eta={ep.frontmatter.eta}
                      />
                    );
                  }

                  // Handle fallback thumbnail case
                  const episodeThumb = ep.frontmatter.thumbnail || frontmatter.thumbnail || "/fallback.webp";
                  const episodeNum = String(index + 1).padStart(2, "0");
                  const stats = episodeStats[ep.slug];
                  const likeCount = stats?.likeCount ?? 0;
                  const commentCount = stats?.commentCount ?? 0;

                  return (
                    <Link
                      key={ep.slug}
                      href={`/deep-dives/${series}/${ep.slug}`}
                      className={styles.episodeRow}
                      style={{ '--row-bg': `url(${episodeThumb})` } as React.CSSProperties}
                    >
                      {/* Left: Rotated Label */}
                      <div className={styles.episodeLabelCol}>
                        <span className={styles.episodeLabelText}>{episodeNum}</span>
                      </div>

                      {/* Middle: Info — expands to fill available row width,
                          so the thumbnail on the right stays flush with
                          the row's own right edge. */}
                      <div className={styles.infoCol}>
                        <h3 className={styles.epTitle}>{ep.frontmatter.title}</h3>
                        <div className={styles.epMetaWrapper}>
                          <span className={styles.epDate}>{formatDate(ep.frontmatter.date) || "Recently"}</span>
                          <span className={styles.epMetaDivider}>|</span>
                          <span className={styles.epStat}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {likeCount}
                          </span>
                          <span className={styles.epMetaDivider}>|</span>
                          <span className={styles.epStat}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                            {commentCount}
                          </span>
                        </div>
                      </div>

                      {/* Right: Square Thumbnail — fixed size, flush right */}
                      <div className={styles.thumbContainer}>
                        <Image
                          src={episodeThumb}
                          alt={ep.frontmatter.title}
                          width={120}
                          height={120}
                          className={styles.thumbImage}
                          priority={ep.episode <= 2}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>

        {/* Right: Intro text in Sidebar */}
        <aside className={styles.sidebarCol}>
          {!compact && content && (
            <div className={styles.introBox}>
              <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
            </div>
          )}
        </aside>
      </div>

      {!compact && (
        <HubDiscussion
          seriesSlug={series}
          seriesTitle={frontmatter.title}
          user={user}
          collections={collections}
          recommendations={recommendations}
        />
      )}
    </article>
  );
}
