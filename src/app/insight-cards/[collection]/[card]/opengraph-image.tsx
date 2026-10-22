import { notFound } from "next/navigation";
import { getCollection } from "@/lib/content";
import { renderOgImage, ogImageContentType, ogImageSize } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

export const alt = "Insight Card on Beyond Why";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ collection: string; card: string }>;
}) {
  const { collection, card } = await params;
  const collectionData = await getCollection(collection);
  if (!collectionData) notFound();
  const entry = collectionData.cards.find((c) => c.slug === card);
  if (!entry || isPlaceholder(entry.frontmatter)) notFound();
  return renderOgImage({
    kind: "Insight Card",
    title: entry.frontmatter.title,
    context: collectionData.frontmatter.title,
  });
}
