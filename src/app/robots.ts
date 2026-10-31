import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Sign-in, profile, bookmarks and the password pages stay crawlable on
// purpose: they carry robots noindex, which crawlers can only see if
// they're allowed to fetch the page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
