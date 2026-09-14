import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={`noNavPage ${styles.page}`}>
      <Link href="/" className={styles.wordmark}>
        Beyond Why
      </Link>

      <div className={styles.content}>
        <span className={styles.digits} aria-hidden="true">
          404
        </span>
        <h1 className={styles.headline}>Nothing here.</h1>
        <p className={styles.subtext}>
          The page you&apos;re looking for has moved, or never existed.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.button}>
            Go Home
          </Link>
          <Link href="/deep-dives" className={styles.button}>
            Browse Deep Dives
          </Link>
        </div>
      </div>
    </div>
  );
}
