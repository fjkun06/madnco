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

## Shape and utilities

- `cut` / `cut-s` — the shape rule: chamfered corners, nothing rounded.
- `focus-inset` — focus ring drawn inside a clipped shape (clip-path hides
  outlines).
- `label-mono` — mono, uppercase, wide tracking.

## Intentional exceptions

- `themeColor` in `src/app/layout.tsx` and the colours in `src/app/icon.svg`
  and `public/og-image.png` are hex: browsers and image files can't read CSS
  variables.
