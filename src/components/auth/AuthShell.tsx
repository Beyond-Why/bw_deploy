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
          </Link>
          {contextLabel && <span className={styles.mobileContextLabel}>{contextLabel}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
