"use client";

import { useState } from "react";
import { Button } from "./Button";
import styles from "./Poll.module.css";

export interface PollOption {
  id: string;
  label: string;
}

interface PollProps {
  /** Uppercase label, e.g. "Your call" or "Before you read". */
  label: string;
  /** Muted note on the right before voting, e.g. "Sign in to vote". */
  note?: string;
  question: string;
  /** Up to 3. */
  options: PollOption[];
  /** Share per option id, in percent. Sample numbers in the UI kit. */
  results: Record<string, number>;
  /** Start in the voted state with this choice (for showing both states). */
  initialChoice?: string;
  /** Small line under the options before voting. */
  footnote?: string;
}

/** Poll, visual states only: choose from a capsule; then see the split,
 *  "You said: …" and "Change my answer". Wired to the database later. */
export function Poll({ label, note, question, options, results, initialChoice, footnote }: PollProps) {
  const [choice, setChoice] = useState<string | undefined>(initialChoice);
  const opts = options.slice(0, 3);
  const chosen = opts.find((o) => o.id === choice);
  let other = 0;

  return (
    <div className={styles.poll}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.note} aria-live="polite">
          {chosen ? `You said: ${chosen.label}` : note}
        </span>
      </div>
      <p className={styles.question}>{question}</p>

      {!chosen ? (
        <>
          <div
            className={styles.options}
            style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}
            role="group"
            aria-label={question}
          >
            {opts.map((o) => (
              <button key={o.id} type="button" className={styles.option} onClick={() => setChoice(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          {footnote && <p className={styles.footnote}>{footnote}</p>}
        </>
      ) : (
        <>
          <div className={styles.bar} aria-hidden="true">
            {opts.map((o) => {
              const mine = o.id === choice;
              const tone = mine ? styles.mine : other++ === 0 ? styles.other : styles.rest;
              return <i key={o.id} className={tone} style={{ width: `${Math.round(results[o.id] ?? 0)}%` }} />;
            })}
          </div>
          <ul
            className={styles.results}
            style={{ gridTemplateColumns: `repeat(${opts.length}, minmax(0, 1fr))` }}
          >
            {opts.map((o) => (
              <li key={o.id} className={o.id === choice ? styles.me : undefined}>
                <b>{Math.round(results[o.id] ?? 0)}%</b>
                {o.label}
                {o.id === choice && <span className="visually-hidden"> (your answer)</span>}
              </li>
            ))}
          </ul>
          <div>
            <Button variant="line" onClick={() => setChoice(undefined)}>
              Change my answer
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
