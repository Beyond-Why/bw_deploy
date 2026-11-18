import { Icon } from "@/components/icons/Icon";
import type { TrailSummary } from "@/lib/explore";
import styles from "./TrailCounts.module.css";

type Count = "sources" | "deadEnds" | "experiments" | "openThreads";

interface TrailCountsProps {
  summary: Pick<TrailSummary, Count>;
  /** "card": numbers with screen-reader-only words (under card titles).
   *  "header": the words are visible ("9 sources"), for the exploration page header. */
  variant?: "card" | "header";
  /** Restrict to some counts (e.g. a chip that only shows experiments).
   *  Default: sources and open threads always, dead ends and experiments when > 0. */
  only?: Count[];
  size?: "md" | "sm";
  className?: string;
}

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many);

/** Trail marks, option A: one line of icon counts under a card title. */
export function TrailCounts({ summary, variant = "card", only, size = "md", className }: TrailCountsProps) {
  const show = (key: Count, n: number) =>
    only ? only.includes(key) : key === "sources" || key === "openThreads" || n > 0;
  const visible = variant === "header";
  const iconSize = size === "sm" ? 12 : 14;

  const items: { key: Count; icon: Parameters<typeof Icon>[0]["name"]; n: number; word: string }[] = [
    { key: "sources", icon: "step-source", n: summary.sources, word: plural(summary.sources, "source") },
    { key: "deadEnds", icon: "step-dead-end", n: summary.deadEnds, word: plural(summary.deadEnds, "dead end") },
    { key: "experiments", icon: "step-experiment", n: summary.experiments, word: plural(summary.experiments, "experiment") },
  ];

  return (
    <span className={[styles.counts, size === "sm" && styles.sm, className].filter(Boolean).join(" ")}>
      {items.map(({ key, icon, n, word }) =>
        show(key, n) ? (
          <span key={key} className={styles.item}>
            <Icon name={icon} size={iconSize} className={styles.icon} />
            {n}
            {visible ? ` ${word}` : <span className="visually-hidden"> {word}</span>}
          </span>
        ) : null,
      )}
      {show("openThreads", summary.openThreads) && (
        <span className={`${styles.item} ${styles.open}`}>
          <Icon name="step-open" size={iconSize} className={styles.icon} />
          {summary.openThreads}{" "}
          {visible ? plural(summary.openThreads, "open thread") : (
            <>
              open<span className="visually-hidden"> {plural(summary.openThreads, "thread")}</span>
            </>
          )}
        </span>
      )}
    </span>
  );
}
