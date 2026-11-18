import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { Button } from "@/components/ui/Button";
import type { OpenThreadData } from "@/lib/explore";
import styles from "./EdgeOfMap.module.css";

/** End of the home feed: open threads readers can vote on. The vote
 *  buttons are visual only until the polls step wires them up. */
export function EdgeOfMap({
  threads,
  heading = "You have seen everything here, for now.",
  text = "I would rather publish fewer trails and make each one worth walking. These questions came up along the way and nobody has explored them yet. Tell me which one you want next.",
}: {
  threads: OpenThreadData[];
  heading?: string;
  text?: string;
}) {
  return (
    <section id="edge" className={styles.edge} aria-labelledby="edge-title">
      <div>
        <span className={styles.kicker}>The edge of the map</span>
        <h2 id="edge-title" className={styles.heading}>
          {heading}
        </h2>
        <p className={styles.text}>{text}</p>
      </div>
      <ul className={styles.list}>
        {threads.map((t) => (
          <li key={t.key} className={styles.thread}>
            <Icon name="step-open" size={18} className={styles.icon} />
            <div>
              <p className={styles.q}>{t.text}</p>
              <p className={styles.from}>
                Opened by: <Link href={`/explore/${t.openedBy.slug}`}>{t.openedBy.title}</Link>
              </p>
            </div>
            <Button variant="line" className={styles.vote} aria-label={`I want this: ${t.text}`}>
              I want this
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
