import { notFound } from "next/navigation";
import { getEpisode, getSeriesIndex } from "@/lib/content";
import { renderOgImage, ogImageContentType, ogImageSize } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

export const alt = "Builder Log entry on Beyond Why";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ series: string; episode: string }>;
}) {
  const { series, episode } = await params;
  const [episodeData, seriesData] = await Promise.all([
    getEpisode("builder-log", series, episode),
    getSeriesIndex("builder-log", series),
  ]);
  if (!episodeData || !seriesData) notFound();
  const { frontmatter } = episodeData;
  if (isPlaceholder(frontmatter)) notFound();
  return renderOgImage({
    kind: `Builder Log · Log ${String(frontmatter.episode).padStart(2, "0")}`,
    title: frontmatter.title,
    context: seriesData.frontmatter.title,
  });
}
