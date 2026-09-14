import { InsightBarCard } from "./InsightBarCard";
import { InsightCardIcon } from "@/components/icons";
import { useMixedHeading } from "./InsightRowHeadingProvider";
import type { InsightCardFrontmatter } from "@/lib/content";
import type { MotifType } from "@/lib/cardMotif";
import styles from "./InsightRow.module.css";

export interface InsightRowCardItem {
  slug: string;
  href: string;
  frontmatter: InsightCardFrontmatter;
  /** The parent collection's name — shown as the bar's number label here. */
  collectionTitle?: string;
  /** The card's parent collection's generative fallback pattern. */
  motif?: MotifType;
}

interface InsightRowProps {
  cards: InsightRowCardItem[];
}

/** A themed shelf of cards drawn from multiple collections — a static bar grid, no carousel. */
export function InsightRow({ cards }: InsightRowProps) {
  const heading = useMixedHeading();

  if (cards.length === 0) return null;

  return (
    <section className={styles.row}>
      <div className={styles.headingRow}>
        <InsightCardIcon size={16} className={styles.headingIcon} />
        <h2 className={styles.headingText}>{heading}</h2>
      </div>

      <div className={styles.bars}>
        {cards.map((card) => (
          <InsightBarCard
            key={card.slug}
            slug={card.slug}
            frontmatter={card.frontmatter}
            href={card.href}
            numberLabel={card.collectionTitle ?? ""}
            numberAccent
            motif={card.motif}
          />
        ))}
      </div>
    </section>
  );
}
