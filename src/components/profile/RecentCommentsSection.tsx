import { getRecentCommentsForUser, type RecentComment, type RecentCommentsCursor } from "@/lib/comments";
import { getSeriesIndex } from "@/lib/content";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RecentCommentsList } from "./RecentCommentsList";
import styles from "./ProfileHomeSection.module.css";

export const RECENT_COMMENTS_PAGE_SIZE = 5;

/** A Recent Comment enriched with where it points — the series title
 *  (read fresh from the source MDX, same "don't trust the snapshot"
 *  choice BookmarksSection makes for episode titles/thumbnails) and the
 *  href built straight from contentId, since contentId already IS the
 *  route ("deep-dives/{series}" or "deep-dives/{series}/{episode}" — see
 *  the comments table's own contentId convention comment). */
export interface CommentActivityItem extends RecentComment {
  contentTitle: string;
  contentHref: string;
}

/** contentId is always "deep-dives/{series}" or "deep-dives/{series}/{episode}"
 *  — comments only exist on deep-dive episodes/hubs (see CommentSection's
 *  callers; builder-log and insight-card content don't have a comment
 *  surface today). */
function seriesSlugFromContentId(contentId: string): string | null {
  const parts = contentId.split("/");
  if (parts[0] !== "deep-dives" || !parts[1]) return null;
  return parts[1];
}

async function withContentTitle(
  item: RecentComment,
  titleCache: Map<string, string>
): Promise<CommentActivityItem> {
  const seriesSlug = seriesSlugFromContentId(item.contentId);
  let contentTitle = seriesSlug ?? item.contentId;

  if (seriesSlug) {
    const cached = titleCache.get(seriesSlug);
    if (cached) {
      contentTitle = cached;
    } else {
      try {
        const seriesData = await getSeriesIndex("deep-dives", seriesSlug);
        contentTitle = seriesData.frontmatter.title;
      } catch {
        // Series removed/renamed since the comment was posted — fall back
        // to the slug rather than breaking the row.
        contentTitle = seriesSlug;
      }
      titleCache.set(seriesSlug, contentTitle);
    }
  }

  return { ...item, contentTitle, contentHref: `/${item.contentId}` };
}

export interface RecentCommentsPageResult {
  items: CommentActivityItem[];
  nextCursor: RecentCommentsCursor | null;
  hasMore: boolean;
}

/** Recent Comments' live data, extracted from the section component (same
 *  split BookmarksSection uses) so the API route's "Load more" handler and
 *  this section's initial server render share one enrichment path. */
export async function getRecentCommentItems(
  userId: string,
  limit: number,
  cursor?: RecentCommentsCursor
): Promise<RecentCommentsPageResult> {
  const page = await getRecentCommentsForUser(userId, limit, cursor);
  const titleCache = new Map<string, string>();
  const items = await Promise.all(page.items.map((item) => withContentTitle(item, titleCache)));
  return { items, nextCursor: page.nextCursor, hasMore: page.hasMore };
}

export async function RecentCommentsSection({
  userId,
  initialPage,
}: {
  userId: string;
  initialPage?: RecentCommentsPageResult;
}) {
  const page = initialPage ?? (await getRecentCommentItems(userId, RECENT_COMMENTS_PAGE_SIZE));
  if (page.items.length === 0) return null;

  return (
    <section className={styles.section} id="comments">
      <SectionHeading label="Recent Comments" className={styles.sectionHeader} />
      <RecentCommentsList
        initialItems={page.items}
        initialHasMore={page.hasMore}
        initialCursor={page.nextCursor}
      />
    </section>
  );
}
