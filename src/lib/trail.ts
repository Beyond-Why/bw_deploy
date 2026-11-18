// src/lib/trail.ts — the shape of src/content/explorations/<slug>/trail.json
// Written by scripts/log-to-trail.js from log.md. The story view is index.mdx;
// both read the same step numbers, so <StepRef n={4} /> in the MDX can jump
// to /explore/<slug>#step-4 on the canvas.

export type SourceType =
  | "video" | "article" | "book" | "paper" | "podcast"
  | "conversation" | "tool" | "course" | "datasheet";

export type LinkLabel =
  | "led me to" | "went deeper" | "contradicted" | "tested in"
  | "so I think" | "opened" | "reframed";

/** One real-world source. `key` is the dedupe key used by the resources table:
 *  youtube:<id> | doi:<doi> | isbn:<isbn> | arxiv:<id> | url:<host/path> | note:<slug> */
export interface Resource {
  key: string;
  type: SourceType;
  title: string;
  url: string | null;
  thumbnail?: string; // filled for YouTube; others come from the preview fetcher
}

interface StepBase { n: number } // 1-based; never renumbered after publishing

export interface QuestionStep extends StepBase { kind: "question"; text: string }
export interface SourceStep extends StepBase {
  kind: "source"; resource: string; locator?: string; at?: number; // at = seconds into a YouTube video
  took: string; led: string;
}
export interface DeadEndStep extends StepBase {
  kind: "deadEnd"; resource: string; locator?: string; at?: number;
  why: string; led?: string;
}
export interface InsightStep extends StepBase { kind: "insight"; text: string; from?: number[] }
export interface ExperimentStep extends StepBase {
  kind: "experiment"; title: string; media?: string[]; tried: string; saw: string;
}
export interface NowStep extends StepBase { kind: "now"; text: string; from?: number[] }
export interface OpenThreadStep extends StepBase {
  kind: "openThread"; text: string; next: string | null; // slug of the exploration it became, or null
}

export type Step =
  | QuestionStep | SourceStep | DeadEndStep | InsightStep
  | ExperimentStep | NowStep | OpenThreadStep;

export interface TrailLink { from: number; to: number; label: LinkLabel }

export interface Trail {
  version: 1;
  explorationId: string | null; // the UUID in index.mdx frontmatter
  slug: string;
  question: string;
  started: string | null; // YYYY-MM-DD
  updated: string;
  summary: {
    sources: number; deadEnds: number; experiments: number; openThreads: number;
    text: string; // "9 sources · 1 dead end · 3 open threads" for the card
  };
  resources: Resource[];
  steps: Step[];
  links: TrailLink[];
  /** Canvas positions keyed by step number, saved by the trail editor.
   *  Missing steps get an automatic layout (e.g. dagre, top to bottom). */
  layout: Record<string, { x: number; y: number }>;
}
