import type { Metadata } from "next";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";

/** Every page on the site, for the sitemap. Legal pages are listed but noindex. */
export const routes = {
  home: "/",
  impressum: "/impressum",
  privacy: "/privacy",
} as const;

/**
 * Title, description, canonical and share preview for one page. Paths are
 * relative; `metadataBase` (root layout) turns them into the www URL.
 */
export function pageMetadata({
  path,
  title = en.meta.title,
  description = en.meta.description,
  index = true,
}: {
  path: string;
  title?: string;
  description?: string;
  /** `false` for pages that may be crawled but shouldn't show in results. */
  index?: boolean;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: index ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: path,
      siteName: siteConfig.name,
      title,
      description,
      locale: "en",
      images: [
        { url: "/og-image.png", width: 1200, height: 630, alt: siteConfig.slogan },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}
