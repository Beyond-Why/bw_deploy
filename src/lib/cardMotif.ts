/**
 * Deterministic generative motifs for Insight Card faces — the Tier 2
 * fallback for cards with no thumbnail of their own. A collection picks one
 * base pattern (its `motif` frontmatter field); each card within it seeds a
 * variation from its own slug, so the collection reads as a set while every
 * card differs slightly. Same slug + type => same output, always.
 */

export type MotifType = "radial" | "wave" | "lattice";

export interface MotifPath {
  d: string;
}

export interface MotifLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MotifCircle {
  cx: number;
  cy: number;
  r: number;
  /** Lattice's emphasized nodes render filled; radial's rings render as hollow strokes. */
  filled: boolean;
}

export interface CardMotif {
  paths: MotifPath[];
  lines: MotifLine[];
  circles: MotifCircle[];
}

export const MOTIF_VIEW_W = 100;
export const MOTIF_VIEW_H = 125;
export const MOTIF_VIEWBOX = `0 0 ${MOTIF_VIEW_W} ${MOTIF_VIEW_H}`;

function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h) ^ slug.charCodeAt(i);
  }
  return h >>> 0;
}

// mulberry32 — small, fast, deterministic PRNG for a sequence of values.
function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Concentric rings + radiating spokes from a center point ── */
function generateRadial(rand: () => number): CardMotif {
  const cx = MOTIF_VIEW_W / 2 + (rand() - 0.5) * 12;
  const cy = MOTIF_VIEW_H / 2 + (rand() - 0.5) * 18;
  const maxR = 68 + rand() * 24;
  const ringCount = 4 + Math.floor(rand() * 3); // 4–6

  const circles: MotifCircle[] = [];
  for (let i = 1; i <= ringCount; i++) {
    circles.push({ cx, cy, r: (maxR / ringCount) * i, filled: false });
  }

  const spokeCount = 12 + Math.floor(rand() * 7); // 12–18
  const rotation = rand() * Math.PI * 2;
  const innerR = maxR * 0.12;
  const lines: MotifLine[] = [];
  for (let i = 0; i < spokeCount; i++) {
    const angle = rotation + (i / spokeCount) * Math.PI * 2;
    lines.push({
      x1: cx + Math.cos(angle) * innerR,
      y1: cy + Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * maxR,
      y2: cy + Math.sin(angle) * maxR,
    });
  }

  return { paths: [], lines, circles };
}

/* ── Stacked interference curves ── */
function generateWave(rand: () => number): CardMotif {
  const waveCount = 7 + Math.floor(rand() * 4); // 7–10
  const paths: MotifPath[] = [];
  const steps = 14;

  for (let i = 0; i < waveCount; i++) {
    const baseY = (MOTIF_VIEW_H / (waveCount + 1)) * (i + 1);
    const amplitude = 3 + rand() * 9;
    const phase = rand() * Math.PI * 2;
    const freq = 0.8 + rand() * 1.4;

    const points: string[] = [];
    for (let s = 0; s <= steps; s++) {
      const x = (MOTIF_VIEW_W / steps) * s;
      const t = (s / steps) * Math.PI * 2 * freq + phase;
      const y = baseY + Math.sin(t) * amplitude;
      points.push(`${s === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    paths.push({ d: points.join(" ") });
  }

  return { paths, lines: [], circles: [] };
}

/* ── Grid of lines with a few emphasized point-nodes ── */
function generateLattice(rand: () => number): CardMotif {
  const cols = 5 + Math.floor(rand() * 3); // 5–7
  const rows = 6 + Math.floor(rand() * 3); // 6–8
  const jitter = 3;

  const xs: number[] = [];
  const ys: number[] = [];
  for (let c = 0; c <= cols; c++) {
    xs.push((MOTIF_VIEW_W / cols) * c + (rand() - 0.5) * jitter);
  }
  for (let r = 0; r <= rows; r++) {
    ys.push((MOTIF_VIEW_H / rows) * r + (rand() - 0.5) * jitter);
  }

  const lines: MotifLine[] = [];
  xs.forEach((x) => lines.push({ x1: x, y1: 0, x2: x, y2: MOTIF_VIEW_H }));
  ys.forEach((y) => lines.push({ x1: 0, y1: y, x2: MOTIF_VIEW_W, y2: y }));

  const nodeCount = 4 + Math.floor(rand() * 3); // 4–6
  const circles: MotifCircle[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const xi = Math.floor(rand() * xs.length);
    const yi = Math.floor(rand() * ys.length);
    circles.push({ cx: xs[xi], cy: ys[yi], r: 1.6 + rand() * 1.3, filled: true });
  }

  return { paths: [], lines, circles };
}

export function generateCardMotif(motifType: MotifType, cardSlug: string): CardMotif {
  const rand = mulberry32(hashSlug(cardSlug || "insight-card"));
  switch (motifType) {
    case "wave":
      return generateWave(rand);
    case "lattice":
      return generateLattice(rand);
    case "radial":
    default:
      return generateRadial(rand);
  }
}
