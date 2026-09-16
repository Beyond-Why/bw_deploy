import Link from "next/link";
import { AuthBrandPanel } from "./AuthBrandPanel";
import { LogoMark } from "@/components/Logo";
import "./auth.css";
import styles from "./AuthShell.module.css";

export function AuthShell({
  children,
  contextLabel,
  tagline = "Think deeper. Read better.",
}: {
  children: React.ReactNode;
  contextLabel?: string;
  tagline?: string;
}) {
  return (
    <div className={`authFullPage ${styles.shell}`}>
      <AuthBrandPanel contextLabel={contextLabel} tagline={tagline} />
      <div className={styles.formPanel}>
        <div className={styles.mobileHeader}>
          <Link href="/" className={styles.mobileLogoLink} aria-label="Beyond Why Home">
            <LogoMark className={styles.mobileLogoMark} />
            <span className={styles.mobileWordmark}>Beyond Why</span>
          </Link>
        </div>
        {children}
        <div className={styles.authLegalRow}>
          <Link href="/terms" className={styles.authLegalLink}>
            Terms
          </Link>
          <span className={styles.authLegalDot}>·</span>
          <Link href="/privacy" className={styles.authLegalLink}>
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
