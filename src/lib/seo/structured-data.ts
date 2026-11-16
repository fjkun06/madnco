import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";

/**
 * schema.org data for the home page. Tells search engines that MadnCo. is
 * one entity behind the TikTok, Twitch, YouTube and Discord profiles
 * (`sameAs`), which helps a search for "madnco" or "madnco8" show this site
 * together with those profiles.
 */
export function homeStructuredData() {
  const orgId = `${siteConfig.url}/#madnco`;
  const { links } = siteConfig;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: siteConfig.name,
        alternateName: ["MadnCo", "Mad and Co", siteConfig.handles.tiktok],
        url: siteConfig.url,
        slogan: siteConfig.slogan,
        description: en.meta.description,
        image: `${siteConfig.url}/og-image.png`,
        sameAs: [links.tiktok, links.twitch, links.youtube, links.discord],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        inLanguage: "en",
        publisher: { "@id": orgId },
      },
    ],
  };
}

/** JSON for an inline script; `<` is escaped so the data can't close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
