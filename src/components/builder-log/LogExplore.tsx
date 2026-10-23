import { getEpisodes, getSeriesIndex } from "@/lib/content";
import { isPlaceholder } from "@/lib/seo";
import { DeepDiveCard } from "@/components/library/DeepDiveCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./LogExplore.module.css";

/**
 * "Explore more" under a log: one home-page Deep Dive card per series in
 * the log's `explore` frontmatter. Series that don't exist (or aren't
 * released — placeholders and coming-soon ones) are skipped; with none
 * left there's no section at all.
 *
 *   explore: ["the-field-that-powers-the-world"]
 */
export default async function LogExplore({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;

  const series = (
    await Promise.all(
      [...new Set(slugs)].map(async (slug) => {
        const index = await getSeriesIndex("deep-dives", slug);
        if (!index || isPlaceholder(index.frontmatter) || index.frontmatter.comingSoon) return null;
        return { slug, frontmatter: index.frontmatter, episodes: await getEpisodes("deep-dives", slug) };
      })
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (series.length === 0) return null;

  return (
    <section className={styles.explore} aria-label="Explore more">
      <SectionHeading label="Explore more" className={styles.heading} />
      <div className={styles.cards}>
        {series.map((entry) => (
          <DeepDiveCard
            key={entry.slug}
            slug={entry.slug}
            frontmatter={entry.frontmatter}
            href={`/deep-dives/${entry.slug}`}
            episodes={entry.episodes}
          />
        ))}
      </div>
    </section>
  );
}
