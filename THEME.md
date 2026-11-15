# THEME — MadnCo. colour tokens

All colours live in `src/app/globals.css` (`@theme`). Components use the token
classes (`bg-ink`, `text-tq`, `border-ink-3` …), never raw hex or Tailwind
palette colours. A re-skin is a token change.

The two brand colours are the two tones of the cap: **bordeaux = Mad and the
page's structure**, **turquoise = Co, the crew, links and "go" actions**.

| Token         | Hex       | Job                                                        |
| ------------- | --------- | ---------------------------------------------------------- |
| `ink`         | `#110a0c` | Page ground; text on turquoise and paper                   |
| `ink-2`       | `#1b1014` | Panels: game screen, crew bio, side quest, channel rows    |
| `ink-3`       | `#26161c` | Chips, row dividers, ghost buttons, menu button            |
| `line`        | `#4a3940` | Outlines: guest slot, footer outline text                  |
| `off`         | `#6e5a62` | Reserved for an offline state                              |
| `bordeaux`    | `#800020` | Mad, row hover, button shadow — **fills only**             |
| `wine`        | `#4a0818` | Discord band ground                                        |
| `bordeaux-hi` | `#e8557a` | Bordeaux as text or mascot on dark (section labels, skull) |
| `tq`          | `#30d5c8` | Co, primary buttons, accent words, links, progress bar     |
| `tq-deep`     | `#23a99e` | Stripes inside the XP bar                                  |
| `paper`       | `#f4efe6` | Main text on dark; case file ground                        |
| `paper-2`     | `#e7dfd1` | Case file left panel                                       |
| `case-ink`    | `#3a2a30` | Body text on paper                                         |
| `muted`       | `#bbaab1` | Secondary text on dark                                     |
| `live`        | `#ff4d4d` | Live/ping badges and the lives icon only                   |

## Contrast (WCAG 2.2 AA)

Pairs used for text, computed with the WCAG 2.x relative-luminance formula:

| Text on ground          | Ratio  |
| ----------------------- | ------ |
| `paper` on `ink`        | 17.1:1 |
| `paper` on `ink-2`      | 16.2:1 |
| `paper` on `ink-3`      | 15.1:1 |
| `muted` on `ink`        | 8.9:1  |
| `muted` on `ink-2`      | 8.4:1  |
| `muted` on `ink-3`      | 7.8:1  |
| `tq` on `ink`           | 10.7:1 |
| `tq` on `ink-2`         | 10.1:1 |
| `tq` on `ink-3`         | 9.5:1  |
| `bordeaux-hi` on `ink`  | 5.6:1  |
| `ink` on `tq`           | 10.7:1 |
| `ink` on `paper`        | 17.1:1 |
| `paper` on `bordeaux`   | 9.5:1  |
| `paper` on `wine`       | 13.7:1 |
| `ink` on `live`         | 6.0:1  |
| `case-ink` on `paper`   | 11.8:1 |
| `bordeaux` on `paper-2` | 8.2:1  |

All pass 4.5:1. `bordeaux` itself is never used as text on dark grounds (too low); use
`bordeaux-hi`.

## Fonts

`next/font/google`, self-hosted at build time (no request to Google from
visitors), mapped in `@theme inline`:

- `font-display` — Lilita One: headings, big numbers, handles
- `font-sans` — Rubik: body text
- `font-mono` — JetBrains Mono: labels (`label-mono` utility), tags, numbers

## Responsive system

Nothing is sized for one screen. Type and spacing are fluid tokens in
`@theme` (`globals.css`): each grows smoothly from the phone design (390 px)
to the desktop design (1440 px) with `clamp()`, in `rem` so browser font
settings still scale them.

| Token          | Phone → desktop | Used for                    |
| -------------- | --------------- | --------------------------- |
| `text-hero`    | 88 → 200 px     | MAD n CO.                   |
| `text-section` | 48 → 96 px      | Section headings            |
| `text-band`    | 60 → 128 px     | Join the madness.           |
| `text-row`     | 36 → 68 px      | Activity titles             |
| `text-sign`    | 56 → 144 px     | Footer ENDLESS MADNESS      |
| `text-bio`     | 52 → 72 px      | Crew bio name               |
| `text-card`    | 26 → 44 px      | Crew card names             |
| `text-panel`   | 40 → 54 px      | Case file title             |
| `text-quest`   | 36 → 44 px      | Side quest title            |
| `text-handle`  | 32 → 40 px      | Link handles                |
| `text-lead`    | 22 → 28 px      | Hero slogan                 |
| `text-tape`    | 24 → 34 px      | Tape words                  |
| `px-gutter`    | 20 → 48 px      | Page side padding (never 0) |
| `py-section`   | 64 → 96 px      | Section padding             |
| `py-band`      | 72 → 110 px     | Discord band, footer top    |

Layouts change at Tailwind's breakpoints, where the content needs it:

- `sm` (640): hero buttons side by side; game screen goes wide (16:10).
- `md` (768): Join Discord in the header; link rows get their 3-column layout.
- `lg` (1024): full nav; two-column hero, crew, Discord band and Find us;
  section notes beside their headings.
- `xl` (1280): four-column activity rows (title, text and tag side by side).

Don't name a font-size token after an existing utility class: `--text-outline`
once generated `text-outline` and clashed with the stroke style of that name.

## Shape and utilities

- `cut` / `cut-s` — the shape rule: chamfered corners, nothing rounded.
- `focus-inset` — focus ring drawn inside a clipped shape (clip-path hides
  outlines).
- `label-mono` — mono, uppercase, wide tracking.

## Intentional exceptions

- `themeColor` in `src/app/layout.tsx` and the colours in `src/app/icon.svg`
  and `public/og-image.png` are hex: browsers and image files can't read CSS
  variables.
