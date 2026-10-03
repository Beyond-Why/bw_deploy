/* ──────────────────────────────────────────────────────────────
   Content route table for next.config.ts.

   Every content page renders inside the root loading.tsx Suspense
   boundary, so by the time a page calls notFound() or redirect() the
   200 shell has already been flushed — the visitor sees the right UI
   but the status code is lost. These config-level rules decide the
   status before rendering starts:

   - /insight-cards/{collection} → 308 to its first card.
   - Unknown series / episode / collection / card slugs → rewritten to
     a path with no route, which Next answers with a real 404.

   Built from src/content at build time, so it mirrors exactly what
   was deployed. Zero-byte placeholder files count as missing, matching
   validate-content.js and the routes themselves.
   ────────────────────────────────────────────────────────────── */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

/** No route lives here, so a rewrite to it renders app/not-found.tsx with a 404 status. */
const NOT_FOUND_PATH = "/_content-not-found";

/** File-convention routes nested under a content segment that must not be 404'd. */
const RESERVED_SEGMENTS = ["opengraph-image", "twitter-image"];

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** Frontmatter of a real (non-placeholder) MDX file, or null. */
function readEntry(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) return null;
  const { data } = matter(fs.readFileSync(filePath, "utf-8"));
  return data && data.title ? data : null;
}

function slugsWithPrefix(dir, prefix) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".mdx"))
    .map((f) => ({ slug: f.replace(/\.mdx$/, ""), data: readEntry(path.join(dir, f)) }))
    .filter((entry) => entry.data);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * path-to-regexp segment matching anything except the given values. The
 * lookahead ends at "/" or end of path — a bare "$" would only exclude
 * known slugs when they're the last segment.
 */
function anythingBut(values) {
  const alternatives = values.map(escapeRegex).join("|");
  return alternatives ? `((?!(?:${alternatives})(?:/|$))[^/]+)` : "([^/]+)";
}

function contentRoutes() {
  const notFound = [];
  const redirects = [];

  for (const type of ["deep-dives", "builder-log"]) {
    const typeDir = path.join(CONTENT_DIR, type);
    const seriesSlugs = listDirs(typeDir).filter((slug) =>
      readEntry(path.join(typeDir, slug, "index.mdx"))
    );

    // Unknown series, with or without anything after it.
    notFound.push(`/${type}/:series${anythingBut(seriesSlugs)}`);
    notFound.push(`/${type}/:series${anythingBut(seriesSlugs)}/:rest*`);

    for (const series of seriesSlugs) {
      const episodes = slugsWithPrefix(path.join(typeDir, series), "episode_").map((e) => e.slug);
      notFound.push(`/${type}/${series}/:episode${anythingBut([...episodes, ...RESERVED_SEGMENTS])}`);
    }
  }

  const insightDir = path.join(CONTENT_DIR, "insight-cards");
  const collections = listDirs(insightDir).filter((slug) =>
    readEntry(path.join(insightDir, slug, "index.mdx"))
  );
  notFound.push(`/insight-cards/:collection${anythingBut(collections)}`);
  notFound.push(`/insight-cards/:collection${anythingBut(collections)}/:rest*`);

  for (const collection of collections) {
    // Same order as getCollection() in src/lib/content.ts.
    const cards = slugsWithPrefix(path.join(insightDir, collection), "card_").sort(
      (a, b) => (a.data.order ?? 0) - (b.data.order ?? 0)
    );
    notFound.push(
      `/insight-cards/${collection}/:card${anythingBut([
        ...cards.map((c) => c.slug),
        ...RESERVED_SEGMENTS,
      ])}`
    );
    if (cards.length === 0) {
      notFound.push(`/insight-cards/${collection}`);
    } else {
      redirects.push({
        source: `/insight-cards/${collection}`,
        destination: `/insight-cards/${collection}/${cards[0].slug}`,
        permanent: true,
      });
    }
  }

  return {
    redirects,
    notFoundRewrites: notFound.map((source) => ({ source, destination: NOT_FOUND_PATH })),
  };
}

module.exports = { contentRoutes };
