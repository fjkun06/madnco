import type { MetadataRoute } from "next";
import { siteConfig } from "@/utils/app.constants";

/** /robots.txt — everything may be crawled, plus the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
