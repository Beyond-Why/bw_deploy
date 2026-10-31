import { notFound } from "next/navigation";
import { getSeriesIndex } from "@/lib/content";
import { ogImageMetadata, renderOgImage } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

type Params = Promise<{ series: string }>;

async function load(params: Params) {
  const { series } = await params;
  const seriesData = await getSeriesIndex("deep-dives", series);
  if (!seriesData || isPlaceholder(seriesData.frontmatter)) notFound();
  return seriesData.frontmatter;
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const frontmatter = await load(params);
  return ogImageMetadata({
    title: frontmatter.title,
    kind: "Deep Dive series",
    context: frontmatter.category,
    thumbnailAlt: frontmatter.thumbnailAlt,
  });
}

export default async function Image({ params }: { params: Params }) {
  const frontmatter = await load(params);
  return renderOgImage({
    kind: "Deep Dive",
    title: frontmatter.title,
    context: frontmatter.category,
    thumbnail: frontmatter.thumbnail,
  });
}
