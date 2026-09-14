import { isNew } from "@/lib/publishing";
import styles from "./NewTag.module.css";

interface NewTagProps {
  publishedAt?: string;
  /** Fallback when `publishedAt` isn't set on older content. */
  date?: string;
}

/** Small green "New" pill — shows for 7 days after publishedAt (or date).
 *  Never rendered inside the reader itself, only on shelf/library cards. */
export function NewTag({ publishedAt, date }: NewTagProps) {
  if (!isNew(publishedAt, date)) return null;

  return (
    <span className={styles.tag}>
      <span className={styles.dot} aria-hidden="true" />
      New
    </span>
  );
}
