"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./ContentFeed.module.css";
import { DeepDiveCard, BuilderLogCard, InsightRow, InsightRowHeadingProvider, InsightCollectionBlock, ComingSoonBar } from "./library";
import type { SeriesFrontmatter, EpisodeInfo, InsightCollection } from "@/lib/content";
import type { InsightRowCardItem } from "./library";
import { buildHomeFeed } from "@/lib/feedScheduler";

type ContentType = "All" | "Deep Dives" | "Insight Cards";

interface ContentFeedProps {
  deepDives: { slug: string; frontmatter: SeriesFrontmatter; episodes?: EpisodeInfo[] }[];
  builderLogs: { slug: string; frontmatter: SeriesFrontmatter; episodes?: EpisodeInfo[] }[];
  collections: InsightCollection[];
  /** Server-generated once per request — see app/page.tsx — so the mixed
   *  row's heading shuffle matches between SSR and client hydration. */
  headingShuffleSeed: number;
  /** Server-generated once per request — see app/page.tsx and
   *  feedScheduler.ts — so the shelf sequence's random picks (lead-in
   *  count, each Insight Row's card count) match between SSR and client
   *  hydration. */
  feedScheduleSeed: number;
}

function shuffleOnce<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Round-robins across every collection (entry-flagged cards first within
 * each collection, so the previously curated "standalone-worthy" picks
 * still lead) to produce ONE ordered pool of every eligible card, refilling
 * from the same collection once others run dry rather than capping at one
 * card each. Unbounded — chunking this into per-row slices is a separate
 * step (buildMixedRowSlices) so multiple rows never draw from overlapping
 * territory.
 */
function buildMixedCardPool(collections: InsightCollection[]): InsightRowCardItem[] {
  const queues = collections.map((collection) => ({
    collection,
    cards: [...collection.cards].sort((a, b) => {
      const aEntry = a.frontmatter.entry ? 0 : 1;
      const bEntry = b.frontmatter.entry ? 0 : 1;
      return aEntry - bEntry;
    }),
  }));

  const pool: InsightRowCardItem[] = [];
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (const { collection, cards } of queues) {
      if (cards.length === 0) continue;
      const card = cards.shift()!;
      pool.push({
        slug: `${collection.slug}/${card.slug}`,
        href: `/insight-cards/${collection.slug}/${card.slug}`,
        frontmatter: card.frontmatter,
        collectionTitle: collection.frontmatter.title,
        motif: collection.frontmatter.motif,
      });
      madeProgress = true;
    }
  }

  return pool;
}

export function ContentFeed({
  deepDives,
  builderLogs,
  collections,
  headingShuffleSeed,
  feedScheduleSeed,
}: ContentFeedProps) {
  const [activeTab, setActiveTab] = useState<ContentType>("All");
  const sectionRef = useRef<HTMLElement>(null);

  // /insight-cards is a shallow-routed filter state of the homepage, same
  // as /deep-dives and /builder-log — the tab is only rendered client-side
  // (this only ever shuffles post-hydration, so no SSR/client mismatch risk).
  const [shuffledCollections] = useState<InsightCollection[]>(() => shuffleOnce(collections));

  // Initialize tab from URL and scroll to section if on a filtered path
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/deep-dives") setActiveTab("Deep Dives");
    else if (path === "/insight-cards") setActiveTab("Insight Cards");
    else setActiveTab("All");

    if (path !== "/") {
      const timer = setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const tabs: ContentType[] = ["All", "Deep Dives", "Insight Cards"];

  // Sort by date for single-type tabs
  const sortedDeepDives = [...deepDives].sort(
    (a, b) => new Date(b.frontmatter.date || 0).getTime() - new Date(a.frontmatter.date || 0).getTime()
  );
  const sortedBuilderLogs = [...builderLogs].sort(
    (a, b) => new Date(b.frontmatter.date || 0).getTime() - new Date(a.frontmatter.date || 0).getTime()
  );

  const mixedPool = buildMixedCardPool(collections);

  const feedShelves = buildHomeFeed(
    sortedDeepDives,
    sortedBuilderLogs,
    mixedPool.length > 0,
    feedScheduleSeed
  );

  // Cards are handed out from the shared pool in schedule order, each row
  // taking however many cards the schedule picked for it (5 or 6) — so two
  // rows on the same page never show the same card, and a row that runs
  // past the end of the pool just gets fewer cards (down to none, at which
  // point InsightRow renders nothing rather than an empty shelf) rather
  // than repeating content to pad itself out.
  let mixedPoolCursor = 0;

  const handleTabClick = (tab: ContentType) => {
    setActiveTab(tab);
    const urlMap: Record<ContentType, string> = {
      "All": "/",
      "Deep Dives": "/deep-dives",
      "Insight Cards": "/insight-cards",
    };
    window.history.pushState(null, "", urlMap[tab]);
  };

  const tabButtons = tabs.map((tab) => (
    <button
      key={tab}
      className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
      onClick={() => handleTabClick(tab)}
    >
      {tab}
    </button>
  ));

  return (
    <section className={styles.section} ref={sectionRef}>
      {/* Plain in-flow header — scrolls naturally with the page */}
      <div className={styles.headerNatural}>
        <h2 className={styles.sectionTitle}>Library</h2>
        <div className={styles.tabContainer}>
          <div className={styles.tabs}>{tabButtons}</div>
        </div>
      </div>

      {/* ── Shelf feed for "All" tab ── */}
      {activeTab === "All" && (
        <InsightRowHeadingProvider seed={headingShuffleSeed}>
          <div className={styles.feedContainer}>
            {feedShelves.map((shelf, index) => {
              switch (shelf.type) {
                case "deepDive":
                  return (
                    <div key={`slot-dd-${shelf.item.slug}`} className={styles.deepDiveList}>
                      {shelf.item.frontmatter.comingSoon ? (
                        <ComingSoonBar
                          title={shelf.item.frontmatter.title}
                          description={shelf.item.frontmatter.description}
                          category={shelf.item.frontmatter.category}
                          eta={shelf.item.frontmatter.eta}
                        />
                      ) : (
                        <DeepDiveCard
                          slug={shelf.item.slug}
                          frontmatter={shelf.item.frontmatter}
                          href={`/deep-dives/${shelf.item.slug}`}
                          episodes={shelf.item.episodes}
                        />
                      )}
                    </div>
                  );
                case "insightRow": {
                  const cards = mixedPool.slice(mixedPoolCursor, mixedPoolCursor + shelf.count);
                  mixedPoolCursor += shelf.count;
                  return (
                    <InsightRow key={`slot-ir-${index}`} cards={cards} />
                  );
                }
                case "builderLog":
                  return (
                    <BuilderLogCard
                      key={`slot-bl-${shelf.item.slug}`}
                      slug={shelf.item.slug}
                      frontmatter={shelf.item.frontmatter}
                      href={`/builder-log/${shelf.item.slug}`}
                      episodes={shelf.item.episodes}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>
        </InsightRowHeadingProvider>
      )}

      {/* ── Deep Dives — Tab Only ── */}
      {activeTab === "Deep Dives" && (
        <div className={styles.deepDiveList}>
          {sortedDeepDives.map((item) =>
            item.frontmatter.comingSoon ? (
              <ComingSoonBar
                key={`dd-${item.slug}`}
                title={item.frontmatter.title}
                description={item.frontmatter.description}
                category={item.frontmatter.category}
                eta={item.frontmatter.eta}
              />
            ) : (
              <DeepDiveCard
                key={`dd-${item.slug}`}
                slug={item.slug}
                frontmatter={item.frontmatter}
                href={`/deep-dives/${item.slug}`}
                episodes={item.episodes}
              />
            )
          )}
        </div>
      )}

      {/* ── Insight Cards — Tab Only — one swipe-paginated block per collection ── */}
      {activeTab === "Insight Cards" && (
        <div className={styles.insightCollectionRows}>
          {shuffledCollections.map((collection) => {
            const cards: InsightRowCardItem[] = collection.cards.map((card) => ({
              slug: `${collection.slug}/${card.slug}`,
              href: `/insight-cards/${collection.slug}/${card.slug}`,
              frontmatter: card.frontmatter,
              motif: collection.frontmatter.motif,
            }));
            return (
              <InsightCollectionBlock
                key={collection.slug}
                title={collection.frontmatter.title}
                cards={cards}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
