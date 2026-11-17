# Handoff — MadnCo. hub (for Codex and other coding agents)

Read this after `AGENTS.md`. It holds the context that lives outside the repo:
what the site is for, what the design must look like, what was decided and
why, what was never verified, and what to do next.

## 1. What this is

A one-page link-in-bio hub for **MadnCo.**, a gaming/creator channel run by
**Mad** (the owner, ~90 % of streams) with his friend **Co** (~10 %, busy with
school and work); other friends drop in to game.

- Slogan: **"The duo of endless madness"** (the 💀👻 = Mad and Co; on the site
  they are drawn as a skull and a ghost, never emoji).
- Content: FIFA/FC nights, RP (roleplay servers), story mode with sarcastic
  commentary, OmeTV lives, chill streams, funny finds.
- Visitors arrive from a TikTok bio, on a phone, for a few seconds. The job of
  the page: get them into the **Discord** and to the **socials** in one tap.
- URL: `https://www.madnco.frankjordan.dev` (www is primary; the short
  `madnco.frankjordan.dev` should redirect to it in Vercel).
- English only for now. Live status comes from Twitch or the admin panel (see §5).

## 2. Design source of truth

- `docs/design/prototype-v5.html` — the approved design (v5) as a working page.
  Open it in a browser; it has the reveals, the crew select and a "Preview
  live" toggle (the toggle is a prototype-only control, not a site feature).
- `docs/design/v5-desktop-1440.png`, `docs/design/v5-phone-390.png` — full-page
  screenshots. They were rendered **without the web fonts** (fallback sans), so
  judge layout and colour from them, type from the prototype.

The React implementation must match the prototype. Where the code differs on
purpose, §5 says so.

**Visual rules (do not break them):**

- Dark ground (`ink`), two brand colours: **bordeaux = Mad / structure**,
  **turquoise = Co / actions / links**. Every colour is a token with one job:
  `THEME.md`. No new colours without adding a token there, with its contrast.
- **Shape rule: corners are cut, never rounded** (`cut`, `cut-s` utilities).
  No `rounded-*` except true dots.
- Type: Lilita One (display), Rubik (text), JetBrains Mono (labels, uppercase,
  wide tracking via `label-mono`).
- No gradients washes, no emoji icons, no stock photos, no rounded icon-card
  grids. Lists are numbered rows; cards only where they are game-like (crew
  select, side quest, case file).
- Lively but meaningful motion, see §4.

## 3. Page map

| Section (component)                 | Content                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `layout/Header`                     | Logo (skull + MADNCO.), in-page nav, "Lives on @clipzhub06", Join Discord, phone menu |
| `home/Hero`                         | Glitching MAD/n/CO. title, slogan, CTAs, game-screen with skull & ghost               |
| `home/Tapes`                        | Two crossed scrolling tapes (decorative, `aria-hidden`)                               |
| `home/Crew` → `CrewSelect` (client) | "Choose your fighter": Mad / Co / guest slot, bio, screen-time meter                  |
| `home/Activities`                   | "Pick your madness": 6 numbered rows                                                  |
| `home/DiscordBand`                  | Wine band, Discord CTA, channel preview                                               |
| `home/FindUs` (+ `SideQuest`)       | Every channel as a row; XP bar to 50 followers (TikTok LIVE minimum)                  |
| `home/CaseFile`                     | "Also by Mad": The Anime Case Files                                                   |
| `layout/Footer`                     | ENDLESS MADNESS outline sign, legal links, Pause animations, credit                   |
| `app/impressum`, `app/privacy`      | Legal pages, `noindex`, placeholders                                                  |

Facts live in `src/utils/app.constants.ts` (`siteConfig`), words in
`src/locales/en.ts`, structure in `src/components/home/*.content.ts`.

## 4. Motion

House rule: every section reveals on scroll; each element animates once.

- **Hero:** CSS only (`.hero-title` glitch + slam, `.mascot-*` bob/float + pop,
  `.animate-rise-in`), so it paints before JS.
- **Sections:** `Reveal` / `RevealGroup` / `RevealItem` from
  `src/components/ui/reveal/` (framer-motion via `LazyMotion` + `m.*`).
  Effects: `fade-up`, `pop` (spring), `slide-left`, `slide-right`, `wipe`
  (clip-path, used for every section heading), `stamp`, `draw` (lines, XP bar).
- **Scroll-scrubbed extras** (CSS scroll timelines, only where supported and
  without reduced motion): top progress bar, hero title lifting, mascots
  flying apart, tapes tilting.
- **Reduced motion:** short opacity fades, no movement; `[data-reveal]` in
  `globals.css` forces revealed content visible.
- **Pause animations** (footer, WCAG 2.2.2): `src/lib/motion/pause.ts`,
  restored before paint by the inline boot script in `layout.tsx`.
- ⚠️ Never put `overflow: hidden` on a wrapper around animated content — it
  creates a scroll container and silently breaks scroll timelines. Use
  `overflow: clip` (already on `body`). This bug cost a design round.

## 5. Decisions (and why)

- **Live status from Twitch, or set by hand in /admin.** TikTok has no public
  live status API, so it never decides. In "Auto" mode the server asks
  Twitch's Helix API (app token, cached 60 s in Redis); the admin can force
  Live or Offline. Offline, the header still says "Lives on @clipzhub06".
  The page HTML stays static and offline; `useStreamStatus` updates the
  pill, the hero button and the HUD after hydration (see
  `docs/control-room.md`).
- **Lives happen on @clipzhub06** (Mad's other TikTok, 1400 followers, can go
  live and has a clickable bio link) until **@madnco8** reaches 50 followers.
  The side quest card shows that progress from `siteConfig.madncoFollowers`
  (set by hand; `null` = unknown, shows `[...]`).
- **Placeholders are never links.** A `[...]` value in `siteConfig` renders as
  visible, unlinked text with `data-nosnippet`. A test enforces it.
- **Prototype vs code:** the prototype's Live pill and status chip now
  exist, driven by /api/stream. Offline the HUD shows no "Offline" chip
  (an "Offline" badge would be wrong while live on TikTok).
- **English only**, structured like Herzog so FR/DE can be added later with
  next-international.
- **Impressum/privacy** exist with placeholders because a German-run site
  promoting channels likely needs them; they must be legally reviewed.

## 6. State of the code — what was NOT verified

The code was written without npm access. Only these were checked:

- every `.ts/.tsx` file parses (TypeScript transpile, 0 diagnostics);
- `globals.css` compiles with Tailwind 4.3.3 and all tokens/utilities generate;
- Prettier formatting (without the Tailwind class-sorting plugin).

**Never run:** `npm install`, `tsc --noEmit`, ESLint, Jest, `next build`,
the app in a browser. Expect small type or lint errors; fix them without
changing behaviour or design.

## 7. Tasks for you, in order

1. **Make it green.** `npm install`, then `npx tsc --noEmit`, `npm run lint`,
   `npm test`, `npm run build`. Fix what fails. Fix the code, not the tests,
   unless a test encodes something wrong — then say which and why.
2. **Visual QA against the prototype** at 1440×900 and 390×844 (Playwright if
   available), plus once with `reducedMotion: "reduce"`:
   - no horizontal scroll on phone (the tapes and wide headings are the risk);
   - the crew select, phone menu (Escape closes, focus returns) and pause
     switch work;
   - headings wipe in, rows slide in, the XP bar draws, the stamp lands;
   - nothing stays invisible with reduced motion or with JS disabled above the
     fold.
     Report differences with screenshots; fix layout bugs, ask before changing
     the design.
3. **Fill facts when the owner gives them** — only in `siteConfig`, `en.ts` or
   `content/legal/provider.ts`; never guess:
   Discord invite, Twitch link + handle, YouTube link + handle, Anime Case
   Files YouTube link + one-line description, @madnco8 follower count,
   Impressum name/address/email.
4. **Lighthouse** on the production build (`npm run build && npm start`),
   mobile. Target ≥ 95 performance/accessibility/SEO. Don't measure `next dev`.

## 8. Rules for changes

- Follow `AGENTS.md` (Next 16 differences, commit format, scopes).
- Tokens only; no raw hex in components (exceptions listed in `THEME.md`).
- Server components by default; `"use client"` only for the smallest piece
  that needs it (today: `CrewSelect`, `MobileMenu`, `MotionToggle`, reveal kit,
  `InlineScript`). Follow the React Compiler rules from the coding guide (no
  refs read in render, no components inside components, no setState in effects).
- Every behaviour change gets a test next to the file.
- One logical change per commit; `npm run lint` and `npm test` green first.
- Keep diffs small; don't reformat files you aren't changing.
- Bigger design changes (new sections, colours, layout) go back to the owner
  first; small fixes (spacing, links, bugs) are fine.
- When done, say plainly what you verified and what you didn't.
