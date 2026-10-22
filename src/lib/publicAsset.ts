import "server-only";

import fs from "fs/promises";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

// Content is only rebuilt on deploy, so a file's presence can't change
// while the server is up — except in dev, where files get dropped in
// mid-session, so dev always re-checks.
const cache = new Map<string, boolean>();

/**
 * Whether a site-relative asset path ("/content/…/day-4.png") exists under
 * public/. Lets media components show a quiet placeholder for files that
 * haven't been made yet instead of a broken image. Anything that isn't a
 * root-relative path (e.g. a full URL) is assumed to exist.
 */
export async function publicFileExists(src: string): Promise<boolean> {
  if (!src.startsWith("/") || src.startsWith("//")) return true;

  const cached = process.env.NODE_ENV === "production" ? cache.get(src) : undefined;
  if (cached !== undefined) return cached;

  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(src.split(/[?#]/)[0]));
  let exists = false;
  // Never look outside public/, whatever the path says.
  if (filePath.startsWith(PUBLIC_DIR + path.sep)) {
    try {
      exists = (await fs.stat(filePath)).isFile();
    } catch {
      exists = false;
    }
  }
  cache.set(src, exists);
  return exists;
}
