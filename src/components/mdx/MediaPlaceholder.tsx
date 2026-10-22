import styles from "./MediaPlaceholder.module.css";

/**
 * Stand-in for a photo or video whose file doesn't exist yet — a quiet
 * 16:9 box showing the alt text, never a broken image.
 *
 *   {exists ? <Image … /> : <MediaPlaceholder label={alt} />}
 */
export default function MediaPlaceholder({ label }: { label?: string }) {
  return (
    <div className={styles.placeholder} role="img" aria-label={label || "Media not available yet"}>
      <span className={styles.label} aria-hidden="true">
        {label || "Media not available yet"}
      </span>
    </div>
  );
}
