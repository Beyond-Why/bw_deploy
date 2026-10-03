import { notFound, permanentRedirect } from "next/navigation";
import { getCollection } from "@/lib/content";
import { isPlaceholder } from "@/lib/seo";

interface PageProps {
  params: Promise<{ collection: string }>;
}

// A collection has no page of its own — its URL is a permanent alias for
// its first card, so links and search results consolidate on the card.
export default async function InsightCollectionPage({ params }: PageProps) {
  const { collection } = await params;
  let cards: Awaited<ReturnType<typeof getCollection>>["cards"];
  try {
    ({ cards } = await getCollection(collection));
  } catch {
    notFound();
  }
  const first = cards.find((card) => !isPlaceholder(card.frontmatter));
  if (!first) notFound();
  permanentRedirect(`/insight-cards/${collection}/${first.slug}`);
}
