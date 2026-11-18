// Plain data the build UI components take. Built from
// src/content/builds/<slug>/ by the content loaders (step 3).

import type { SeriesStatus } from "@/components/library/StatusPill";
import type { TrailSummary } from "./explore";

/** Frontmatter `highlight:` — the only thing that earns a star on a timeline. */
export type Highlight = "breakthrough" | "milestone";

/** done = happened; next = the one coming up; planned = after that. */
export type TimelineState = "done" | "next" | "planned";

export interface Milestone {
  title: string;
  /** YYYY-MM-DD: when it happened, or the target date. */
  date: string;
  state: TimelineState;
  highlight?: Highlight;
  href?: string;
}

/** One dated log, `logs/NN-<slug>.mdx`. */
export interface BuildLog {
  n: number;
  slug: string;
  title: string;
  date: string;
  state: TimelineState;
  highlight?: Highlight;
  expected: string;
  happened?: string;
  broke?: string;
  /** A short line under "What happened", e.g. "That's the next log." */
  note?: string;
  href?: string;
}

export interface BuildData {
  number: number;
  slug: string;
  title: string;
  topic: string;
  /** Same vocabulary as StatusPill: "in-progress" shows as "Active build". */
  status: SeriesStatus;
  description: string;
  milestones: Milestone[];
  latestLog: BuildLog;
  explorations: { slug: string; title: string; summary?: TrailSummary }[];
}

/** Zero-padded build number: 1 → "01". */
export function buildNumber(n: number): string {
  return String(n).padStart(2, "0");
}

/** The first milestone that hasn't happened yet. */
export function nextMilestone(milestones: Milestone[]): Milestone | undefined {
  return milestones.find((m) => m.state === "next") ?? milestones.find((m) => m.state === "planned");
}
