"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { getPersistedAuthTagline, DEFAULT_AUTH_TAGLINE } from "@/lib/auth/taglines";
import styles from "./AuthBrandPanel.module.css";

export function AuthBrandPanel({
  contextLabel,
  tagline,
}: {
  contextLabel?: string;
  tagline?: string;
}) {
  const [currentTagline, setCurrentTagline] = useState(tagline || DEFAULT_AUTH_TAGLINE);

  useEffect(() => {
    if (!tagline) {
      setCurrentTagline(getPersistedAuthTagline());
    }
  }, [tagline]);

  return (
    <div className={styles.panel}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <Link href="/" className={styles.brandHeader} aria-label="Beyond Why Home">
          <LogoMark className={styles.logoMark} />
          <span className={styles.wordmark}>Beyond Why</span>
        </Link>
        {contextLabel && <span className={styles.contextLabel}>{contextLabel}</span>}
        <p className={styles.tagline}>{currentTagline}</p>
      </div>
    </div>
  );
}
