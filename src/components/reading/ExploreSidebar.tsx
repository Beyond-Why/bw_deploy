import Link from "next/link";
import type {
  EpisodeInfo,
  SeriesFrontmatter,
  InsightCardFrontmatter,
} from "@/lib/content";
import { RecommendationFeed } from "./RecommendationFeed";
import styles from "./ExploreSidebar.module.css";

// The sidebar is a single standalone insight shelf, not one of the
// homepage's several mixed rows sharing one shuffled deck — there's no
// InsightRowHeadingProvider mounted here, so RecommendationFeed's
// useMixedHeading() falls back to the pool's first entry ("Start
// anywhere") by design.

interface ExploreSidebarProps {
  series: string;
  seriesTitle: string;
  episodes: EpisodeInfo[];
  currentEpisodeSlug: string;
  /** "?mode=explore" (or "" for Focus) — appended to the episode queue's
   *  own links below so picking another episode from here doesn't reset
   *  back to the Focus default (see EpisodeReader.tsx). */
  modeQuery: string;
  relatedSeries: {
    slug: string;
    frontmatter: SeriesFrontmatter;
    episodes: EpisodeInfo[];
  }[];
  builderLogs: {
    slug: string;
    frontmatter: SeriesFrontmatter;
    episodes: EpisodeInfo[];
  }[];
  insightCards: { slug: string; frontmatter: InsightCardFrontmatter; collectionTitle: string }[];
}

export function ExploreSidebar({
  series,
  seriesTitle,
  episodes,
  currentEpisodeSlug,
  modeQuery,
  relatedSeries,
  builderLogs,
  insightCards,
}: ExploreSidebarProps) {
  return (
    <div className={styles.sidebar}>

      {/* ══════════════════════════════════════════════════════
          TOP — Episode queue (YouTube playlist panel style)
          ══════════════════════════════════════════════════════ */}
      <div className={styles.queuePanel}>
        {/* Panel header */}
        <div className={styles.queueHeader}>
          <Link href={`/deep-dives/${series}`} className={styles.queueSeriesLink}>
            {seriesTitle}
          </Link>
          <p className={styles.queueMeta}>
            {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Episode rows */}
        <div className={styles.episodeList}>
          {episodes.map((ep) => {
            const isActive = ep.slug === currentEpisodeSlug;
            const href = `/deep-dives/${series}/${ep.slug}${modeQuery}`;
            return (
              <Link
                key={ep.slug}
                href={href}
                className={`${styles.episodeRow} ${isActive ? styles.episodeRowActive : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Playing indicator bar */}
                {isActive && <span className={styles.playingBar} aria-hidden="true" />}

                {/* Thumbnail */}
                <div className={styles.epThumb}>
                  {ep.frontmatter.thumbnail ? (
                    <img
                      src={ep.frontmatter.thumbnail}
                      alt={ep.frontmatter.title}
                      className={styles.epThumbImg}
                    />
                  ) : (
                    <div className={styles.epThumbPlaceholder} />
                  )}
                  {/* Now playing overlay */}
                  {isActive && (
                    <div className={styles.nowPlayingOverlay} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={styles.epInfo}>
                  <span className={styles.epNum}>
                    EP {String(ep.episode).padStart(2, "0")}
                    {isActive && <span className={styles.nowPlayingLabel}> · Now reading</span>}
                  </span>
                  <h4 className={styles.epTitle}>{ep.frontmatter.title}</h4>
                </div>
              </Link>
            );
          })}
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════
          BOTTOM — Continuous recommendation feed
          (deep dives → insight cards → builder logs)
          ══════════════════════════════════════════════════════ */}
      <RecommendationFeed
        relatedSeries={relatedSeries}
        builderLogs={builderLogs}
        insightCards={insightCards}
      />
    </div>
  );
}
