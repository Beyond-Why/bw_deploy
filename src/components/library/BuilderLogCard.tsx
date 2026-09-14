import type { SeriesFrontmatter, EpisodeInfo } from "@/lib/content";
import { SeriesCard, type SeriesCardLogEntry } from "./SeriesCard";

interface BuilderLogCardProps {
  slug: string;
  frontmatter: SeriesFrontmatter;
  href: string;
  episodes?: EpisodeInfo[];
}

/**
 * Thin adapter over the shared SeriesCard primitive (kind="builderlog") —
 * keeps the original prop shape so existing call sites (ContentFeed,
 * ExploreSidebar) don't need to change. All the actual card behavior
 * (geometry, thumbnail/motif, hover, the featured log + rail) lives in
 * SeriesCard; this just maps series/episode data onto its props. There is
 * only one variant — the card is always full width and responds to its
 * container the same way everywhere it renders, sidebar included.
 */
export function BuilderLogCard({
  slug,
  frontmatter,
  href,
  episodes = [],
}: BuilderLogCardProps) {
  // Newest first — this is a reverse-chronological feed, not a history
  // chart. Pass the FULL list; SeriesCard features the newest above the
  // rail and derives the rail's own "N earlier" count from what it
  // actually rendered.
  const sorted = [...episodes].sort((a, b) => b.episode - a.episode);
  const logs: SeriesCardLogEntry[] = sorted.map((ep) => ({
    slug: ep.slug,
    num: ep.episode,
    title: ep.frontmatter.title,
    date: ep.frontmatter.date
      ? new Date(ep.frontmatter.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : undefined,
    // Only the newest (first, since `sorted` is newest-first) log's
    // excerpt/thumbnail are ever read — SeriesCard features just that one.
    excerpt: ep.frontmatter.excerpt,
    thumbnail: ep.frontmatter.thumbnail,
  }));

  return (
    <SeriesCard
      kind="builderlog"
      slug={slug}
      href={href}
      title={frontmatter.title}
      description={frontmatter.description}
      thumbnail={frontmatter.thumbnail}
      category={frontmatter.category}
      status={frontmatter.status}
      logs={logs}
    />
  );
}
