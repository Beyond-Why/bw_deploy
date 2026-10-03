import type { Metadata } from "next";

/* ──────────────────────────────────────────────────────────────
   SEO helpers — the one place the site URL is read, plus builders
   for per-page metadata and JSON-LD so route files stay short.
   ────────────────────────────────────────────────────────────── */

export const SITE_NAME = "Beyond Why";

export const SITE_DESCRIPTION =
  "Serialized intellectual journeys, insight cards, and builder logs. Exploring ideas beyond the surface.";

export const SITE_LOCALE = "en_US";

/** Absolute origin, no trailing slash. Set NEXT_PUBLIC_SITE_URL per environment. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://beyondwhy.org").replace(
  /\/+$/,
  ""
);

/** Logo used for the Organization publisher (ink variant reads on white, which is where search results show it). */
export const LOGO_PATH = "/logo/apertures-ink-512.png";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ── DESCRIPTIONS ── */

const DESCRIPTION_MAX = 155;
/** When falling back to the body, keep adding paragraphs until there's at least this much text. */
const BODY_MIN = 100;

function nonEmpty(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** Plain-text paragraphs of an MDX body, with markdown, JSX/HTML and LaTeX removed. */
function proseParagraphs(body: string): string[] {
  const stripped = body
    .replace(/```[\s\S]*?```/g, "\n\n")
    .replace(/\$\$[\s\S]*?\$\$/g, "\n\n")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "\n\n")
    // JSX components (capitalised tags), self-closing or with children
    .replace(/<([A-Z][\w.]*)\b[^>]*\/>/g, "\n\n")
    .replace(/<([A-Z][\w.]*)\b[^>]*>[\s\S]*?<\/\1>/g, "\n\n")
    .replace(/^\s*(import|export)\s.*$/gm, "");

  const paragraphs: string[] = [];
  for (const block of stripped.split(/\n\s*\n/)) {
    const trimmed = block.trim();
    // Headings, lists, tables, rules and leftover markup aren't prose.
    if (!trimmed || /^(#|[-*+] |\d+\. |\||---|\[.*\]\s*$|<)/.test(trimmed)) continue;
    const text = trimmed
      .replace(/^>\s?/gm, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\$[^$\n]+\$/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/(\*\*|__|\*|_|~~)(?=\S)([\s\S]*?\S)\1/g, "$2")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

function truncate(text: string, max = DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-—–]+$/, "")}…`;
}

/**
 * First non-empty of seoDescription, description, excerpt, then the
 * opening prose of the body — trimmed to ~155 characters on a word boundary.
 */
export function metaDescription(
  frontmatter: { seoDescription?: unknown; description?: unknown; excerpt?: unknown } | undefined,
  body?: string
): string | undefined {
  const fromFrontmatter =
    nonEmpty(frontmatter?.seoDescription) ??
    nonEmpty(frontmatter?.description) ??
    nonEmpty(frontmatter?.excerpt);
  if (fromFrontmatter) return truncate(fromFrontmatter.replace(/\s+/g, " "));

  if (!body) return undefined;
  let text = "";
  for (const paragraph of proseParagraphs(body)) {
    text = text ? `${text} ${paragraph}` : paragraph;
    if (text.length >= BODY_MIN) break;
  }
  return text ? truncate(text) : undefined;
}

/* ── PUBLISHING STATE ── */

interface PublishableFrontmatter {
  title?: unknown;
  comingSoon?: unknown;
  publishedAt?: unknown;
  date?: unknown;
  updated?: unknown;
}

/** gray-matter turns unquoted YAML dates into Date objects; quoted ones stay strings. */
export function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  if (typeof value === "string" && value.trim() !== "") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

/** Zero-byte placeholder MDX files parse to empty frontmatter — no title. */
export function isPlaceholder(frontmatter: PublishableFrontmatter | undefined): boolean {
  return !nonEmpty(frontmatter?.title);
}

/**
 * Not yet released: flagged comingSoon (what the shelves and hub use to
 * swap in a placeholder), or a publishedAt that's still in the future.
 * Any of the given frontmatters (e.g. series + episode) can make it unreleased.
 */
export function isUnreleased(
  ...frontmatters: (PublishableFrontmatter | undefined)[]
): boolean {
  const now = Date.now();
  return frontmatters.some((fm) => {
    if (!fm) return false;
    if (fm.comingSoon === true || isPlaceholder(fm)) return true;
    const publishedAt = toDate(fm.publishedAt);
    return !!publishedAt && publishedAt.getTime() > now;
  });
}

export function publishedDate(fm: PublishableFrontmatter): Date | undefined {
  return toDate(fm.publishedAt) ?? toDate(fm.date);
}

export function modifiedDate(fm: PublishableFrontmatter): Date | undefined {
  return toDate(fm.updated) ?? publishedDate(fm);
}

/* ── METADATA ── */

/** For sign-in, profile and other private pages. */
export const NOINDEX: Metadata["robots"] = { index: false, follow: true };

interface PageMetadataInput {
  /** Bare title — the root layout's template appends " — Beyond Why". */
  title: string;
  description?: string;
  /** Clean path, no query string. Used for canonical and og:url. */
  path: string;
  type?: "website" | "article";
  publishedTime?: Date;
  modifiedTime?: Date;
  tags?: string[];
  section?: string;
  noindex?: boolean;
}

/**
 * Title, description, canonical, Open Graph and Twitter tags for a content
 * page. og/twitter images come from the route's opengraph-image file.
 * openGraph is re-stated in full because Next replaces nested metadata
 * objects rather than merging them with the root layout's.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  tags,
  section,
  noindex,
}: PageMetadataInput): Metadata {
  const openGraph: NonNullable<Metadata["openGraph"]> =
    type === "article"
      ? {
          type: "article",
          title,
          description,
          url: path,
          siteName: SITE_NAME,
          locale: SITE_LOCALE,
          publishedTime: publishedTime?.toISOString(),
          modifiedTime: modifiedTime?.toISOString(),
          tags: tags && tags.length > 0 ? tags : undefined,
          section,
        }
      : { type: "website", title, description, url: path, siteName: SITE_NAME, locale: SITE_LOCALE };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph,
    twitter: { card: "summary_large_image", title, description },
    ...(noindex ? { robots: NOINDEX } : {}),
  };
}

/* ── JSON-LD ── */

type JsonLdObject = Record<string, unknown>;

export function organizationJsonLd(withContext = false): JsonLdObject {
  return {
    ...(withContext ? { "@context": "https://schema.org" } : {}),
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl(LOGO_PATH), width: 512, height: 512 },
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

interface ArticleJsonLdInput {
  headline: string;
  description?: string;
  path: string;
  images: (string | undefined)[];
  datePublished?: Date;
  dateModified?: Date;
  keywords?: string[];
  position?: number;
  partOf: { name: string; path: string };
}

export function articleJsonLd({
  headline,
  description,
  path,
  images,
  datePublished,
  dateModified,
  keywords,
  position,
  partOf,
}: ArticleJsonLdInput): JsonLdObject {
  const organization = organizationJsonLd();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image: images.filter(Boolean).map((src) => absoluteUrl(src as string)),
    datePublished: datePublished?.toISOString(),
    dateModified: (dateModified ?? datePublished)?.toISOString(),
    author: organization,
    publisher: organization,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
    url: absoluteUrl(path),
    inLanguage: "en",
    keywords: keywords && keywords.length > 0 ? keywords.join(", ") : undefined,
    position,
    isPartOf: { "@type": "CreativeWorkSeries", name: partOf.name, url: absoluteUrl(partOf.path) },
  };
}

interface SeriesJsonLdInput {
  name: string;
  description?: string;
  path: string;
  image?: string;
  parts: { headline: string; path: string; position: number }[];
}

export function seriesJsonLd({ name, description, path, image, parts }: SeriesJsonLdInput): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name,
    description,
    url: absoluteUrl(path),
    image: image ? absoluteUrl(image) : undefined,
    inLanguage: "en",
    publisher: organizationJsonLd(),
    hasPart: parts.map((part) => ({
      "@type": "Article",
      headline: part.headline,
      url: absoluteUrl(part.path),
      position: part.position,
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** JSON for a <script type="application/ld+json">, with "<" escaped so content can't close the tag. */
export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
