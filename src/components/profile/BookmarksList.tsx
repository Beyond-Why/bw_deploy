export interface BookmarkItem {
  id: string;
  contentId: string;
  contentType: string;
  contentTitle: string;
  contentUrl: string;
  seriesTitle: string | null;
  seriesSlug: string | null;
  episodeNumber: number | null;
  thumbnailUrl: string | null;
  /** Insight collections only — which card the user was on when saved. */
  activeCardIndex: number | null;
  /** Episodes/series only — the series' category/subject, e.g. "Foundation
   *  & Reality". Null for bookmarks saved before this field existed. */
  contentCategory: string | null;
  createdAt: string;
}
