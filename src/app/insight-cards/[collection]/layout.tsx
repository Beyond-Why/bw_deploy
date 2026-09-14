import type { ReactNode } from "react";
import { getCollections, getInsightCard } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import { InsightCardsPanel } from "@/components/library";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getLikeState } from "@/lib/likes";
import { getBookmarkState } from "@/lib/bookmarks";
import styles from "./layout.module.css";

interface LayoutProps {
  params: Promise<{ collection: string }>;
  children: ReactNode;
}

/**
 * Renders the whole panel here rather than in [card]/page.tsx. Next.js
 * fully unmounts and rebuilds a route's page.tsx tree on every navigation
 * to a sibling leaf (card_2 -> card_3 is a "different page" to the
 * router), which would blow away InsightCardsPanel's state on every click
 * and make the stack-slide transition, the stable zone-3 shuffle, etc. all
 * impossible. A layout ABOVE the segment that's actually changing does
 * persist across that navigation — confirmed empirically, since a layout
 * colocated with the changing [card] segment does NOT persist (tested and
 * ruled out first). This only covers same-collection navigation (arrows,
 * zone 2): a zone-3 click still changes [collection] itself, so it remounts
 * this layout too and falls back to an instant swap — see InsightCardsPanel.
 */
export default async function InsightCollectionLayout({ params }: LayoutProps) {
  const { collection } = await params;
  const collections = await getCollections();
  const activeCollection = collections.find((c) => c.slug === collection);

  // Every card's MDX body for THIS collection only (1-4 cards, cheap) —
  // keyed by card slug. InsightCardsPanel derives which one is active from
  // the URL client-side, since this layout doesn't receive the [card] param.
  const cardContent: Record<string, ReactNode> = {};
  if (activeCollection) {
    for (const card of activeCollection.cards) {
      const { content } = await getInsightCard(collection, card.slug);
      cardContent[card.slug] = (
        <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
      );
    }
  }

  const headingShuffleSeed = Math.floor(Math.random() * 2 ** 31);

  // Likes + bookmarks are per COLLECTION (not per card) — see
  // InsightReaderBlock. Fetched once here since this layout only re-renders
  // when the collection itself changes, not on card-to-card navigation.
  const user = await getCurrentUser();
  const isAuthenticated = !!user;
  const { count: initialLikeCount, liked: initialLiked } = await getLikeState(
    user?.id ?? null,
    collection,
    "insight-collection"
  );
  const { count: initialBookmarkCount, bookmarked: initialBookmarked } = await getBookmarkState(
    user?.id ?? null,
    collection,
    "insight-collection"
  );

  return (
    <div className={styles.page}>
      <InsightCardsPanel
        collections={collections}
        activeCollectionSlug={collection}
        cardContent={cardContent}
        headingShuffleSeed={headingShuffleSeed}
        isAuthenticated={isAuthenticated}
        initialLikeCount={initialLikeCount}
        initialLiked={initialLiked}
        initialBookmarkCount={initialBookmarkCount}
        initialBookmarked={initialBookmarked}
      />
    </div>
  );
}
