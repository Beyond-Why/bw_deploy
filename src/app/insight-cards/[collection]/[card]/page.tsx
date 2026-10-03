import { notFound } from "next/navigation";
import { getCollection, getInsightCard } from "@/lib/content";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  isPlaceholder,
  isUnreleased,
  metaDescription,
  modifiedDate,
  pageMetadata,
  publishedDate,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ collection: string; card: string }>;
}

/** The card and its collection, or a 404 for an unknown slug either way. */
async function loadCard(collectionSlug: string, cardSlug: string) {
  let collection: Awaited<ReturnType<typeof getCollection>>;
  let card: Awaited<ReturnType<typeof getInsightCard>>;
  try {
    collection = await getCollection(collectionSlug);
  } catch {
    notFound();
  }
  // Only slugs the collection actually lists — never an arbitrary file path.
  if (!collection.cards.some((c) => c.slug === cardSlug)) notFound();
  try {
    card = await getInsightCard(collectionSlug, cardSlug);
  } catch {
    notFound();
  }
  if (isPlaceholder(card.frontmatter)) notFound();
  return { collection, card };
}

export async function generateMetadata({ params }: PageProps) {
  const { collection: collectionSlug, card: cardSlug } = await params;
  const { collection, card } = await loadCard(collectionSlug, cardSlug);
  const { frontmatter, content } = card;
  return pageMetadata({
    title: `${frontmatter.title} — ${collection.frontmatter.title}`,
    description: metaDescription(frontmatter, content),
    path: `/insight-cards/${collectionSlug}/${cardSlug}`,
    type: "article",
    publishedTime: publishedDate(frontmatter),
    modifiedTime: modifiedDate(frontmatter),
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : undefined,
    section: collection.frontmatter.title,
    noindex: isUnreleased(collection.frontmatter, frontmatter),
  });
}

// The panel itself renders in layout.tsx one level up (see there for why);
// this page contributes only the card's structured data.
export default async function InsightCardPage({ params }: PageProps) {
  const { collection: collectionSlug, card: cardSlug } = await params;
  const { collection, card } = await loadCard(collectionSlug, cardSlug);
  const { frontmatter, content } = card;
  const cardPath = `/insight-cards/${collectionSlug}/${cardSlug}`;
  const collectionPath = `/insight-cards/${collectionSlug}`;

  return (
    <JsonLd
      data={[
        articleJsonLd({
          headline: frontmatter.title,
          description: metaDescription(frontmatter, content),
          path: cardPath,
          images: [`${cardPath}/opengraph-image`, frontmatter.thumbnail],
          datePublished: publishedDate(frontmatter),
          dateModified: modifiedDate(frontmatter),
          keywords: Array.isArray(frontmatter.tags) ? frontmatter.tags : undefined,
          position: frontmatter.order,
          partOf: { name: collection.frontmatter.title, path: collectionPath },
        }),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: collection.frontmatter.title, path: collectionPath },
          { name: frontmatter.title, path: cardPath },
        ]),
      ]}
    />
  );
}
