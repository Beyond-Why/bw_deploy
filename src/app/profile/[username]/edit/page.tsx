import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getUserBookmarks } from "@/lib/bookmarks";
import { createClient } from "@/lib/supabase/server";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { EditProfileClient } from "./EditProfileClient";

export const metadata: Metadata = {
  title: "Edit profile — Beyond Why",
};

export default async function ProfileEditPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) notFound();

  const user = await getCurrentUser();
  if (!user || user.id !== profile.id) {
    redirect(`/profile/${profile.username}`);
  }

  const signInMethod = user.app_metadata?.provider === "google" ? "Google" : "Email magic link";

  // True when every linked identity is a non-email provider (i.e. Google
  // OAuth only) — that account has no password to update, so the
  // Password section shows a notice instead of the form.
  const identityProviders = user.identities?.map((identity) => identity.provider) ?? [];
  const isGoogleOnly =
    identityProviders.length > 0 && identityProviders.every((provider) => provider !== "email");

  // True once a Google-only user has actually set a password. NOT the
  // same as an "email" identity on the user — Supabase does not
  // reliably add one when updateUser({ password }) sets a password for
  // an OAuth-only user, so that signal can't be trusted. This instead
  // calls a SECURITY DEFINER RPC (see
  // drizzle/0013_current_user_has_password_rpc.sql) that checks
  // auth.users.encrypted_password server-side and returns only a
  // boolean — the hash itself never reaches app code.
  const supabase = await createClient();
  const { data: hasPasswordData } = await supabase.rpc("current_user_has_password");
  const hasPassword = hasPasswordData ?? false;

  // Live-preview stat pills — counts of the user's own saved deep dives vs.
  // saved insight collections, both drawn from their existing bookmarks.
  const bookmarks = await getUserBookmarks(profile.id);
  const deepDivesCount = bookmarks.filter(
    (b) => b.contentType === "episode" || b.contentType === "series"
  ).length;
  const collectionsCount = bookmarks.filter((b) => b.contentType === "insight-collection").length;

  return (
    <ProfileShell>
      <EditProfileClient
        profile={{
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          bio: profile.bio,
        }}
        email={user.email ?? ""}
        signInMethod={signInMethod}
        isGoogleOnly={isGoogleOnly}
        hasPassword={hasPassword}
        deepDivesCount={deepDivesCount}
        collectionsCount={collectionsCount}
      />
    </ProfileShell>
  );
}
