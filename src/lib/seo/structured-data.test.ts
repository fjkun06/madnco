import { siteConfig } from "@/utils/app.constants";
import { homeStructuredData, serializeJsonLd } from "./structured-data";

describe("homeStructuredData", () => {
  const [org, site] = homeStructuredData()["@graph"];

  it("links the site to every social profile", () => {
    expect(org["@type"]).toBe("Organization");
    expect(org.url).toBe(siteConfig.url);
    expect(org.sameAs).toEqual([
      siteConfig.links.tiktok,
      siteConfig.links.twitch,
      siteConfig.links.youtube,
      siteConfig.links.discord,
    ]);
  });

  it("names the organization as the site's publisher", () => {
    expect(site.publisher).toEqual({ "@id": org["@id"] });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the data can't end the script early", () => {
    expect(serializeJsonLd({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });
});
