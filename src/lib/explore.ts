// Plain data the exploration UI components take. Built from trail.json and
// index.mdx frontmatter by the content loaders (step 3); the UI kit fills
// them from src/app/dev/kit/sample.ts.

import type { Resource, SourceType, Step, Trail } from "./trail";

/** Background tone behind motif art (tokens --tone-*). */
export type Tone = "peri" | "sand" | "sage" | "clay";

/** Line drawings used when an exploration or experiment has no image.
 *  Drawn in src/components/explore/MotifArt.tsx. */
export type MotifName =
  | "path" | "orbit" | "arm" | "swarm" | "field"
  | "fork" | "spin" | "level" | "wave" | "latch";

export type TrailSummary = Trail["summary"];

/** One line in the hover card's "How the trail starts". */
export interface TrailPreviewStep {
  kind: Step["kind"];
  /** Set for source and dead-end steps, to pick the source-type icon. */
  sourceType?: SourceType;
  text: string;
}

export interface ExplorationCardData {
  slug: string;
  title: string;
  topic: string;
  minutes: number;
  /** One line for the hover card and the "New this week" card. */
  teaser: string;
  tone: Tone;
  motif: MotifName;
  /** Thumbnail image URL; when absent the motif art is drawn on the tone. */
  thumbnail?: string | null;
  summary: TrailSummary;
  /** The first steps after the question, for the hover card. */
  trailStart: TrailPreviewStep[];
  /** Steps after the question that trailStart doesn't show. */
  moreSteps: number;
  /** Open-thread texts ("Leads to"). */
  leadsTo: string[];
}

export interface ExperimentCardData {
  /** Exploration the experiment belongs to. */
  slug: string;
  explorationTitle: string;
  /** Step number inside that trail; the card links to #step-<n>. */
  step: number;
  title: string;
  tone: Tone;
  motif: MotifName;
  /** First photo, or a video's poster frame. */
  poster?: string | null;
  /** "0:48" when the experiment's media is a video. */
  duration?: string | null;
}

export interface SourceCardData {
  /** URL id for /resources/<id> (see CLAUDE.md, "Content model"). */
  id: string;
  type: SourceType;
  title: string;
  /** Number of trails that use it; the card is only shown when it's 2 or more. */
  usedIn: number;
}

export interface OpenThreadData {
  text: string;
  /** The exploration that opened it. */
  openedBy: { slug: string; title: string };
  /** Stable key for votes: "<exploration slug>#step-<n>". */
  key: string;
}

/** The first `count` steps after the question, for the hover card. */
export function trailPreview(
  trail: Pick<Trail, "steps" | "resources">,
  count = 3,
): { trailStart: TrailPreviewStep[]; moreSteps: number; leadsTo: string[] } {
  const byKey = new Map<string, Resource>(trail.resources.map((r) => [r.key, r]));
  const afterQuestion = trail.steps.filter((s, i) => !(i === 0 && s.kind === "question"));

  const trailStart = afterQuestion.slice(0, count).map((s): TrailPreviewStep => {
    switch (s.kind) {
      case "source": {
        const r = byKey.get(s.resource);
        return { kind: s.kind, sourceType: r?.type, text: `${typeLabel(r?.type)} · ${r?.title ?? s.resource}` };
      }
      case "deadEnd": {
        const r = byKey.get(s.resource);
        return { kind: s.kind, sourceType: r?.type, text: `Dead end · ${r?.title ?? s.resource}` };
      }
      case "experiment":
        return { kind: s.kind, text: `Experiment · ${s.title}` };
      case "insight":
        return { kind: s.kind, text: `Insight · ${s.text}` };
      default:
        return { kind: s.kind, text: s.text };
    }
  });

  return {
    trailStart,
    moreSteps: Math.max(0, afterQuestion.length - trailStart.length),
    leadsTo: trail.steps.flatMap((s) => (s.kind === "openThread" ? [s.text] : [])),
  };
}

const TYPE_LABEL: Record<SourceType, string> = {
  video: "Video", article: "Article", book: "Book", paper: "Paper", podcast: "Podcast",
  conversation: "Conversation", tool: "Tool", course: "Course", datasheet: "Datasheet",
};

export function typeLabel(type: SourceType | undefined): string {
  return type ? TYPE_LABEL[type] : "Source";
}
