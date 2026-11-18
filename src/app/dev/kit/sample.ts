// Sample data for /dev/kit. Taken from the design mock-ups in
// docs/design/v2/reference/ — none of it is real content.

import type { BuildData, BuildLog } from "@/lib/build";
import {
  trailPreview,
  type ExperimentCardData,
  type ExplorationCardData,
  type OpenThreadData,
  type SourceCardData,
} from "@/lib/explore";
import type { Trail } from "@/lib/trail";
import type { NowTile } from "@/components/home/NowStrip";

/** The kit's "request date", so relative dates are stable. */
export const TODAY = "2026-12-09";

export const TOPICS = ["Robotics", "Physics", "Control", "Electronics", "Mind"];

/** A full trail, so the hover card is built the way real pages will build it. */
export const SAMPLE_TRAIL: Trail = {
  version: 1,
  explorationId: "3f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b",
  slug: "who-told-nature",
  question: "Why does light, or a thrown ball, seem to know the best path in advance?",
  started: "2026-10-02",
  updated: "2026-11-18",
  summary: { sources: 9, deadEnds: 1, experiments: 1, openThreads: 3, text: "9 sources · 1 dead end · 1 experiment · 3 open threads" },
  resources: [
    { key: "youtube:qJZ1Ez28C-A", type: "video", title: "Veritasium on least action", url: "https://www.youtube.com/watch?v=qJZ1Ez28C-A" },
    { key: "url:feynmanlectures.caltech.edu/II_19.html", type: "book", title: "Feynman Lectures, vol. 2, ch. 19", url: "https://www.feynmanlectures.caltech.edu/II_19.html" },
    { key: "note:the-every-path-story", type: "video", title: "the every-path story", url: null },
  ],
  steps: [
    { n: 1, kind: "question", text: "Why does light, or a thrown ball, seem to know the best path in advance?" },
    { n: 2, kind: "source", resource: "youtube:qJZ1Ez28C-A", locator: "3:10", at: 190, took: "Nature can be written as picking the path that keeps the action smallest", led: "Wanted the real derivation" },
    { n: 3, kind: "source", resource: "url:feynmanlectures.caltech.edu/II_19.html", took: "Same physics as Newton, written as one rule over the whole path", led: "Is choosing the right word?" },
    { n: 4, kind: "deadEnd", resource: "note:the-every-path-story", why: "It's a way of calculating, not a proven picture" },
    { n: 5, kind: "experiment", title: "A laser through a tank of water", media: ["clip.mp4"], tried: "Moved the crossing point", saw: "The bend sits where travel time is shortest" },
    { n: 6, kind: "insight", text: "Shortest time and least action are the same kind of rule", from: [2, 3] },
    { n: 7, kind: "now", text: "The rule describes the path; nothing has to choose it", from: [2, 6] },
    { n: 8, kind: "openThread", text: "Do ant swarms minimise too?", next: null },
    { n: 9, kind: "openThread", text: "And evolution?", next: null },
    { n: 10, kind: "openThread", text: "Is there a rule for paths that branch?", next: null },
  ],
  links: [],
  layout: {},
};

const preview = trailPreview(SAMPLE_TRAIL);

function card(
  data: Omit<ExplorationCardData, "trailStart" | "moreSteps" | "leadsTo"> &
    Partial<Pick<ExplorationCardData, "trailStart" | "moreSteps" | "leadsTo">>,
): ExplorationCardData {
  return {
    trailStart: [
      { kind: "source", sourceType: "article", text: "Article · where the question starts" },
      { kind: "source", sourceType: "video", text: "Video · a first explanation" },
    ],
    moreSteps: 5,
    leadsTo: [],
    ...data,
  };
}

export const POPULAR: ExplorationCardData[] = [
  card({
    slug: "robot-know-where", title: "How does a robot know where it is?", topic: "Robotics", minutes: 22,
    teaser: "GPS is too coarse indoors, so how does a robot vacuum know which room it's in?",
    tone: "sage", motif: "orbit", summary: { sources: 8, deadEnds: 1, experiments: 1, openThreads: 2, text: "" },
    leadsTo: ["How do people know where they are with their eyes closed?"],
  }),
  card({
    slug: "arm-joints", title: "How much should each joint of an arm move?", topic: "Robotics", minutes: 16,
    teaser: "Pointing a robot arm at a cup turns out to be a question with many right answers.",
    tone: "clay", motif: "arm", summary: { sources: 6, deadEnds: 0, experiments: 1, openThreads: 2, text: "" },
  }),
  card({
    slug: "thousand-robots", title: "How do a thousand robots think as one?", topic: "Robotics", minutes: 20,
    teaser: "No leader, no map, and yet the swarm finds the food. I wanted to see the rules.",
    tone: "sage", motif: "swarm", summary: { sources: 7, deadEnds: 0, experiments: 1, openThreads: 3, text: "" },
  }),
  card({
    slug: SAMPLE_TRAIL.slug, title: "Who told nature which path to take?", topic: "Physics", minutes: 18,
    teaser: "Light, a thrown ball and a planet all seem to pick the best path. I followed the idea from Fermat to Feynman to find out who, if anyone, does the picking.",
    tone: "peri", motif: "path", summary: SAMPLE_TRAIL.summary, ...preview,
  }),
];

export const START_ANYWHERE: ExplorationCardData[] = [
  card({ slug: "space-not-empty", title: "The space that isn't empty", topic: "Physics", minutes: 14, teaser: "Two magnets push without touching. What is in the gap?", tone: "sand", motif: "field", summary: { sources: 7, deadEnds: 1, experiments: 0, openThreads: 2, text: "" } }),
  card({ slug: "regret", title: "Why do we regret things we never did?", topic: "Mind", minutes: 11, teaser: "The road not taken weighs more than the one we took.", tone: "sand", motif: "fork", summary: { sources: 5, deadEnds: 1, experiments: 0, openThreads: 2, text: "" } }),
  card({ slug: "spinning-top", title: "Why does a spinning top stay up?", topic: "Physics", minutes: 10, teaser: "It should fall over. It doesn't, until it slows down.", tone: "sand", motif: "spin", summary: { sources: 4, deadEnds: 0, experiments: 1, openThreads: 2, text: "" } }),
  card({ slug: "drone-level", title: "How does a drone stay level?", topic: "Control", minutes: 12, teaser: "Four motors, one small board, and a loop that runs hundreds of times a second.", tone: "peri", motif: "level", summary: { sources: 5, deadEnds: 0, experiments: 1, openThreads: 2, text: "" } }),
];

export const NEW_THIS_WEEK: ExplorationCardData = card({
  slug: "batteries-wear-out", title: "Why do batteries wear out?", topic: "Electronics", minutes: 15,
  teaser: "A phone battery loses a little every charge. I wanted to know what is actually being used up.",
  tone: "clay", motif: "wave", summary: { sources: 6, deadEnds: 1, experiments: 0, openThreads: 1, text: "" },
});

export const QUICK: Pick<ExplorationCardData, "slug" | "title" | "minutes" | "summary">[] = [
  { slug: "circuit-remember", title: "Can a circuit remember?", minutes: 12, summary: { sources: 4, deadEnds: 0, experiments: 1, openThreads: 0, text: "" } },
  { slug: "four-propellers", title: "Why does a drone need four propellers?", minutes: 9, summary: { sources: 5, deadEnds: 0, experiments: 0, openThreads: 2, text: "" } },
  { slug: "battery-work", title: "How does a battery actually work?", minutes: 15, summary: { sources: 6, deadEnds: 1, experiments: 0, openThreads: 0, text: "" } },
  { slug: "energy-go", title: "Where does the energy actually go?", minutes: 13, summary: { sources: 5, deadEnds: 0, experiments: 0, openThreads: 2, text: "" } },
];

export const EXPERIMENTS: ExperimentCardData[] = [
  { slug: SAMPLE_TRAIL.slug, explorationTitle: "Who told nature which path to take?", step: 5, title: "A laser through a tank of water", tone: "peri", motif: "path", duration: "0:48" },
  { slug: "drone-level", explorationTitle: "How does a drone stay level?", step: 4, title: "Tuning the gains on my drone", tone: "sage", motif: "level", duration: "1:12" },
  { slug: "circuit-remember", explorationTitle: "Can a circuit remember?", step: 3, title: "A two-transistor latch", tone: "clay", motif: "latch", duration: "0:35" },
  { slug: "spinning-top", explorationTitle: "Why does a spinning top stay up?", step: 4, title: "A top on a phone's IMU", tone: "sand", motif: "spin", duration: "0:52" },
  { slug: "thousand-robots", explorationTitle: "How do a thousand robots think as one?", step: 6, title: "Fifty agents in a sandbox", tone: "sage", motif: "swarm", duration: null },
];

export const SOURCES: SourceCardData[] = [
  { id: "web-3b1f0c9a2e", type: "book", title: "The Feynman Lectures on Physics, vol. 2", usedIn: 3 },
  { id: "isbn-9780262201629", type: "book", title: "Probabilistic Robotics", usedIn: 2 },
  { id: "isbn-9781107156302", type: "book", title: "Modern Robotics", usedIn: 2 },
  { id: "youtube-UR0hOmjaHp0", type: "video", title: "PID control, explained", usedIn: 2 },
  { id: "web-0000000000", type: "article", title: "Used in only one trail (hidden)", usedIn: 1 },
];

export const OPEN_THREADS: OpenThreadData[] = [
  { key: "who-told-nature#step-8", text: "Do ant swarms find the shortest path the way light does?", openedBy: { slug: SAMPLE_TRAIL.slug, title: "Who told nature which path to take?" } },
  { key: "robot-know-where#step-9", text: "How do people know where they are with their eyes closed?", openedBy: { slug: "robot-know-where", title: "How does a robot know where it is?" } },
  { key: "drone-level#step-7", text: "Could a drone learn its own control gains?", openedBy: { slug: "drone-level", title: "How does a drone stay level?" } },
  { key: "regret#step-6", text: "Is regret useful, or just painful?", openedBy: { slug: "regret", title: "Why do we regret things we never did?" } },
];

export const BUILD_LOGS: BuildLog[] = [
  { n: 1, slug: "01-board-ordered", title: "The board is ordered", date: "2026-11-22", state: "done", expected: "The design passes the fab's checks.", happened: "The flight board design went out for manufacturing.", href: "/builds/esp32-drone#log-01" },
  { n: 2, slug: "02-first-signs-of-life", title: "First signs of life", date: "2026-12-07", state: "done", highlight: "breakthrough", expected: "The board powers up and the motors spin.", happened: "The IMU answers and the phone connects. The motors stay silent.", broke: "The motors don't spin yet.", note: "That's the next log.", href: "/builds/esp32-drone#log-02" },
  { n: 3, slug: "03-first-hover", title: "First hover", date: "2026-12-20", state: "next", expected: "It lifts off and holds level for ten seconds." },
];

export const BUILD: BuildData = {
  number: 1,
  slug: "esp32-drone",
  title: "A drone you fly from your phone",
  topic: "Robotics",
  status: "in-progress",
  description:
    "An ESP32 quadcopter on a flight board I designed, flown over Wi-Fi from a phone. Every step is logged here, and it becomes a kit when it flies well enough to sell.",
  milestones: [
    { title: "The board is ordered", date: "2026-11-22", state: "done", href: "/builds/esp32-drone#log-01" },
    { title: "First signs of life", date: "2026-12-07", state: "done", highlight: "breakthrough", href: "/builds/esp32-drone#log-02" },
    { title: "First hover", date: "2026-12-20", state: "next" },
    { title: "Kit goes on sale", date: "2027-01-20", state: "planned" },
  ],
  latestLog: BUILD_LOGS[1],
  explorations: [
    { slug: "drone-level", title: "How does a drone stay level?", summary: { sources: 5, deadEnds: 0, experiments: 1, openThreads: 2, text: "" } },
    { slug: "four-propellers", title: "Why does a drone need four propellers?" },
  ],
};

export const NOW_TILES: NowTile[] = [
  { kind: "build", build: 1, title: "First signs of life", href: "/builds/esp32-drone#log-02", date: "2026-12-07" },
  { kind: "milestone", title: "First hover", href: "/builds/esp32-drone", target: "2026-12-20" },
  { kind: "trail", title: "How does a drone stay level?", href: "/explore/drone-level", date: "2026-12-06" },
  { kind: "vote", openQuestions: 4 },
  { kind: "video", title: "The drone's first log, on film", href: "/builds/esp32-drone#log-02", date: "2026-12-06" },
];

/** Same tiles but most are stale: the strip hides itself. */
export const NOW_TILES_STALE: NowTile[] = [
  { kind: "build", build: 1, title: "The board is ordered", href: "/builds/esp32-drone", date: "2026-10-01" },
  { kind: "trail", title: "An old trail", href: "/explore/x", date: "2026-10-02" },
  { kind: "milestone", title: "First hover", href: "/builds/esp32-drone", target: "2026-12-20" },
];

export const PREDICTION = {
  label: "Your call",
  note: "Sign in to vote",
  question: "Will it hover by 20 December?",
  options: [
    { id: "on-time", label: "On time" },
    { id: "late", label: "Late" },
    { id: "breaks", label: "It breaks first" },
  ],
  results: { "on-time": 41, late: 37, breaks: 22 },
};

export const GUESS = {
  label: "What do you think now?",
  note: "One tap",
  question: "A ray of light takes the quickest path. Who picks it?",
  options: [
    { id: "light", label: "The light" },
    { id: "nothing", label: "Nothing does" },
    { id: "unsure", label: "Not sure" },
  ],
  results: { light: 34, nothing: 48, unsure: 18 },
};
