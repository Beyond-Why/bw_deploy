import type { InsightCardFrontmatter } from "@/lib/content";
import type { MotifType } from "@/lib/cardMotif";
import { SeriesCard } from "./SeriesCard";

interface InsightBarCardProps {
  slug: string;
  frontmatter: InsightCardFrontmatter;
  href: string;
  /** "01" in collection contexts; the parent collection's name in the mixed context. Omitted where there's no position to show (e.g. the Explore sidebar). */
  numberLabel?: string;
  /** Mixed context shows the collection name as a small solid tag instead of the stroke position number. */
  numberAccent?: boolean;
  motif?: MotifType;
  scroll?: boolean;
}

/**
 * Thin adapter over the shared SeriesCard primitive (kind="insight") —
 * keeps the original prop shape so existing call sites (InsightRow,
 * InsightCollectionBlock, ExploreSidebar) don't need to change. Always the
 * bar variant — it's a narrow stacked bar in a narrow container (Explore
 * sidebar, mobile) and a wide one in a wide container, same component
 * responding to its own width, not a separate square rendering.
 */
export function InsightBarCard({
  slug,
  frontmatter,
  href,
  numberLabel,
  numberAccent,
  motif,
  scroll,
}: InsightBarCardProps) {
  return (
    <SeriesCard
      kind="insight"
      slug={slug}
      href={href}
      title={frontmatter.title}
      description={frontmatter.description}
      thumbnail={frontmatter.thumbnail}
      motif={motif}
      scroll={scroll}
      numberLabel={numberLabel}
      numberAccent={numberAccent}
      publishedAt={frontmatter.publishedAt}
      date={frontmatter.date}
    />
  );
}
