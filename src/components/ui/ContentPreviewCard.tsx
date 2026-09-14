import Link from "next/link";
import { DeepDiveIcon } from "@/components/icons/DeepDiveIcon";
import { InsightCardIcon } from "@/components/icons/InsightCardIcon";
import { BuilderLogIcon } from "@/components/icons/BuilderLogIcon";
import styles from "./ContentPreviewCard.module.css";

export type ProfileContentType = "deep-dive" | "insight-card" | "builder-log";

export interface ProfileContentPreview {
  type: ProfileContentType;
  title: string;
  href: string;
  thumbnail?: string;
  /** 0–100. Only set for "continue reading" items. */
  progressPercent?: number;
  /** Short meta line, e.g. "Episode 2 of 3". */
  meta: string;
}

const TYPE_LABEL: Record<ProfileContentPreview["type"], string> = {
  "deep-dive": "Deep Dive",
  "insight-card": "Insight Card",
  "builder-log": "Builder Log",
};

const TYPE_ICON: Record<ProfileContentPreview["type"], typeof DeepDiveIcon> = {
  "deep-dive": DeepDiveIcon,
  "insight-card": InsightCardIcon,
  "builder-log": BuilderLogIcon,
};

interface ContentPreviewCardProps {
  item: ProfileContentPreview;
}

/** Shared portrait content-preview card — the profile Home tab's Continue
 *  Reading row and the hub page's Keep Exploring grid both use this one
 *  component, not separate ad-hoc cards. (Recently Saved's grid uses its
 *  own BookmarkEpisodeCard instead — see ContentPreviewGrid.module.css
 *  for why that one wasn't reused here too.) */
export function ContentPreviewCard({ item }: ContentPreviewCardProps) {
  const Icon = TYPE_ICON[item.type];

  return (
    <Link href={item.href} className={styles.card}>
      <div className={styles.thumbWrapper}>
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className={styles.thumbImage} />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden="true">
            <Icon size={28} />
          </div>
        )}
        <span className={styles.typeBadge}>
          <Icon size={12} />
          {TYPE_LABEL[item.type]}
        </span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <span className={styles.meta}>{item.meta}</span>
      </div>
      {typeof item.progressPercent === "number" && (
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${item.progressPercent}%` }} />
        </div>
      )}
    </Link>
  );
}
