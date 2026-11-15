import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/utils/app.constants";

describe("sitemap", () => {
  it("lists every page on the www domain, home first", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      siteConfig.url,
      `${siteConfig.url}/impressum`,
      `${siteConfig.url}/privacy`,
    ]);
  });
});

describe("robots", () => {
  it("allows crawling and points to the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(result.rules).toEqual([{ userAgent: "*", allow: "/" }]);
  });
});
