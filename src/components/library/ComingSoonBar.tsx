"use client";

import { useToast } from "@/hooks/useToast";
import styles from "./ComingSoonBar.module.css";

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.clockIcon} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface ComingSoonBarProps {
  title: string;
  description?: string;
  category?: string;
  eta?: string;
}

/** Horizontal placeholder for an upcoming series — used in the library and
 *  homepage shelves in place of a live DeepDiveCard/SeriesCard. */
export function ComingSoonBar({ title, description, category, eta }: ComingSoonBarProps) {
  const toast = useToast();

  return (
    <div className={styles.card}>
      <div className={styles.thumbnail} aria-hidden="true">
        <span className={styles.pill}>
          <ClockIcon />
          Coming soon
        </span>
      </div>

      <div className={styles.body}>
        {category && <span className={styles.category}>{category}</span>}
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.notifyButton}
            onClick={() => toast.show({ message: "We'll let you know" })}
          >
            <BellIcon />
            Notify me
          </button>
          {eta && <span className={styles.eta}>{eta}</span>}
        </div>
      </div>
    </div>
  );
}
