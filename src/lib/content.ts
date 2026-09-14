import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

/* ──────────────────────────────────────────────────────────────
   Content library for Beyond Why.
   Reads MDX files from src/content/ at build/request time.

   Content types:
   - deep-dives: series with index.mdx + episode_N.mdx
   - builder-log: series with index.mdx + episode_N.mdx
   - insight-cards: standalone slug.mdx files
   ────────────────────────────────────────────────────────────── */

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

/* ── TYPES ── */

export interface SeriesFrontmatter {
  /** Permanent identity — do not derive from slug, does not change if the slug does. */
  id: string;
  title: string;
  description: string;
  category?: string;
  coverImage?: string;
  thumbnail?: string;
  thumbnailTone?: "dark" | "light";
  status?: "in-progress" | "complete" | "planned" | "paused";
  date?: string;
  hero?: boolean;
  heroPriority?: number;
  /** When this went live — drives the NewTag "new for 7 days" window.
   *  Falls back to `date` where absent (see isNew() in lib/publishing.ts). */
  publishedAt?: string;
  /** Renders the ComingSoonBar in shelves instead of the live series card. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  [key: string]: unknown;
}

export interface EpisodeFrontmatter {
  /** Permanent identity — do not derive from slug, does not change if the slug does. */
  id: string;
  title: string;
  description?: string;
  episode: number;
  date?: string;
  thumbnail?: string;
  thumbnailTone?: "dark" | "light";
  hero?: boolean;
  heroPriority?: number;
  /** Builder Log only — the newest log's excerpt/thumbnail are the only
   *  ones the series card ever reads, for its featured-log block. */
  excerpt?: string;
  /** When this went live — drives the NewTag "new for 7 days" window.
   *  Falls back to `date` where absent (see isNew() in lib/publishing.ts). */
  publishedAt?: string;
  /** Renders the ComingSoonCard in the hub's episode list instead of the
   *  live episode row. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  /** Coming-soon episodes only — the category label shown on the placeholder. */
  category?: string;
  [key: string]: unknown;
}

export interface InsightCardFrontmatter {
  /** Permanent identity — do not derive from slug, does not change if the slug does. */
  id: string;
  title: string;
  description?: string;
  order: number;
  entry?: boolean;
  tags?: string[];
  thumbnail?: string;
  date?: string;
  thumbnailTone?: "dark" | "light";
  /** When this went live — drives the NewTag "new for 7 days" window.
   *  Falls back to `date` where absent (see isNew() in lib/publishing.ts). */
  publishedAt?: string;
  /** Renders the ComingSoonCard instead of the live card. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  [key: string]: unknown;
}

export type InsightMotifType = "radial" | "wave" | "lattice";

export interface InsightCollectionFrontmatter {
  /** Permanent identity — do not derive from slug, does not change if the slug does. */
  id: string;
  title: string;
  description: string;
  domain: string;
  order?: number;
  /** Generative fallback pattern for cards with no thumbnail of their own. Defaults to "radial". */
  motif?: InsightMotifType;
  /** When this went live — drives the NewTag "new for 7 days" window. */
  publishedAt?: string;
  /** Renders the ComingSoonBar in shelves instead of the live collection. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  [key: string]: unknown;
}

export interface InsightCardEntry {
  /** Card's own slug within its collection, e.g. "card_1". */
  slug: string;
  /** Permanent identity, mirrors frontmatter.id. */
  id: string;
  frontmatter: InsightCardFrontmatter;
}

export interface InsightCollection {
  slug: string;
  /** Permanent identity, mirrors frontmatter.id. */
  id: string;
  frontmatter: InsightCollectionFrontmatter;
  cards: InsightCardEntry[];
}

export interface ParsedMDX<T> {
  frontmatter: T;
  content: string;
}

export interface EpisodeInfo {
  slug: string;
  /** Permanent identity, mirrors frontmatter.id. */
  id: string;
  episode: number;
  frontmatter: EpisodeFrontmatter;
}

/* ── HELPERS ── */

async function readMDXFile<T>(filePath: string): Promise<ParsedMDX<T>> {
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    frontmatter: data as T,
    content,
  };
}

async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/* ── SERIES (Deep Dives & Builder Log) ── */

/**
 * Get the index page data for a series.
 * Reads: src/content/{type}/{slug}/index.mdx
 */
export async function getSeriesIndex(
  type: "deep-dives" | "builder-log",
  slug: string
): Promise<ParsedMDX<SeriesFrontmatter>> {
  const filePath = path.join(CONTENT_DIR, type, slug, "index.mdx");
  return readMDXFile<SeriesFrontmatter>(filePath);
}

/**
 * Get all episodes for a series, sorted by episode number.
 * Reads: src/content/{type}/{slug}/episode_*.mdx
 */
export async function getEpisodes(
  type: "deep-dives" | "builder-log",
  slug: string
): Promise<EpisodeInfo[]> {
  const seriesDir = path.join(CONTENT_DIR, type, slug);
  const files = await fs.readdir(seriesDir);

  const episodeFiles = files.filter(
    (f) => f.startsWith("episode_") && f.endsWith(".mdx")
  );

  const episodes: EpisodeInfo[] = await Promise.all(
    episodeFiles.map(async (file) => {
      const filePath = path.join(seriesDir, file);
      const { frontmatter } = await readMDXFile<EpisodeFrontmatter>(filePath);
      const episodeSlug = file.replace(".mdx", "");
      return {
        slug: episodeSlug,
        id: frontmatter.id,
        episode: frontmatter.episode,
        frontmatter,
      };
    })
  );

  return episodes.sort((a, b) => a.episode - b.episode);
}

/**
 * Get a single episode's content.
 * Reads: src/content/{type}/{slug}/{episodeSlug}.mdx
 */
export async function getEpisode(
  type: "deep-dives" | "builder-log",
  slug: string,
  episodeSlug: string
): Promise<ParsedMDX<EpisodeFrontmatter>> {
  const filePath = path.join(CONTENT_DIR, type, slug, `${episodeSlug}.mdx`);
  return readMDXFile<EpisodeFrontmatter>(filePath);
}

/**
 * List all series for a content type.
 * Returns slugs + index frontmatter.
 */
export async function getAllSeries(
  type: "deep-dives" | "builder-log"
): Promise<{ slug: string; id: string; frontmatter: SeriesFrontmatter }[]> {
  const typeDir = path.join(CONTENT_DIR, type);

  if (!(await dirExists(typeDir))) {
    return [];
  }

  const entries = await fs.readdir(typeDir, { withFileTypes: true });
  const directories = entries.filter((e) => e.isDirectory());

  const series = await Promise.all(
    directories.map(async (dir) => {
      const indexPath = path.join(typeDir, dir.name, "index.mdx");
      try {
        const { frontmatter } =
          await readMDXFile<SeriesFrontmatter>(indexPath);
        return { slug: dir.name, id: frontmatter.id, frontmatter };
      } catch {
        return null;
      }
    })
  );

  return series.filter(Boolean) as {
    slug: string;
    id: string;
    frontmatter: SeriesFrontmatter;
  }[];
}

/* ── INSIGHT CARDS ──
   Cards are grouped into collections (a set of cards on one subject, in
   order): src/content/insight-cards/{collection-slug}/index.mdx (meta) +
   card_N.mdx (cards, ordered by N). ── */

const INSIGHT_CARDS_DIR = path.join(CONTENT_DIR, "insight-cards");

/**
 * Get one collection and its cards, sorted by frontmatter.order.
 * Reads: src/content/insight-cards/{slug}/index.mdx + card_*.mdx
 */
export async function getCollection(slug: string): Promise<InsightCollection> {
  const collectionDir = path.join(INSIGHT_CARDS_DIR, slug);
  const { frontmatter } = await readMDXFile<InsightCollectionFrontmatter>(
    path.join(collectionDir, "index.mdx")
  );

  const files = await fs.readdir(collectionDir);
  const cardFiles = files.filter(
    (f) => f.startsWith("card_") && f.endsWith(".mdx")
  );

  const cards: InsightCardEntry[] = await Promise.all(
    cardFiles.map(async (file) => {
      const { frontmatter: cardFrontmatter } =
        await readMDXFile<InsightCardFrontmatter>(
          path.join(collectionDir, file)
        );
      return {
        slug: file.replace(".mdx", ""),
        id: cardFrontmatter.id,
        frontmatter: cardFrontmatter,
      };
    })
  );

  cards.sort((a, b) => (a.frontmatter.order ?? 0) - (b.frontmatter.order ?? 0));

  return { slug, id: frontmatter.id, frontmatter, cards };
}

/**
 * List all collections, sorted by frontmatter.order.
 */
export async function getCollections(): Promise<InsightCollection[]> {
  if (!(await dirExists(INSIGHT_CARDS_DIR))) {
    return [];
  }

  const entries = await fs.readdir(INSIGHT_CARDS_DIR, { withFileTypes: true });
  const directories = entries.filter((e) => e.isDirectory());

  const collections = await Promise.all(
    directories.map(async (dir) => {
      try {
        return await getCollection(dir.name);
      } catch {
        return null;
      }
    })
  );

  return (collections.filter(Boolean) as InsightCollection[]).sort(
    (a, b) => (a.frontmatter.order ?? 999) - (b.frontmatter.order ?? 999)
  );
}

/**
 * Get a single card's full content.
 * Reads: src/content/insight-cards/{collectionSlug}/{cardSlug}.mdx
 */
export async function getInsightCard(
  collectionSlug: string,
  cardSlug: string
): Promise<ParsedMDX<InsightCardFrontmatter>> {
  const filePath = path.join(INSIGHT_CARDS_DIR, collectionSlug, `${cardSlug}.mdx`);
  return readMDXFile<InsightCardFrontmatter>(filePath);
}

/**
 * Flat list of every card across every collection, slug formatted as
 * "{collectionSlug}/{cardSlug}" so existing callers building
 * `/insight-cards/${slug}` hrefs (e.g. the Deep Dive reader's sidebar)
 * keep producing valid routes without any changes on their end.
 */
export async function getAllInsightCards(): Promise<
  { slug: string; id: string; frontmatter: InsightCardFrontmatter; collectionTitle: string }[]
> {
  const collections = await getCollections();
  const cards: { slug: string; id: string; frontmatter: InsightCardFrontmatter; collectionTitle: string }[] = [];

  for (const collection of collections) {
    for (const card of collection.cards) {
      cards.push({
        slug: `${collection.slug}/${card.slug}`,
        id: card.id,
        frontmatter: card.frontmatter,
        collectionTitle: collection.frontmatter.title,
      });
    }
  }

  return cards;
}

/* ── FEATURED HERO CONTENT ── */

export interface NormalizedFeaturedContent {
  type: "series" | "episode";
  title: string;
  description: string;
  thumbnail: string;
  thumbnailTone?: "dark" | "light";
  tags?: string[];
  href: string;
  date?: string;
  heroPriority: number;
  metadataLabel: string;
}

export async function resolveReference(ref: string): Promise<NormalizedFeaturedContent | null> {
  const parts = ref.split("/");
  if (parts.length < 2) return null;

  const type = parts[0] as "deep-dives" | "builder-log" | "insight-cards";
  const slug = parts[1];
  const episodeSlug = parts[2];

  if (type === "insight-cards") {
    // "insight-cards/{collectionSlug}/{cardSlug}"
    const collectionSlug = slug;
    const cardSlug = episodeSlug;
    if (!cardSlug) return null;
    try {
      const card = await getInsightCard(collectionSlug, cardSlug);
      return {
        type: "episode",
        title: card.frontmatter.title,
        description: card.frontmatter.description || "",
        thumbnail: (card.frontmatter as any).thumbnail || "",
        thumbnailTone: card.frontmatter.thumbnailTone,
        tags: card.frontmatter.tags,
        href: `/insight-cards/${collectionSlug}/${cardSlug}`,
        date: card.frontmatter.date,
        heroPriority: 0,
        metadataLabel: `Insight Card`
      };
    } catch { return null; }
  }

  if (episodeSlug) {
    try {
      const series = await getSeriesIndex(type, slug);
      const ep = await getEpisode(type, slug, episodeSlug);
      return {
        type: "episode",
        title: ep.frontmatter.title,
        description: ep.frontmatter.description || series.frontmatter.description,
        thumbnail: ep.frontmatter.thumbnail || series.frontmatter.thumbnail || "",
        thumbnailTone: ep.frontmatter.thumbnailTone ?? series.frontmatter.thumbnailTone,
        tags: series.frontmatter.tags as string[] | undefined,
        href: `/${type}/${slug}/${episodeSlug}`,
        date: ep.frontmatter.date,
        heroPriority: ep.frontmatter.heroPriority || 0,
        metadataLabel: `Episode ${String(ep.frontmatter.episode).padStart(2, "0")} • ${series.frontmatter.title}`,
      };
    } catch { return null; }
  }

  // It's a series
  try {
    const series = await getSeriesIndex(type, slug);
    const episodes = await getEpisodes(type, slug);
    return {
      type: "series",
      title: series.frontmatter.title,
      description: series.frontmatter.description,
      thumbnail: series.frontmatter.thumbnail || "",
      thumbnailTone: series.frontmatter.thumbnailTone,
      tags: series.frontmatter.tags as string[] | undefined,
      href: `/${type}/${slug}`,
      date: series.frontmatter.date,
      heroPriority: series.frontmatter.heroPriority || 0,
      metadataLabel: `${episodes.length} Chapter${episodes.length !== 1 ? "s" : ""} • ${series.frontmatter.category || "Series"}`,
    };
  } catch { return null; }
}

interface HomepageCuration {
  hero?: { reference: string };
  mostPopular?: string[];
}

export async function getHomepageCuration(): Promise<HomepageCuration | null> {
  const filePath = path.join(CONTENT_DIR, "curation", "homepage.mdx");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data } = matter(raw);
    return data as HomepageCuration;
  } catch {
    return null;
  }
}

export async function getFeaturedContent(): Promise<NormalizedFeaturedContent | null> {
  const curation = await getHomepageCuration();
  if (curation?.hero?.reference) {
    return await resolveReference(curation.hero.reference);
  }
  return null;
}

export async function getPopularContent(): Promise<NormalizedFeaturedContent[]> {
  const curation = await getHomepageCuration();
  if (!curation?.mostPopular || !Array.isArray(curation.mostPopular)) {
    return [];
  }

  const items = await Promise.all(
    curation.mostPopular.slice(0, 4).map(ref => resolveReference(ref))
  );

  return items.filter(Boolean) as NormalizedFeaturedContent[];
}
