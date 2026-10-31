import { notFound } from "next/navigation";
import { getCollection } from "@/lib/content";
import { ogImageMetadata, renderOgImage } from "@/lib/og";
import { isPlaceholder } from "@/lib/seo";

type Params = Promise<{ collection: string; card: string }>;

async function load(params: Params) {
  const { collection, card } = await params;
  const collectionData = await getCollection(collection);
  const entry = collectionData?.cards.find((c) => c.slug === card);
  if (!collectionData || !entry || isPlaceholder(entry.frontmatter)) notFound();
  return { frontmatter: entry.frontmatter, collectionTitle: collectionData.frontmatter.title };
}

export async function generateImageMetadata({ params }: { params: Params }) {
  const { frontmatter, collectionTitle } = await load(params);
  return ogImageMetadata({ title: frontmatter.title, kind: "Insight Card", context: collectionTitle });
}

export default async function Image({ params }: { params: Params }) {
  const { frontmatter, collectionTitle } = await load(params);
  return renderOgImage({
    kind: "Insight Card",
    title: frontmatter.title,
    context: collectionTitle,
    thumbnail: frontmatter.thumbnail,
  });
}
