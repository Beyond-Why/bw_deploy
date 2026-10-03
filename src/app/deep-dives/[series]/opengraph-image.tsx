import { notFound } from "next/navigation";
import { getSeriesIndex } from "@/lib/content";
import { renderOgImage, ogImageContentType, ogImageSize } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

export const alt = "Deep Dive series on Beyond Why";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({ params }: { params: Promise<{ series: string }> }) {
  const { series } = await params;
  let frontmatter: Awaited<ReturnType<typeof getSeriesIndex>>["frontmatter"];
  try {
    ({ frontmatter } = await getSeriesIndex("deep-dives", series));
  } catch {
    notFound();
  }
  if (isPlaceholder(frontmatter)) notFound();
  return renderOgImage({
    kind: "Deep Dive",
    title: frontmatter.title,
    context: frontmatter.category,
  });
}
