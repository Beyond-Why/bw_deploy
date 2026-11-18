"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import styles from "./TopicFilter.module.css";
import { HAS_EXPERIMENT, toTopicParam, type TopicValue } from "./topics";

export type { TopicValue } from "./topics";

interface TopicState {
  value: TopicValue;
  topics: string[];
  select: (value: TopicValue) => void;
}

const TopicContext = createContext<TopicState | null>(null);

/** Holds the selected topic for TopicPills, TopicPicker and TopicScope below it,
 *  and mirrors it to ?topic= without a navigation. */
export function TopicFilterProvider({
  topics,
  initial = "all",
  children,
}: {
  topics: string[];
  initial?: TopicValue;
  children: React.ReactNode;
}) {
  const [value, setValue] = useState<TopicValue>(initial);

  const select = useCallback((next: TopicValue) => {
    setValue(next);
    const url = new URL(window.location.href);
    const param = toTopicParam(next);
    if (param) url.searchParams.set("topic", param);
    else url.searchParams.delete("topic");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return <TopicContext.Provider value={{ value, topics, select }}>{children}</TopicContext.Provider>;
}

function useTopics(): TopicState {
  const ctx = useContext(TopicContext);
  if (!ctx) throw new Error("Topic filter components must sit inside <TopicFilterProvider>.");
  return ctx;
}

/** The row of hairline topic pills. Sticks under the nav unless `sticky` is false. */
export function TopicPills({ sticky = true }: { sticky?: boolean }) {
  const { value, topics, select } = useTopics();
  const options: { value: TopicValue; label: string }[] = [
    { value: "all", label: "All" },
    ...topics.map((t) => ({ value: t, label: t })),
    { value: HAS_EXPERIMENT, label: "Has an experiment" },
  ];
  return (
    <div className={sticky ? `${styles.bar} ${styles.sticky}` : styles.bar}>
      <div className={styles.pills} role="group" aria-label="Filter by topic">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={styles.pill}
            aria-pressed={value === o.value}
            onClick={() => select(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Shows its children only when they match the selected topic. */
export function TopicScope({
  topic,
  hasExperiment = false,
  children,
}: {
  topic: string;
  hasExperiment?: boolean;
  children: React.ReactNode;
}) {
  const { value } = useTopics();
  const visible = value === "all" || (value === HAS_EXPERIMENT ? hasExperiment : value === topic);
  return visible ? <>{children}</> : null;
}

/** The nav's pill-shaped "All topics ▾" picker. Same state as TopicPills. */
export function TopicPicker() {
  const { value, topics, select } = useTopics();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = value === "all" ? "All topics" : value === HAS_EXPERIMENT ? "Has an experiment" : value;
  const options: { value: TopicValue; label: string }[] = [
    { value: "all", label: "All topics" },
    ...topics.map((t) => ({ value: t, label: t })),
    { value: HAS_EXPERIMENT, label: "Has an experiment" },
  ];

  return (
    <div className={styles.picker} ref={root}>
      <button
        type="button"
        className={styles.pickerButton}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Topics: ${label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span className={styles.divider} aria-hidden="true" />
        {/* Chevron: not in the icon set (see report). */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul id={listId} className={styles.menu}>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={styles.option}
                aria-pressed={value === o.value}
                onClick={() => {
                  select(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
