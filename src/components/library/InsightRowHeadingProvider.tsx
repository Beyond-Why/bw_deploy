"use client";

import { createContext, useContext, useMemo, useRef } from "react";

/* ──────────────────────────────────────────────────────────────
   Shared shuffle for "mixed" InsightRow headings.
   The pool is shuffled ONCE per page render and dealt out in order
   to each mixed row that asks — never picked independently per row.

   Seeded (not Math.random()) deliberately: this provider is a client
   component, and Next.js SSRs client components for the initial HTML
   before hydrating them in the browser. Math.random() during render
   would run once on the server and again on the client, picking two
   different shuffles and producing a hydration mismatch on the
   heading text. The seed is generated server-side once per request
   (see app/page.tsx) and passed down as a prop, so both environments
   compute the identical shuffle from the identical seed.
   ────────────────────────────────────────────────────────────── */

const MIXED_HEADING_POOL = [
  "Start anywhere",
  "One idea each",
  "Small things worth knowing",
  "Pick a thread",
  "Loose ends",
] as const;

// mulberry32 — small, fast, deterministic PRNG for a given seed.
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

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const InsightRowHeadingContext = createContext<(() => string) | null>(null);

export function InsightRowHeadingProvider({
  seed,
  children,
}: {
  seed: number;
  children: React.ReactNode;
}) {
  // useMemo with [seed] so the shuffle is computed once for the lifetime
  // of this provider instance, identically on server and client.
  const deck = useMemo(() => seededShuffle(MIXED_HEADING_POOL, seed), [seed]);
  const cursor = useRef(0);

  const next = () => {
    const heading = deck[cursor.current % deck.length];
    cursor.current += 1;
    return heading;
  };

  return (
    <InsightRowHeadingContext.Provider value={next}>
      {children}
    </InsightRowHeadingContext.Provider>
  );
}

/**
 * Pulls the next heading from the shared shuffled deck — once, on this
 * row's first render, cached for the component's lifetime (calling
 * `next()` again on every re-render would keep advancing the cursor and
 * hand the row a different heading each time). Falls back to the pool's
 * first entry if no provider is mounted, so a standalone InsightRow
 * still gets a sensible heading rather than nothing.
 */
export function useMixedHeading(): string {
  const next = useContext(InsightRowHeadingContext);
  const headingRef = useRef<string | null>(null);
  if (headingRef.current === null) {
    headingRef.current = next ? next() : MIXED_HEADING_POOL[0];
  }
  return headingRef.current;
}
