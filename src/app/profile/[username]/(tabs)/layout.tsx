import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { ProfileHeader } from "../ProfileHeader";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { ProfileShell } from "@/components/profile/ProfileShell";
import { NOINDEX } from "@/lib/seo";
import { getAllSeries, getCollections } from "@/lib/content";
import styles from "./layout.module.css";

export const metadata: Metadata = { robots: NOINDEX };

export default async function ProfileTabsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === profile.id;
  const [collections, builderLogs] = await Promise.all([getCollections(), getAllSeries("builder-log")]);
  const hasInsightCards = collections.length > 0;
  const hasBuilderLogs = builderLogs.length > 0;

  return (
    <div>
      <ProfileShell>
        <ProfileHeader profile={profile} isOwner={isOwner} />
      </ProfileShell>
      <ProfileNav
        username={profile.username}
        showInsightCards={hasInsightCards}
        showBuilderLogs={hasBuilderLogs}
      />
      <ProfileShell>
        <div className={styles.content}>{children}</div>
      </ProfileShell>
    </div>
  );
}
