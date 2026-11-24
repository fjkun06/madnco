import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/utils/app.constants";

describe("sitemap", () => {
  // The legal pages are noindex, so listing them would send mixed signals.
  it("lists only the indexable pages on the www domain", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([siteConfig.url, `${siteConfig.url}/build`]);
  });
});

describe("robots", () => {
  it("allows crawling except the tools, and points to the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(result.rules).toEqual([
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/overlay/", "/build/overlay/"] },
    ]);
  });
});
