import type { MetadataRoute } from "next";
import { routes } from "@/lib/seo/metadata";
import { siteConfig } from "@/utils/app.constants";

/** /sitemap.xml — every page, with the www URL. */
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(routes).map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : 0.2,
  }));
}
