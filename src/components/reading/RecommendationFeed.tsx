import type { ReactNode } from "react";
import type { EpisodeInfo, SeriesFrontmatter, InsightCardFrontmatter } from "@/lib/content";
import { DeepDiveCard } from "@/components/library/DeepDiveCard";
import { InsightBarCard } from "@/components/library/InsightBarCard";
import { useMixedHeading } from "@/components/library/InsightRowHeadingProvider";
import { InsightCardIcon } from "@/components/icons";
import rowStyles from "@/components/library/InsightRow.module.css";
import styles from "./ExploreSidebar.module.css";

const INSIGHT_CARD_LIMIT = 4;

interface RecommendationFeedProps {
  relatedSeries: {
    slug: string;
    frontmatter: SeriesFrontmatter;
    episodes: EpisodeInfo[];
  }[];
  /** Server-rendered compact BuilderLogBanners (the banner's phone layout). */
  builderLogBanners: { slug: string; node: ReactNode }[];
  insightCards: { slug: string; frontmatter: InsightCardFrontmatter; collectionTitle: string }[];
}

/** The "more to explore" feed (deep dives → insight cards → builder logs) —
 *  shared between the episode reader's Explore sidebar and the hub page's
 *  Discussion section recommendations column. */
export function RecommendationFeed({
  relatedSeries,
  builderLogBanners,
  insightCards,
}: RecommendationFeedProps) {
  const insightHeading = useMixedHeading();
  const shownInsightCards = insightCards.slice(0, INSIGHT_CARD_LIMIT);

  return (
    <div className={styles.feedSection}>
      {relatedSeries.length > 0 && (
        <div className={styles.cardFeed}>
          {relatedSeries.map((s) => (
            <div key={s.slug} className={styles.cardItem}>
              <DeepDiveCard
                slug={s.slug}
                frontmatter={s.frontmatter}
                href={`/deep-dives/${s.slug}`}
                episodes={s.episodes}
                compact
              />
            </div>
          ))}
        </div>
      )}

      {shownInsightCards.length > 0 && (
        <div>
          <div className={rowStyles.headingRow}>
            <InsightCardIcon size={16} className={rowStyles.headingIcon} />
            <h2 className={rowStyles.headingText}>{insightHeading}</h2>
          </div>
          <div className={styles.cardFeed}>
            {shownInsightCards.map((card) => (
              <div key={card.slug} className={styles.cardItem}>
                <InsightBarCard
                  slug={card.slug}
                  frontmatter={card.frontmatter}
                  href={`/insight-cards/${card.slug}`}
                  numberLabel={card.collectionTitle}
                  numberAccent
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {builderLogBanners.length > 0 && (
        <div className={styles.cardFeed}>
          {builderLogBanners.map((banner) => (
            <div key={banner.slug} className={styles.cardItem}>
              {banner.node}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
