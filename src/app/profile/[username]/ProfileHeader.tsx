import Link from "next/link";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import styles from "./ProfileHeader.module.css";

type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
};

export function ProfileHeader({
  profile,
  isOwner,
}: {
  profile: Profile;
  isOwner: boolean;
}) {
  const label = profile.displayName || profile.username;
  const joinDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(profile.createdAt);

  return (
    <div className={styles.header}>
      <div className={styles.topRow}>
        <AvatarUpload userId={profile.id} label={label} avatarUrl={profile.avatarUrl} isOwner={isOwner} />

        <div className={styles.identity}>
          <h1 className={styles.displayName}>{label}</h1>
          <span className={styles.meta}>
            @{profile.username}
            <span className={styles.dot}> · </span>
            Member since {joinDate}
          </span>
        </div>

        {isOwner && (
          <div className={styles.actions}>
            <Link href={`/profile/${profile.username}/edit`} className={styles.actionButton}>
              Edit profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
