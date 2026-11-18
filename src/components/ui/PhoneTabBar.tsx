"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";
import styles from "./PhoneTabBar.module.css";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "nav-home" },
  { href: "/explore", label: "Explore", icon: "nav-explore" },
  { href: "/builds", label: "Builds", icon: "build" },
  { href: "/bookmarks", label: "Saved", icon: "act-save" },
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Floating capsule tab bar, below 768px only. `demo` renders it in place
 *  and at every width (the UI kit), instead of fixed to the screen. */
export function PhoneTabBar({ demo = false, current }: { demo?: boolean; current?: string }) {
  const pathname = usePathname() ?? "/";
  const active = current ?? pathname;
  return (
    <nav className={demo ? `${styles.bar} ${styles.demo}` : styles.bar} aria-label={demo ? "Main (example)" : "Main"}>
      {TABS.map((t) => {
        const on = isCurrent(active, t.href);
        return (
          <Link key={t.href} href={t.href} className={styles.tab} aria-current={on ? "page" : undefined}>
            <Icon name={t.icon} size={20} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
