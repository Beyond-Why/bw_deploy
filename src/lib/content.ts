import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { formatDayLabel } from "./formatDate";

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
  /** Local-only: when true, the loaders treat this as missing in production
   *  (`next build` / `next start`) but show it in `next dev`. */
  draft?: boolean;
  /** Renders the ComingSoonBar in shelves instead of the live series card. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  /** Overrides description/excerpt/body for the meta description only. */
  seoDescription?: string;
  /** Deep Dives: replaces the title in <title>, og:title and twitter:title
   *  only — the title shown on the page never changes. */
  seoTitle?: string;
  /** Deep Dives: Article JSON-LD "keywords" only — never a meta tag. */
  keywords?: string[];
  /** Last meaningful revision — sitemap lastModified and JSON-LD dateModified. */
  updated?: string;
  /** Describes the thumbnail/hero image for screen readers and search.
   *  Leave unset when the image is purely decorative. */
  thumbnailAlt?: string;
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
  /** Builder Log only — marks a log on the rail, journey bar and homepage road. */
  highlight?: "breakthrough" | "milestone";
  /** Builder Log only — a video file path or a YouTube id; the cover becomes its poster. */
  video?: string;
  /** Builder Log only — the clip's length as shown on the cover chip, e.g. "0:28". */
  videoLength?: string;
  /** Builder Log only — Deep Dive series slugs shown under the log as "Explore more". */
  explore?: string[];
  /** Local-only: when true, the loaders treat this as missing in production
   *  (`next build` / `next start`) but show it in `next dev`. */
  draft?: boolean;
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
  /** Overrides description/excerpt/body for the meta description only. */
  seoDescription?: string;
  /** Deep Dives: replaces the title in <title>, og:title and twitter:title
   *  only — the title shown on the page never changes. */
  seoTitle?: string;
  /** Deep Dives: Article JSON-LD "keywords" only — never a meta tag. */
  keywords?: string[];
  /** Last meaningful revision — sitemap lastModified and JSON-LD dateModified. */
  updated?: string;
  /** Describes the thumbnail/hero image for screen readers and search.
   *  Leave unset when the image is purely decorative. */
  thumbnailAlt?: string;
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
  /** Local-only: when true, the loaders treat this as missing in production
   *  (`next build` / `next start`) but show it in `next dev`. */
  draft?: boolean;
  /** Renders the ComingSoonCard instead of the live card. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  /** Overrides description/excerpt/body for the meta description only. */
  seoDescription?: string;
  /** Last meaningful revision — sitemap lastModified and JSON-LD dateModified. */
  updated?: string;
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
  /** Local-only: when true, the loaders treat this as missing in production
   *  (`next build` / `next start`) but show it in `next dev`. */
  draft?: boolean;
  /** Renders the ComingSoonBar in shelves instead of the live collection. */
  comingSoon?: boolean;
  /** Freeform ETA shown on the coming-soon placeholder, e.g. "~1 week". */
  eta?: string;
  /** Overrides description/excerpt/body for the meta description only. */
  seoDescription?: string;
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

/** Episode engagement counts, as served by the grouped like/comment
 *  queries. The hub page keys this by episode slug; the homepage keys it
 *  by full contentId (`deep-dives/<series>/<episode>`) since it spans
 *  every series. */
export type EpisodeStats = Record<string, { likeCount: number; commentCount: number }>;

/* ── HELPERS ── */

async function readMDXFile<T>(filePath: string): Promise<ParsedMDX<T>> {
  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    frontmatter: data as T,
    content,
  };
}

/** readMDXFile, or null when the file (or a folder above it) doesn't
 *  exist — so missing content reads as "nothing here" rather than an
 *  error. Any other failure (e.g. malformed frontmatter) still throws. */
async function readMDXFileIfExists<T>(filePath: string): Promise<ParsedMDX<T> | null> {
  try {
    return await readMDXFile<T>(filePath);
  } catch (err) {
    if (isMissingPathError(err)) return null;
    throw err;
  }
}

function isMissingPathError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException | null)?.code;
  return code === "ENOENT" || code === "ENOTDIR";
}

/** Directory entries, or [] when the directory doesn't exist. */
async function readDirIfExists(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch (err) {
    if (isMissingPathError(err)) return [];
    throw err;
  }
}

/** Drafts (`draft: true`) only exist outside production — in a production
 *  build every loader below treats them exactly like missing content. */
function isHiddenDraft(frontmatter: { draft?: unknown } | undefined): boolean {
  return frontmatter?.draft === true && process.env.NODE_ENV === "production";
}

/** readMDXFileIfExists, with production-hidden drafts reading as missing. */
async function readPublishedMDXFile<T extends { draft?: unknown }>(
  filePath: string
): Promise<ParsedMDX<T> | null> {
  const parsed = await readMDXFileIfExists<T>(filePath);
  return parsed && !isHiddenDraft(parsed.frontmatter) ? parsed : null;
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
 * Get the index page data for a series, or null if it doesn't exist.
 * Reads: src/content/{type}/{slug}/index.mdx
 */
export async function getSeriesIndex(
  type: "deep-dives" | "builder-log",
  slug: string
): Promise<ParsedMDX<SeriesFrontmatter> | null> {
  const filePath = path.join(CONTENT_DIR, type, slug, "index.mdx");
  return readPublishedMDXFile<SeriesFrontmatter>(filePath);
}

/**
 * Get all episodes for a series, sorted by episode number — [] if the
 * series doesn't exist.
 * Reads: src/content/{type}/{slug}/episode_*.mdx
 */
export async function getEpisodes(
  type: "deep-dives" | "builder-log",
  slug: string
): Promise<EpisodeInfo[]> {
  const seriesDir = path.join(CONTENT_DIR, type, slug);
  const files = await readDirIfExists(seriesDir);

  const episodeFiles = files.filter(
    (f) => f.startsWith("episode_") && f.endsWith(".mdx")
  );

  const episodes = await Promise.all(
    episodeFiles.map(async (file): Promise<EpisodeInfo | null> => {
      const filePath = path.join(seriesDir, file);
      const { frontmatter } = await readMDXFile<EpisodeFrontmatter>(filePath);
      if (isHiddenDraft(frontmatter)) return null;
      const episodeSlug = file.replace(".mdx", "");
      // A Builder Log's file name IS its day: episode_40.mdx is day 40, gaps
      // and all (validate-content.js checks the frontmatter agrees).
      const day = type === "builder-log" ? dayFromSlug(episodeSlug) : null;
      return {
        slug: episodeSlug,
        id: frontmatter.id,
        episode: day ?? frontmatter.episode,
        frontmatter,
      };
    })
  );

  return episodes
    .filter((ep): ep is EpisodeInfo => ep !== null)
    .sort((a, b) => a.episode - b.episode);
}

/** "episode_40" → 40, or null when the slug carries no number. */
function dayFromSlug(episodeSlug: string): number | null {
  const match = /^episode_(\d+)$/.exec(episodeSlug);
  return match ? Number(match[1]) : null;
}

/**
 * Get a single episode's content, or null if it doesn't exist.
 * Reads: src/content/{type}/{slug}/{episodeSlug}.mdx
 */
export async function getEpisode(
  type: "deep-dives" | "builder-log",
  slug: string,
  episodeSlug: string
): Promise<ParsedMDX<EpisodeFrontmatter> | null> {
  const filePath = path.join(CONTENT_DIR, type, slug, `${episodeSlug}.mdx`);
  return readPublishedMDXFile<EpisodeFrontmatter>(filePath);
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
        if (isHiddenDraft(frontmatter)) return null;
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

/* ── BUILDER LOG ──
   One series = src/content/builder-log/{series}/index.mdx (its body is the
   optional "Meet the robot" intro) + one episode_{day}.mdx per log. Builder
   Log pages read everything through getBuilderLog() below. ── */

/** What a log's body holds, counted from its MDX source — drives the
 *  "Inside: 3 photos and a look under the hood" hint on a folded log. */
export interface BuilderLogBodySummary {
  entries: number;
  /** Gallery <Photo> children, plus 2 per <Compare>. */
  photos: number;
  /** ```mermaid blocks and diagram components. */
  diagrams: number;
  toggles: number;
}

export interface BuilderLogEntry {
  slug: string;
  /** Permanent identity, mirrors frontmatter.id. */
  id: string;
  /** Days since the build started — the episode number. */
  day: number;
  /** YYYY-MM-DD. */
  date: string;
  /** "Tue 11 Nov". */
  dateLabel: string;
  title: string;
  excerpt?: string;
  highlight?: "breakthrough" | "milestone";
  thumbnail?: string;
  thumbnailAlt?: string;
  video?: string;
  /** "0:28" — shown on the cover's duration chip. */
  videoLength?: string;
  /** Deep Dive series slugs for the "Explore more" section ([] when none). */
  explore: string[];
  /** Raw MDX body. */
  body: string;
  summary: BuilderLogBodySummary;
  frontmatter: EpisodeFrontmatter;
}

export interface BuilderLog {
  slug: string;
  /** Permanent identity, mirrors frontmatter.id. */
  id: string;
  frontmatter: SeriesFrontmatter;
  /** index.mdx body — the optional "Meet the robot" intro ("" when absent). */
  intro: string;
  /** Oldest first (ascending day). */
  logs: BuilderLogEntry[];
  /** YYYY-MM-DD of the first and newest log ("" when there are none). */
  firstDate: string;
  lastDate: string;
  /** Day number of the newest log (0 when there are none). */
  lastDay: number;
  count: number;
}

const DIAGRAM_TAGS = ["Mermaid", "Diagram"];

function countTags(source: string, tag: string): number {
  return source.match(new RegExp(`<${tag}(?=[\\s/>])`, "g"))?.length ?? 0;
}

/** Counts a body's components. Fenced code is set aside first so a
 *  `<Entry>` quoted inside a code sample isn't mistaken for a real one —
 *  except ```mermaid fences, which are diagrams in their own right. */
export function summarizeLogBody(body: string): BuilderLogBodySummary {
  // Fences may be indented when they sit inside a component like <Toggle>.
  const fences = body.match(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm) ?? [];
  const mermaidFences = fences.filter((fence) => /^\s*(```|~~~)\s*mermaid\b/.test(fence)).length;
  const source = fences.reduce((text, fence) => text.replace(fence, ""), body);

  const galleries = source.match(/<Gallery[\s\S]*?<\/Gallery>/g) ?? [];
  const galleryPhotos = galleries.reduce((sum, gallery) => sum + countTags(gallery, "Photo"), 0);

  return {
    entries: countTags(source, "Entry"),
    photos: galleryPhotos + 2 * countTags(source, "Compare"),
    diagrams: mermaidFences + DIAGRAM_TAGS.reduce((sum, tag) => sum + countTags(source, tag), 0),
    toggles: countTags(source, "Toggle"),
  };
}

/** gray-matter turns unquoted YAML dates into Date objects — normalise to YYYY-MM-DD. */
function isoDay(value: unknown): string {
  if (value instanceof Date) return isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  return typeof value === "string" ? value : "";
}

/**
 * A Builder Log series with every log, oldest first, or null if the series
 * doesn't exist (or is a draft in production).
 * Reads: src/content/builder-log/{series}/index.mdx + episode_*.mdx
 */
export async function getBuilderLog(series: string): Promise<BuilderLog | null> {
  const index = await getSeriesIndex("builder-log", series);
  if (!index) return null;

  const episodes = await getEpisodes("builder-log", series);
  const logs = (
    await Promise.all(
      episodes.map(async (ep): Promise<BuilderLogEntry | null> => {
        const parsed = await getEpisode("builder-log", series, ep.slug);
        // Zero-byte placeholder files have no title — not a log yet.
        if (!parsed || !parsed.frontmatter.title) return null;
        const { frontmatter, content } = parsed;
        const date = isoDay(frontmatter.date);
        return {
          slug: ep.slug,
          id: frontmatter.id,
          day: ep.episode,
          date,
          dateLabel: formatDayLabel(date),
          title: frontmatter.title,
          excerpt: frontmatter.excerpt,
          highlight: frontmatter.highlight,
          thumbnail: frontmatter.thumbnail,
          thumbnailAlt: frontmatter.thumbnailAlt,
          video: frontmatter.video,
          videoLength: frontmatter.videoLength,
          explore: Array.isArray(frontmatter.explore)
            ? frontmatter.explore.filter((slug): slug is string => typeof slug === "string")
            : [],
          body: content,
          summary: summarizeLogBody(content),
          frontmatter,
        };
      })
    )
  ).filter((log): log is BuilderLogEntry => log !== null);

  const first = logs[0];
  const last = logs[logs.length - 1];
  return {
    slug: series,
    id: index.frontmatter.id,
    frontmatter: index.frontmatter,
    intro: index.content.trim(),
    logs,
    firstDate: first?.date ?? "",
    lastDate: last?.date ?? "",
    lastDay: last?.day ?? 0,
    count: logs.length,
  };
}

/* ── INSIGHT CARDS ──
   Cards are grouped into collections (a set of cards on one subject, in
   order): src/content/insight-cards/{collection-slug}/index.mdx (meta) +
   card_N.mdx (cards, ordered by N). ── */

const INSIGHT_CARDS_DIR = path.join(CONTENT_DIR, "insight-cards");

/**
 * Get one collection and its cards, sorted by frontmatter.order — or null
 * if the collection doesn't exist.
 * Reads: src/content/insight-cards/{slug}/index.mdx + card_*.mdx
 */
export async function getCollection(slug: string): Promise<InsightCollection | null> {
  const collectionDir = path.join(INSIGHT_CARDS_DIR, slug);
  const index = await readPublishedMDXFile<InsightCollectionFrontmatter>(
    path.join(collectionDir, "index.mdx")
  );
  if (!index) return null;
  const { frontmatter } = index;

  const files = await readDirIfExists(collectionDir);
  const cardFiles = files.filter(
    (f) => f.startsWith("card_") && f.endsWith(".mdx")
  );

  const cards = (
    await Promise.all(
      cardFiles.map(async (file): Promise<InsightCardEntry | null> => {
        const { frontmatter: cardFrontmatter } =
          await readMDXFile<InsightCardFrontmatter>(
            path.join(collectionDir, file)
          );
        if (isHiddenDraft(cardFrontmatter)) return null;
        return {
          slug: file.replace(".mdx", ""),
          id: cardFrontmatter.id,
          frontmatter: cardFrontmatter,
        };
      })
    )
  ).filter((card): card is InsightCardEntry => card !== null);

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
 * Get a single card's full content, or null if it doesn't exist.
 * Reads: src/content/insight-cards/{collectionSlug}/{cardSlug}.mdx
 */
export async function getInsightCard(
  collectionSlug: string,
  cardSlug: string
): Promise<ParsedMDX<InsightCardFrontmatter> | null> {
  const filePath = path.join(INSIGHT_CARDS_DIR, collectionSlug, `${cardSlug}.mdx`);
  return readPublishedMDXFile<InsightCardFrontmatter>(filePath);
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
  thumbnailAlt?: string;
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
      if (!card) return null;
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
      if (!series || !ep) return null;
      return {
        type: "episode",
        title: ep.frontmatter.title,
        description: ep.frontmatter.description || series.frontmatter.description,
        thumbnail: ep.frontmatter.thumbnail || series.frontmatter.thumbnail || "",
        thumbnailAlt: ep.frontmatter.thumbnail
          ? ep.frontmatter.thumbnailAlt
          : series.frontmatter.thumbnailAlt,
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
    if (!series) return null;
    const episodes = await getEpisodes(type, slug);
    return {
      type: "series",
      title: series.frontmatter.title,
      description: series.frontmatter.description,
      thumbnail: series.frontmatter.thumbnail || "",
      thumbnailAlt: series.frontmatter.thumbnailAlt,
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
