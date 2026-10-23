import { notFound } from "next/navigation";
import { getBuilderLog } from "@/lib/content";
import { renderBuilderLogOgImage, ogImageContentType, ogImageSize } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

export const alt = "Builder Log entry on Beyond Why";
export const size = ogImageSize;
export const contentType = ogImageContentType;

/** The log's own cover, stamped with "Day N" and the series title. */
export default async function Image({
  params,
}: {
  params: Promise<{ series: string; episode: string }>;
}) {
  const { series, episode } = await params;
  const log = await getBuilderLog(series);
  const entry = log?.logs.find((item) => item.slug === episode);
  if (!log || !entry || isPlaceholder(log.frontmatter)) notFound();
  return renderBuilderLogOgImage({
    cover: entry.thumbnail,
    stamp: `Day ${entry.day}`,
    seriesTitle: log.frontmatter.title,
    fallbackTitle: entry.title,
    fallbackKind: `Builder Log · Day ${entry.day}`,
  });
}
