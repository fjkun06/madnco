/**
 * The public /build page shows the real overlays in demo mode. They are
 * served from /build/overlay/<page>: the same HTML as /overlay/<page>.html,
 * minus the Google Fonts links (the site promises no Google requests; the
 * page lends the iframe its own self-hosted fonts instead) and marked
 * noindex. live.js sees the /build/overlay/ path and waits for the page's
 * made-up status instead of reading the real one.
 */

export const DEMO_SCENES = ["gaming", "starting-soon", "brb", "ending"] as const;
export type DemoScene = (typeof DEMO_SCENES)[number];

/** Overlay pages allowed under /build/overlay/ (landscape + vertical). */
export const DEMO_PAGES: readonly string[] = DEMO_SCENES.flatMap((s) => [s, `v-${s}`]);

export function isDemoPage(value: unknown): value is string {
  return typeof value === "string" && DEMO_PAGES.includes(value);
}

/** Retro mode's pixel font, shipped with the overlays (OFL). */
const PIXEL_FONT =
  "<style>@font-face{font-family:'Silkscreen';src:url(/overlay/fonts/Silkscreen-Regular.ttf) format('truetype');font-display:swap}</style>";

/** Overlay HTML → demo HTML: no Google Fonts, noindex, pixel font local. */
export function demoOverlayHtml(html: string): string {
  return html
    .replace(/<link\b[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi, "")
    .replace(/<head>/i, `<head>\n<meta name="robots" content="noindex">\n${PIXEL_FONT}`);
}
