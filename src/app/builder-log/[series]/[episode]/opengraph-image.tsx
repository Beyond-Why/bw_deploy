import { notFound } from "next/navigation";
import { getBuilderLog } from "@/lib/content";
import { ogImageMetadata, renderBuilderLogOgImage } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

type Params = Promise<{ series: string; episode: string }>;

async function load(params: Params) {
  const { series, episode } = await params;
  const log = await getBuilderLog(series);
  const entry = log?.logs.find((item) => item.slug === episode);
  if (!log || !entry || isPlaceholder(log.frontmatter)) notFound();
  return { log, entry };
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const { log, entry } = await load(params);
  return ogImageMetadata({
    title: entry.title,
    kind: `Builder Log day ${entry.day}`,
    context: log.frontmatter.title,
    thumbnailAlt: entry.thumbnailAlt,
  });
}

/** The log's own cover, stamped with "Day N" and the series title. */
export default async function Image({ params }: { params: Params }) {
  const { log, entry } = await load(params);
  return renderBuilderLogOgImage({
    cover: entry.thumbnail,
    stamp: `Day ${entry.day}`,
    seriesTitle: log.frontmatter.title,
    fallbackTitle: entry.title,
    fallbackKind: `Builder Log · Day ${entry.day}`,
  });
}
