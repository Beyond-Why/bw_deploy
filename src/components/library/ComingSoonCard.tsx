"use client";

import { useToast } from "@/hooks/useToast";
import styles from "./ComingSoonCard.module.css";

function BellIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

interface ComingSoonCardProps {
  title: string;
  description?: string;
  category?: string;
  eta?: string;
}

/** Portrait placeholder for an upcoming episode — used in place of a live
 *  episode row within a series hub's episode list. */
export function ComingSoonCard({ title, description, category, eta }: ComingSoonCardProps) {
  const toast = useToast();

  return (
    <div className={styles.row}>
      <div className={styles.labelCol} aria-hidden="true">
        <span className={styles.labelText}>Soon</span>
      </div>

      <div className={styles.infoCol}>
        {category && <span className={styles.category}>{category}</span>}
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.footer}>
          <span className={styles.pill}>Coming soon</span>
          {eta && <span className={styles.eta}>{eta}</span>}
          <button
            type="button"
            className={styles.notifyButton}
            onClick={() => toast.show({ message: "We'll let you know" })}
          >
            <BellIcon />
            Notify me
          </button>
        </div>
      </div>

      <div className={styles.thumbContainer} aria-hidden="true" />
    </div>
  );
}
