/**
 * No `comments` table exists yet — this used to render hardcoded demo
 * rows, removed as part of the profile redesign. Per the Home tab's
 * skip-if-empty rule, that means this section always skips itself for
 * now. Once a real comments table and query exist, replace the `null`
 * below with the actual section
 * markup (label "COMMENTS", rows of "Commented on [Series Title]" +
 * excerpt + relative timestamp, same compact style as the other
 * sections). The Home page already renders <CommentsSection /> — once
 * this has real data, also add a comments-count fetch there so the
 * all-sections-empty check (currently just Continue Reading + Bookmarks)
 * accounts for it too.
 */
export function CommentsSection() {
  return null;
}
