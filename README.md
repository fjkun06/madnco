# MadnCo. hub

Link-in-bio hub for **MadnCo.** — _the duo of endless madness_.
Live at **https://www.madnco.frankjordan.dev**.

Same stack and conventions as Herzog and the portfolio: Next.js 16 (App Router,
Turbopack), React 19, TypeScript strict, Tailwind v4 theme tokens, framer-motion
(LazyMotion + `m.*`), Jest + Testing Library, ESLint + Prettier. English only.

## Run

```bash
npm install
npm run dev      # http://localhost:3008
npm run lint
npm test
npm run build && npm start
```

## Where things live

| What                               | Where                                     |
| ---------------------------------- | ----------------------------------------- |
| Handles, links, follower count     | `src/utils/app.constants.ts` (siteConfig) |
| Every word on the site             | `src/locales/en.ts`                       |
| Crew order/colours, activity order | `src/components/home/*.content.ts`        |
| Colour tokens and their jobs       | `src/app/globals.css`, `THEME.md`         |
| Reveal kit (scroll animations)     | `src/components/ui/reveal/`               |
| Pause animations                   | `src/lib/motion/pause.ts`, footer toggle  |
| Impressum / privacy facts          | `src/content/legal/provider.ts`           |
| Metadata, sitemap, robots          | `src/lib/seo/metadata.ts`, `src/app/`     |

## Updating facts

- `siteConfig.madncoFollowers` in `src/utils/app.constants.ts` — set by hand
  until @madnco8 reaches 50 (TikTok's LIVE minimum). Redeploy to update.

## Motion

- Hero: CSS only (`.hero-title`, `.mascot-*`, `.animate-rise-in`), paints at once.
- Sections: `Reveal` / `RevealGroup` / `RevealItem`, each element animates once
  when scrolled into view.
- Scroll-scrubbed extras (progress bar, hero lift, mascots splitting, tape
  tilt): CSS scroll timelines, only where supported and without reduced motion.
- Reduced motion: short fades, no movement; `[data-reveal]` CSS override keeps
  content visible. Footer "Pause animations" stops the loops (WCAG 2.2.2).
- Never `overflow: hidden` on a wrapper around animated content — use `clip`.
