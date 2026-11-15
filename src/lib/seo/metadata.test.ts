import { en } from "@/locales/en";
import { pageMetadata } from "./metadata";

describe("pageMetadata", () => {
  it("defaults to the site title and description with a canonical path", () => {
    const meta = pageMetadata({ path: "/" });
    expect(meta.title).toBe(en.meta.title);
    expect(meta.description).toBe(en.meta.description);
    expect(meta.alternates?.canonical).toBe("/");
    expect(meta.robots).toBeUndefined();
  });

  it("keeps noindex pages crawlable", () => {
    expect(pageMetadata({ path: "/impressum", index: false }).robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("shares the static OG image", () => {
    const og = pageMetadata({ path: "/" }).openGraph as { images: { url: string }[] };
    expect(og.images[0].url).toBe("/og-image.png");
  });
});
