"use client";

import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import styles from "./SecondaryNavigation.module.css";

const VISIBLE_PATHS = ["/", "/deep-dives", "/insight-cards"];

export function SecondaryNavigation() {
  const pathname = usePathname();
  const modalSegment = useSelectedLayoutSegment("modal");

  // Check if we are on a discovery page
  const isDiscoveryPage = VISIBLE_PATHS.includes(pathname);

  // The modal is only truly "open" if the intercepting route is active.
  const isModalOpen = modalSegment === "(.)deep-dives";

  if (!isDiscoveryPage && !isModalOpen) {
    return null;
  }

  // To determine active state, if the modal is open over a discovery page, 
  // highlight "Deep Dives". Otherwise, use the actual pathname.
  const activePath = isModalOpen ? "/deep-dives" : pathname;

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.links}>
          <Link
            href="/deep-dives"
            className={`${styles.link} ${activePath === "/deep-dives" ? styles.active : ""
              }`}
          >
            Deep Dives
          </Link>
          <Link
            href="/insight-cards"
            className={`${styles.link} ${activePath === "/insight-cards" ? styles.active : ""
              }`}
          >
            Insight Cards
          </Link>
        </div>
      </div>
    </nav>
  );
}
