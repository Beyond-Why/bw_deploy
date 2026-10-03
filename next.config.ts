import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { validateContent } from "./scripts/validate-content";
import { contentRoutes } from "./scripts/content-routes";

function buildConfig(phase: string): NextConfig {
  // Snapshotted from src/content at build time — skipped in dev so newly
  // added content works without restarting the dev server (dev falls back
  // to the routes' own notFound()/permanentRedirect(), same UI, 200 status).
  const routes =
    phase === PHASE_DEVELOPMENT_SERVER ? null : contentRoutes();

  return {
    pageExtensions: ["ts", "tsx", "md", "mdx"],
    // Resolve metadata before the first byte for every user agent, not just
    // Next's list of non-JS bots. Streamed metadata lands in <body>, where
    // crawlers ignore rel=canonical; generateMetadata here only reads a
    // couple of small MDX files, so blocking on it costs next to nothing.
    htmlLimitedBots: /.*/,
    async redirects() {
      return routes?.redirects ?? [];
    },
    async rewrites() {
      return {
        // Before route matching, so unknown slugs never reach the dynamic
        // pages (whose 404s would otherwise arrive after a 200 shell).
        beforeFiles: routes?.notFoundRewrites ?? [],
        afterFiles: [
          { source: "/deep-dives", destination: "/" },
          { source: "/insight-cards", destination: "/" },
          { source: "/builder-log", destination: "/" },
        ],
        fallback: [],
      };
    },
  };
}

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    // Fail the build outright if content identity (id/UUID) is broken —
    // future database engagement records depend on these ids.
    validateContent();
  }
  return buildConfig(phase);
}
