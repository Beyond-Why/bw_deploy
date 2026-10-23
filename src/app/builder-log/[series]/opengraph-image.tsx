import { notFound } from "next/navigation";
import { getBuilderLog } from "@/lib/content";
import { renderBuilderLogOgImage, ogImageContentType, ogImageSize } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

export const alt = "Builder Log series on Beyond Why";
export const size = ogImageSize;
export const contentType = ogImageContentType;

/** The newest log's cover, stamped with the series title. */
export default async function Image({ params }: { params: Promise<{ series: string }> }) {
  const { series } = await params;
  const log = await getBuilderLog(series);
  if (!log || isPlaceholder(log.frontmatter)) notFound();
  const newest = log.logs[log.logs.length - 1];
  return renderBuilderLogOgImage({
    cover: newest?.thumbnail ?? log.frontmatter.thumbnail,
    stamp: "Builder Log",
    seriesTitle: log.frontmatter.title,
    fallbackTitle: log.frontmatter.title,
    fallbackKind: log.frontmatter.category ? `Builder Log · ${log.frontmatter.category}` : "Builder Log",
  });
}
