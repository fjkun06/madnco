# THEME — MadnCo. colour tokens

All colours live in `src/app/globals.css` (`@theme`). Components use the token
classes (`bg-ink`, `text-tq`, `border-ink-3` …), never raw hex or Tailwind
palette colours. A re-skin is a token change.

The two brand colours are the two tones of the cap: **bordeaux = Mad and the
page's structure**, **turquoise = Co, the crew, links and "go" actions**.

| Token          | Phone → desktop | Used for                           |
| -------------- | --------------- | ---------------------------------- |
| `text-hero`    | 76 → 200 px     | MAD n CO. (one line until 1023 px) |
| `text-section` | 40 → 96 px      | Section headings                   |
| `text-band`    | 48 → 128 px     | Join the madness.                  |
| `text-row`     | 26 → 68 px      | Activity titles                    |
| `text-bio`     | 38 → 72 px      | Crew bio name                      |
| `text-card`    | 22 → 44 px      | Crew card names                    |
| `text-panel`   | 32 → 54 px      | Case file title                    |
| `text-quest`   | 28 → 44 px      | Side quest title                   |
| `text-handle`  | 24 → 40 px      | Link handles                       |
| `text-lead`    | 17 → 28 px      | Hero slogan                        |
| `text-tape`    | 17 → 34 px      | Tape words                         |
| `text-body-lg` | 15 → 19 px      | Bio and case file text             |
| `px-gutter`    | 16 → 48 px      | Page side padding (never 0)        |
| `py-section`   | 44 → 96 px      | Section padding                    |
| `py-band`      | 44 → 110 px     | Discord band padding               |

The phone values are the compact v6 phone design; the desktop values are v5.
Buttons are 48 px tall with 11 px labels on phones, 56 px / 15 px from `sm`.

Layouts change at Tailwind's breakpoints, where the content needs it:

- below `sm` (phones): compact v6 sizes; hero buttons side by side; Join
  Discord stays in the header next to the menu button.
- `sm` (640): full-size buttons, labels and chips.
- `md` (768): "Lives on @clipzhub06" pill in the header; link rows get their
  3-column layout.
- `lg` (1024): full nav; two-column hero (title stacked MAD / n / CO.), crew,
  Discord band and Find us; section notes beside their headings; crew
  parallax.
- `xl` (1280): four-column activity rows (title, text and tag side by side).

The footer's ENDLESS MADNESS sign is SVG text with `textLength`, so it always
spans the full content width from `md` (one line); on phones it is two lines
at 80 % width.

Don't name a font-size token after an existing utility class: `--text-outline`
once generated `text-outline` and clashed with a style of that name.

## Shape and utilities

- `cut` / `cut-s` — the shape rule: chamfered corners, nothing rounded.
- `focus-inset` — focus ring drawn inside a clipped shape (clip-path hides
  outlines).
- `label-mono` — mono, uppercase, wide tracking.

## Intentional exceptions

- `themeColor` in `src/app/layout.tsx` and the colours in `src/app/icon.svg`
  and `public/og-image.png` are hex: browsers and image files can't read CSS
  variables.
