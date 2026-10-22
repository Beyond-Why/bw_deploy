"use client";

import { useId, useState, type ReactNode } from "react";
import { BuilderLogIcon } from "@/components/icons";
import { StatusPill, type SeriesStatus } from "@/components/library/StatusPill";
import { useLogOrder } from "./logState";
import styles from "./SeriesHeader.module.css";

/**
 * The series page header — kept short so the newest log's title and the
 * top of its cover still show on a 900px-tall screen. "Start from Day 1"
 * flips the feed's order (and becomes "Back to latest"); "Meet the robot"
 * opens the series intro (index.mdx body) inline.
 */
export default function SeriesHeader({
  title,
  premise,
  category,
  status,
  started,
  latest,
  count,
  lastDay,
  intro,
}: {
  title: string;
  premise?: string;
  category?: string;
  status?: SeriesStatus;
  /** "Fri 3 Oct". */
  started?: string;
  latest?: string;
  count: number;
  lastDay: number;
  /** The rendered intro, or null when index.mdx has no body. */
  intro: ReactNode | null;
}) {
  const { order, setOrder } = useLogOrder();
  const [introOpen, setIntroOpen] = useState(false);
  const introId = useId();

  return (
    <header className={styles.header}>
      <div className={styles.kindRow}>
        <span className={styles.kind}>
          <BuilderLogIcon size={16} />
          Builder Log
        </span>
        {status && <StatusPill status={status} kind="builderlog" />}
        {category && <span className={styles.category}>{category}</span>}
      </div>

      <h1 className={styles.title}>{title}</h1>
      {premise && <p className={styles.premise}>{premise}</p>}

      {count > 0 && (
        <p className={styles.meta}>
          {started && (
            <span>
              Started <strong>{started}</strong>
            </span>
          )}
          <span>
            <strong>
              {count} {count === 1 ? "log" : "logs"}
            </strong>{" "}
            over {lastDay} {lastDay === 1 ? "day" : "days"}
          </span>
          {latest && (
            <span>
              Latest <strong>{latest}</strong>
            </span>
          )}
        </p>
      )}

      <div className={styles.buttons}>
        {count > 1 && (
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => setOrder(order === "newest" ? "oldest" : "newest")}
          >
            <span className={styles.circle} aria-hidden="true">
              {order === "newest" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 5v14" />
                  <path d="m18 6-8 6 8 6z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 5v14" />
                  <path d="m6 6 8 6-8 6z" fill="currentColor" />
                </svg>
              )}
            </span>
            {order === "newest" ? "Start from Day 1" : "Back to latest"}
          </button>
        )}
        {intro && (
          <button
            type="button"
            className={styles.button}
            aria-expanded={introOpen}
            aria-controls={introId}
            onClick={() => setIntroOpen((open) => !open)}
          >
            <span className={styles.circle} aria-hidden="true">
              <svg className={introOpen ? styles.plusOpen : undefined} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            New here? Meet the robot
          </button>
        )}
      </div>

      {intro && (
        <div id={introId} className={styles.intro} hidden={!introOpen}>
          {intro}
        </div>
      )}
    </header>
  );
}
