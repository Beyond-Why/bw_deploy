/**
 * Homepage feed scheduler for the Library section.
 *
 * The feed is a sequence of SHELVES, not individual items — a shelf is a
 * Deep Dive card, a Builder Log card, or an Insight Row.
 *
 * Rhythm:
 *   Lead-in (once):  2 or 3 Deep Dives (picked randomly), then an
 *                     Insight Row of 5-6 cards (picked randomly)
 *   Repeating unit:   2 Deep Dives, 1 Builder Log, an Insight Row of 5-6
 *                     cards (picked randomly) — repeated for as long as
 *                     there's still a Deep Dive or Builder Log left to place
 *
 * A slot whose content type has run out is skipped, not padded with
 * repeats — a round with 0 Deep Dives left just omits those shelves and
 * keeps whatever else it has (Insight Row still shows; a Builder Log still
 * shows if one remains). The whole feed stops once both Deep Dives and
 * Builder Logs are exhausted.
 *
 * The random picks (lead-in count, each row's card count) come from a
 * seeded PRNG, not Math.random() — this function runs during SSR of the
 * client component AND again on client hydration, so it has to produce
 * the identical sequence both times from the identical seed (generated
 * once server-side per request — see app/page.tsx) or React would see a
 * different shelf sequence between server and client HTML.
 */

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

function pickOne<T>(options: readonly T[], rand: () => number): T {
  return options[Math.floor(rand() * options.length)];
}

export const FEED_LEAD_IN_DEEP_DIVE_OPTIONS = [2, 3] as const;
export const FEED_INSIGHT_ROW_COUNT_OPTIONS = [5, 6] as const;

export const FEED_REPEAT = {
  deepDive: 2,
  builderLog: 1,
} as const;

export type Shelf<D, B> =
  | { type: "deepDive"; item: D }
  | { type: "builderLog"; item: B }
  | { type: "insightRow"; count: number };

export function buildHomeFeed<D, B>(
  deepDives: D[],
  builderLogs: B[],
  includeInsightRow: boolean,
  seed: number
): Shelf<D, B>[] {
  const rand = mulberry32(seed);
  const shelves: Shelf<D, B>[] = [];
  let ddIndex = 0;
  let blIndex = 0;

  const takeDeepDives = (count: number) => {
    const take = Math.min(count, deepDives.length - ddIndex);
    for (let k = 0; k < take; k++) {
      shelves.push({ type: "deepDive", item: deepDives[ddIndex++] });
    }
  };

  const takeBuilderLogs = (count: number) => {
    const take = Math.min(count, builderLogs.length - blIndex);
    for (let k = 0; k < take; k++) {
      shelves.push({ type: "builderLog", item: builderLogs[blIndex++] });
    }
  };

  const insertInsightRow = () => {
    if (includeInsightRow) {
      shelves.push({ type: "insightRow", count: pickOne(FEED_INSIGHT_ROW_COUNT_OPTIONS, rand) });
    }
  };

  // ── Lead-in — runs exactly once ──
  takeDeepDives(pickOne(FEED_LEAD_IN_DEEP_DIVE_OPTIONS, rand));
  insertInsightRow();

  // ── Repeating unit — as long as either pool still has content ──
  while (ddIndex < deepDives.length || blIndex < builderLogs.length) {
    takeDeepDives(FEED_REPEAT.deepDive);
    takeBuilderLogs(FEED_REPEAT.builderLog);
    insertInsightRow();
  }

  return shelves;
}
