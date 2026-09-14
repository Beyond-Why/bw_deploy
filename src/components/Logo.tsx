import Link from "next/link";
import styles from "./Logo.module.css";

export function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Beyond Why">
      <svg
        className={styles.mark}
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="32"
          cy="32"
          r="25"
          fill="none"
          stroke="#F1E8DC"
          strokeWidth="4.5"
          strokeDasharray="122 35"
          strokeLinecap="round"
          transform="rotate(-62 32 32)"
        />
        <circle
          cx="32"
          cy="32"
          r="14.5"
          fill="none"
          stroke="#F1E8DC"
          strokeWidth="4.5"
          strokeDasharray="63 28"
          strokeLinecap="round"
          transform="rotate(118 32 32)"
        />
        <circle cx="32" cy="32" r="5.2" className={styles.accent} />
      </svg>
      <span className={styles.wordmark}>Beyond Why</span>
    </Link>
  );
}
