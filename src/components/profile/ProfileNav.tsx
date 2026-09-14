"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileShell } from "./ProfileShell";
import styles from "./ProfileNav.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function ProfileNav({ username }: { username: string }) {
  const pathname = usePathname();
  const base = `/profile/${username}`;

  const tabs = [
    { href: base, label: "Home", exact: true },
    { href: `${base}/deep-dives`, label: "Deep Dives" },
    { href: `${base}/insight-cards`, label: "Insight Cards" },
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
