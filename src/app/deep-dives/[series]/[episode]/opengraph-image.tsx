import { notFound } from "next/navigation";
import { getEpisode, getSeriesIndex } from "@/lib/content";
import { ogImageMetadata, renderOgImage } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

type Params = Promise<{ series: string; episode: string }>;

async function load(params: Params) {
  const { series, episode } = await params;
  const [episodeData, seriesData] = await Promise.all([
    getEpisode("deep-dives", series, episode),
    getSeriesIndex("deep-dives", series),
  ]);
  if (!episodeData || !seriesData || isPlaceholder(episodeData.frontmatter)) notFound();
  return { frontmatter: episodeData.frontmatter, seriesTitle: seriesData.frontmatter.title };
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const { frontmatter, seriesTitle } = await load(params);
  return ogImageMetadata({
    title: frontmatter.title,
    kind: `Deep Dive episode ${frontmatter.episode}`,
    context: seriesTitle,
    thumbnailAlt: frontmatter.thumbnailAlt,
  });
}

export default async function Image({ params }: { params: Params }) {
  const { frontmatter, seriesTitle } = await load(params);
  return renderOgImage({
    kind: `Deep Dive · Episode ${String(frontmatter.episode).padStart(2, "0")}`,
    title: frontmatter.title,
    context: seriesTitle,
    thumbnail: frontmatter.thumbnail,
  });
}
