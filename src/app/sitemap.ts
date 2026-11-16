import type { MetadataRoute } from "next";
import { indexedRoutes } from "@/lib/seo/metadata";
import { siteConfig } from "@/utils/app.constants";

/**
 * /sitemap.xml — the pages that should show up in search, with the www URL.
 * The legal pages are noindex, so they stay out: a sitemap entry would ask
 * Google to index a page its own tag tells it not to.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return indexedRoutes.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    changeFrequency: "weekly",
    priority: 1,
  }));
}
