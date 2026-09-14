import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";

/**
 * The real Bookmarks UI now lives on the profile Home tab
 * (/profile/[username]#bookmarks) rather than as a separate page — this
 * route exists only so old /bookmarks links (e.g. the header menu
 * before this redesign) keep working, by forwarding to it.
 */
export default async function BookmarksRedirectPage() {
  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;

  if (profile) {
    redirect(`/profile/${profile.username}#bookmarks`);
  }

  redirect("/signin?next=%2Fbookmarks");
}
