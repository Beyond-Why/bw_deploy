// src/components/icons/iconPaths.ts
// The Beyond Why icon set, exported from the "Icons and the timeline" design
// board (docs/design/v2/reference/icons.html). Every icon is drawn on a
// 24 × 24 grid with a 1.75 stroke, round caps and joins, in currentColor.
// Elements marked data-fill are filled with currentColor and have no stroke.
// Trusted, static markup: safe to render with dangerouslySetInnerHTML.

export type IconName =
  | "step-question" | "step-source" | "step-insight" | "step-dead-end" | "step-experiment" | "step-now" | "step-open" | "src-video" | "src-article" | "src-book" | "src-paper" | "src-podcast" | "src-conversation" | "src-tool" | "src-course" | "src-datasheet" | "build" | "build-log" | "build-milestone" | "build-kit" | "build-parts" | "build-files" | "build-broke" | "build-time" | "nav-home" | "nav-explore" | "act-save" | "act-search" | "act-topics" | "act-like" | "act-discuss" | "act-share" | "act-vote" | "act-story" | "act-trail" | "act-go" | "mark-star";

export interface IconDef {
  /** What the icon means, for aria-label when the icon stands alone. */
  label: string;
  /** Inner SVG markup for a viewBox="0 0 24 24" svg. */
  body: string;
}

export const ICONS: Record<IconName, IconDef> = {
  "step-question": { label: "Question", body: `<circle cx="12" cy="12" r="9"></circle><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2 1-1.2 1.8v.5"></path><circle data-fill="" cx="12" cy="16.9" r="1"></circle>` },
  "step-source": { label: "Source", body: `<path d="M8 3h11v15H8z"></path><path d="M5 6v15h11"></path>` },
  "step-insight": { label: "Insight", body: `<path d="M9 17.5h6M10 21h4"></path><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.1h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"></path>` },
  "step-dead-end": { label: "Dead end", body: `<path d="M3 17c4 0 6-6 10-6"></path><path d="M16 6v10"></path>` },
  "step-experiment": { label: "Experiment", body: `<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"></path><path d="M7.4 15h9.2"></path>` },
  "step-now": { label: "What I think now", body: `<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"></path><circle cx="12" cy="10.5" r="2.3"></circle>` },
  "step-open": { label: "Open thread", body: `<path d="M3 12h10" stroke-dasharray="2.5 3"></path><path d="M14 7l5 5-5 5"></path>` },
  "src-video": { label: "Video", body: `<rect x="3" y="5" width="18" height="14" rx="3"></rect><path data-fill="" d="M10 9v6l5-3z"></path>` },
  "src-article": { label: "Article", body: `<path d="M6 3h8.5L19 7.5V21H6z"></path><path d="M14 3v5h5"></path><path d="M9 12.5h7M9 16.5h5"></path>` },
  "src-book": { label: "Book", body: `<path d="M12 6.5C9.5 4.8 6.5 4.4 3 5v14c3.5-.6 6.5-.2 9 1.5 2.5-1.7 5.5-2.1 9-1.5V5c-3.5-.6-6.5-.2-9 1.5z"></path><path d="M12 6.5v14"></path>` },
  "src-paper": { label: "Paper", body: `<rect x="5" y="3" width="14" height="18" rx="1.5"></rect><path d="M8.5 7.5h7M8.5 11h7M8.5 14.5h7M8.5 18h3.5"></path>` },
  "src-podcast": { label: "Podcast", body: `<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5.5 11a6.5 6.5 0 0 0 13 0"></path><path d="M12 17.5V21M9 21h6"></path>` },
  "src-conversation": { label: "Conversation", body: `<path d="M4 5h11v8H8.5L4 16.5z"></path><path d="M15 9h5v8.5L16.5 15H10v-2"></path>` },
  "src-tool": { label: "Tool", body: `<path d="M4 7h10M18 7h2M4 17h4M12 17h8"></path><circle cx="16" cy="7" r="2"></circle><circle cx="10" cy="17" r="2"></circle>` },
  "src-course": { label: "Course", body: `<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path><path data-fill="" d="M10.5 7.8v4.4l3.8-2.2z"></path>` },
  "src-datasheet": { label: "Datasheet", body: `<rect x="4" y="3" width="16" height="18" rx="1.5"></rect><path d="M4 9h16M4 15h16M10 3v18"></path>` },
  "build": { label: "Build", body: `<rect x="9" y="9" width="6" height="6" rx="1.2"></rect><circle cx="5.5" cy="5.5" r="2.5"></circle><circle cx="18.5" cy="5.5" r="2.5"></circle><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle><path d="M7.3 7.3 9 9M16.7 7.3 15 9M7.3 16.7 9 15M16.7 16.7 15 15"></path>` },
  "build-log": { label: "Log", body: `<rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M12 8h4M12 12h4"></path>` },
  "build-milestone": { label: "Milestone", body: `<path d="M5 21V4"></path><path d="M5 4h12l-2.5 4L17 12H5"></path>` },
  "build-kit": { label: "Kit", body: `<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"></path><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"></path>` },
  "build-parts": { label: "Parts", body: `<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"></path><circle cx="12" cy="12" r="3"></circle>` },
  "build-files": { label: "Files", body: `<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"></path>` },
  "build-broke": { label: "What broke", body: `<rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M12.5 4l-2.5 5 4 3-3 8"></path>` },
  "build-time": { label: "Countdown", body: `<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>` },
  "nav-home": { label: "Home", body: `<path d="M4 10.5 12 4l8 6.5V20h-5.5v-6h-5v6H4z"></path>` },
  "nav-explore": { label: "Explore", body: `<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path>` },
  "act-save": { label: "Save", body: `<path d="M6 4h12v17l-6-4-6 4z"></path>` },
  "act-search": { label: "Search", body: `<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path>` },
  "act-topics": { label: "Topics", body: `<path d="M3 12V4h8l10 10-8 8z"></path><circle cx="7.5" cy="8" r="1.3"></circle>` },
  "act-like": { label: "Like", body: `<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"></path>` },
  "act-discuss": { label: "Discuss", body: `<path d="M4 5h16v11H9l-5 4z"></path>` },
  "act-share": { label: "Share", body: `<path d="M14 5l6 6-6 6M20 11H10a6 6 0 0 0-6 6v2"></path>` },
  "act-vote": { label: "I want this", body: `<circle cx="12" cy="12" r="9"></circle><path d="M12 16.5v-9M8.5 11 12 7.5l3.5 3.5"></path>` },
  "act-story": { label: "Read the story", body: `<path d="M4 6h16M4 10h16M4 14h16M4 18h10"></path>` },
  "act-trail": { label: "Walk the trail", body: `<path d="M7 3.5c1.7 0 2.6 1.7 2.6 4.1S8.7 12.5 7 12.5 4.4 10 4.4 7.6 5.3 3.5 7 3.5z"></path><path d="M5 15h4"></path><path d="M17 8c1.7 0 2.6 1.7 2.6 4.1S18.7 17 17 17s-2.6-2.5-2.6-4.9S15.3 8 17 8z"></path><path d="M15 19.5h4"></path>` },
  "act-go": { label: "Go", body: `<path d="M5 12h14M13 6l6 6-6 6"></path>` },
  "mark-star": { label: "Important", body: `<path data-fill="" d="M12 2.8l2.75 5.6 6.15.9-4.45 4.35 1.05 6.1L12 16.85 6.5 19.75l1.05-6.1L3.1 9.3l6.15-.9z"></path>` },
};

/** Source type in trail.json → its icon. */
export const SOURCE_ICON = {
  video: "src-video",
  article: "src-article",
  book: "src-book",
  paper: "src-paper",
  podcast: "src-podcast",
  conversation: "src-conversation",
  tool: "src-tool",
  course: "src-course",
  datasheet: "src-datasheet",
} as const satisfies Record<string, IconName>;

/** Step kind in trail.json → its icon. */
export const STEP_ICON = {
  question: "step-question",
  source: "step-source",
  insight: "step-insight",
  deadEnd: "step-dead-end",
  experiment: "step-experiment",
  now: "step-now",
  openThread: "step-open",
} as const satisfies Record<string, IconName>;
