/* ──────────────────────────────────────────────────────────────
   Content identity validation.

   Every MDX content entity (Deep Dive series/episodes, Builder Log
   series/episodes, Insight Card collections/cards) must carry a
   permanent `id` (UUID) in its frontmatter, unique across all content.
   Future database engagement records reference this id — never the
   slug, which can change.

   Run standalone: node scripts/validate-content.js
   Also invoked from next.config.ts during `next build`.
   ────────────────────────────────────────────────────────────── */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/**
 * Every MDX file that represents a real, authored content entity.
 * Zero-byte placeholder files (scaffolding for content not yet
 * written) are skipped — they carry no title/content either, so
 * they aren't a content entity yet.
 */
function collectRequiredFiles() {
  const files = [];

  for (const type of ["deep-dives", "builder-log"]) {
    const typeDir = path.join(CONTENT_DIR, type);
    for (const seriesSlug of listDirs(typeDir)) {
      const seriesDir = path.join(typeDir, seriesSlug);
      const indexPath = path.join(seriesDir, "index.mdx");
      if (fs.existsSync(indexPath)) files.push(indexPath);
      for (const entry of fs.readdirSync(seriesDir)) {
        if (entry.startsWith("episode_") && entry.endsWith(".mdx")) {
          files.push(path.join(seriesDir, entry));
        }
      }
    }
  }

  const insightDir = path.join(CONTENT_DIR, "insight-cards");
  for (const collectionSlug of listDirs(insightDir)) {
    const collectionDir = path.join(insightDir, collectionSlug);
    const indexPath = path.join(collectionDir, "index.mdx");
    if (fs.existsSync(indexPath)) files.push(indexPath);
    for (const entry of fs.readdirSync(collectionDir)) {
      if (entry.startsWith("card_") && entry.endsWith(".mdx")) {
        files.push(path.join(collectionDir, entry));
      }
    }
  }

  return files.filter((filePath) => fs.statSync(filePath).size > 0);
}

function validateContent() {
  const files = collectRequiredFiles();
  const errors = [];
  const idToFiles = new Map();

  for (const filePath of files) {
    const rel = path.relative(process.cwd(), filePath);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);
    const id = data.id;

    if (!id || typeof id !== "string" || id.trim() === "") {
      errors.push(`Missing "id" in frontmatter: ${rel}`);
      continue;
    }
    if (!UUID_RE.test(id)) {
      errors.push(`Invalid UUID for "id" (${id}) in: ${rel}`);
      continue;
    }

    if (!idToFiles.has(id)) idToFiles.set(id, []);
    idToFiles.get(id).push(rel);
  }

  for (const [id, filesWithId] of idToFiles) {
    if (filesWithId.length > 1) {
      errors.push(`Duplicate "id" (${id}) shared by: ${filesWithId.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    const message = [
      "Content identity validation failed:",
      ...errors.map((e) => `  - ${e}`),
    ].join("\n");
    throw new Error(message);
  }

  return { fileCount: files.length, uniqueIds: idToFiles.size };
}

module.exports = { validateContent };

if (require.main === module) {
  try {
    const { fileCount, uniqueIds } = validateContent();
    console.log(
      `Content identity validation passed (${fileCount} files, ${uniqueIds} unique ids).`
    );
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
