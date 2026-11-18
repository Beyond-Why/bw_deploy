import Link from "next/link";
import { typeLabel, type SourceCardData } from "@/lib/explore";
import styles from "./SourceCard.module.css";

/** "Sources worth your time". Only for resources used in 2 or more trails;
 *  returns null otherwise so callers can pass every resource. */
export function SourceCard({ data }: { data: SourceCardData }) {
  if (data.usedIn < 2) return null;
  return (
    <Link href={`/resources/${data.id}`} className={styles.card}>
      <span className={styles.tag}>{typeLabel(data.type)}</span>
      <span className={styles.title}>{data.title}</span>
      <span className={styles.uses}>Used in {data.usedIn} trails</span>
    </Link>
  );
}

/** 4 across on desktop, 2 under 1000px, a side-scrolling row on phones. */
export function SourceRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
