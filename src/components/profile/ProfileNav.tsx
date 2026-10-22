"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileShell } from "./ProfileShell";
import styles from "./ProfileNav.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function ProfileNav({
  username,
  showInsightCards,
  showBuilderLogs,
}: {
  username: string;
  /** False while no Insight Card content exists — the tab is hidden, not empty. */
  showInsightCards: boolean;
  /** False while no Builder Log exists — same rule. */
  showBuilderLogs: boolean;
}) {
  const pathname = usePathname();
  const base = `/profile/${username}`;

  const tabs = [
    { href: base, label: "Home", exact: true },
    { href: `${base}/deep-dives`, label: "Deep Dives" },
    ...(showInsightCards ? [{ href: `${base}/insight-cards`, label: "Insight Cards" }] : []),
    ...(showBuilderLogs ? [{ href: `${base}/builder-logs`, label: "Builder Logs" }] : []),
  ];

  return (
    <nav className={styles.nav}>
      <ProfileShell>
        <div className={styles.links}>
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cx(styles.link, active && styles.active)}
                aria-current={active ? "page" : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </ProfileShell>
    </nav>
  );
}
