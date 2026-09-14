import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { ProfileHeader } from "../ProfileHeader";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { ProfileShell } from "@/components/profile/ProfileShell";
import styles from "./layout.module.css";

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

  return (
    <div>
      <ProfileShell>
        <ProfileHeader profile={profile} isOwner={isOwner} />
      </ProfileShell>
      <ProfileNav username={profile.username} />
      <ProfileShell>
        <div className={styles.content}>{children}</div>
      </ProfileShell>
    </div>
  );
}
