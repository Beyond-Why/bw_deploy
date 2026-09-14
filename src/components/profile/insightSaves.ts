import { getCollection } from "@/lib/content";
import type { InsightRowCardItem } from "@/components/library";
import type { RecentInsightSave } from "./InsightSaveStack";
import type { BookmarkItem } from "./BookmarksList";

/** Insight-collection bookmarks need their full collection (every card,
 *  not just the snapshot) to render as a real, navigable bar carousel —
 *  contentId is the collection slug (see InsightReaderBlock, which
 *  bookmarks by `collection.slug`). Content since removed from disk is
 *  skipped rather than crashing the page. Server-only (reads from disk) —
 *  used by the profile Home tab and the Insight Cards tab. */
export async function buildInsightSave(bookmark: BookmarkItem): Promise<RecentInsightSave | null> {
  try {
    const collection = await getCollection(bookmark.contentId);
    const cards: InsightRowCardItem[] = collection.cards.map((card) => ({
      slug: `${collection.slug}/${card.slug}`,
      href: `/insight-cards/${collection.slug}/${card.slug}`,
      frontmatter: card.frontmatter,
      motif: collection.frontmatter.motif,
    }));
    return { bookmark, title: collection.frontmatter.title, cards };
  } catch {
    return null;
  }
}

export async function buildInsightSaves(bookmarks: BookmarkItem[]): Promise<RecentInsightSave[]> {
  const saves = await Promise.all(bookmarks.map(buildInsightSave));
  return saves.filter((save): save is RecentInsightSave => save !== null);
}
