import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { validateContent } from "./scripts/validate-content";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async rewrites() {
    return [
      { source: "/deep-dives", destination: "/" },
      { source: "/insight-cards", destination: "/" },
      { source: "/builder-log", destination: "/" },
    ];
  },
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    // Fail the build outright if content identity (id/UUID) is broken —
    // future database engagement records depend on these ids.
    validateContent();
  }
  return nextConfig;
}
