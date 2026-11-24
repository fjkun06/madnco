import { DEMO_PAGES, demoOverlayHtml, isDemoPage } from "./demoOverlay";

describe("demo overlays", () => {
  it("allows the four scenes on both canvases only", () => {
    expect(DEMO_PAGES).toEqual([
      "gaming",
      "v-gaming",
      "starting-soon",
      "v-starting-soon",
      "brb",
      "v-brb",
      "ending",
      "v-ending",
    ]);
    expect(isDemoPage("v-brb")).toBe(true);
    expect(isDemoPage("chat")).toBe(false);
    expect(isDemoPage("../admin")).toBe(false);
    expect(isDemoPage(undefined)).toBe(false);
  });

  it("drops every Google Fonts link and marks the page noindex", () => {
    const html = `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lilita+One&amp;display=swap" rel="stylesheet">
<link href="/overlay/play.css" rel="stylesheet">
</head><body><script src="/overlay/live.js" defer></script></body></html>`;
    const out = demoOverlayHtml(html);
    expect(out).not.toContain("fonts.googleapis.com");
    expect(out).not.toContain("fonts.gstatic.com");
    expect(out).toContain('href="/overlay/play.css"');
    expect(out).toContain('src="/overlay/live.js"');
    expect(out).toContain('<meta name="robots" content="noindex">');
    expect(out).toContain("/overlay/fonts/Silkscreen-Regular.ttf");
  });
});
