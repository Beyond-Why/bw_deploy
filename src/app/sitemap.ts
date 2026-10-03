import type { MetadataRoute } from "next";
import { getAllSeries, getCollections, getEpisodes } from "@/lib/content";
import { absoluteUrl, isUnreleased, modifiedDate } from "@/lib/seo";

// Rebuilt hourly so content with a future publishedAt appears once it's live.
export const revalidate = 3600;

/**
 * Homepage, every released series hub, episode and insight card. Bare
 * collection URLs (they redirect to the first card) and the rewritten
 * /deep-dives, /insight-cards and /builder-log aliases of the homepage
 * are deliberately absent. Unreleased (comingSoon / future publishedAt)
 * and zero-byte placeholder entries are skipped — see isUnreleased().
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [{ url: absoluteUrl("/") }];

  for (const type of ["deep-dives", "builder-log"] as const) {
    for (const series of await getAllSeries(type)) {
      if (isUnreleased(series.frontmatter)) continue;
      const episodes = (await getEpisodes(type, series.slug)).filter(
        (ep) => !isUnreleased(series.frontmatter, ep.frontmatter)
      );
      const episodeDates = episodes
        .map((ep) => modifiedDate(ep.frontmatter))
        .filter((date): date is Date => !!date);
      const seriesDates = [modifiedDate(series.frontmatter), ...episodeDates].filter(
        (date): date is Date => !!date
      );

      entries.push({
        url: absoluteUrl(`/${type}/${series.slug}`),
        // A hub changes whenever an episode is added to it.
        lastModified: seriesDates.length
          ? new Date(Math.max(...seriesDates.map((d) => d.getTime())))
          : undefined,
      });
      for (const ep of episodes) {
        entries.push({
          url: absoluteUrl(`/${type}/${series.slug}/${ep.slug}`),
          lastModified: modifiedDate(ep.frontmatter),
        });
      }
    }
  }

  for (const collection of await getCollections()) {
    for (const card of collection.cards) {
      if (isUnreleased(collection.frontmatter, card.frontmatter)) continue;
      entries.push({
        url: absoluteUrl(`/insight-cards/${collection.slug}/${card.slug}`),
        lastModified: modifiedDate(card.frontmatter),
      });
    }
  }

  return entries;
}
