import { notFound } from "next/navigation";
import { getBuilderLog } from "@/lib/content";
import { ogImageMetadata, renderBuilderLogOgImage } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

type Params = Promise<{ series: string }>;

async function load(params: Params) {
  const { series } = await params;
  const log = await getBuilderLog(series);
  if (!log || isPlaceholder(log.frontmatter)) notFound();
  return { log, newest: log.logs[log.logs.length - 1] };
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const { log, newest } = await load(params);
  return ogImageMetadata({
    title: log.frontmatter.title,
    kind: "Builder Log",
    context: log.frontmatter.category,
    thumbnailAlt: newest?.thumbnail ? newest.thumbnailAlt : log.frontmatter.thumbnailAlt,
  });
}

/** The newest log's cover, stamped with the series title. */
export default async function Image({ params }: { params: Params }) {
  const { log, newest } = await load(params);
  return renderBuilderLogOgImage({
    cover: newest?.thumbnail ?? log.frontmatter.thumbnail,
    stamp: "Builder Log",
    seriesTitle: log.frontmatter.title,
    fallbackTitle: log.frontmatter.title,
    fallbackKind: log.frontmatter.category ? `Builder Log · ${log.frontmatter.category}` : "Builder Log",
  });
}
