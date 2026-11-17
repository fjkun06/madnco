import type { MetadataRoute } from "next";
import { siteConfig } from "@/utils/app.constants";

/**
 * /robots.txt — the hub may be crawled, plus the sitemap. The admin panel,
 * the API and the OBS overlays are tools, not pages, so crawlers skip them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/overlay/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
