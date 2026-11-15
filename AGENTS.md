<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: MadnCo. hub

Link-in-bio hub for MadnCo. at `https://www.madnco.frankjordan.dev`.
Same stack and conventions as Herzog and the portfolio (see the coding guide).

**Start with `docs/HANDOFF.md`**: purpose, design source of truth
(`docs/design/prototype-v5.html`), decisions, what was never verified, and the
current task list.

Known differences in this codebase:

- All source lives in `src/`; the `@/*` alias points to `src/*`.
- Middleware, if ever needed, lives in `src/proxy.ts` (not `middleware.ts`).
- `params` and `searchParams` are Promises; `headers()` and `cookies()` are async.
- English only for now; no `[locale]` segment.
- Colours are theme tokens in `src/app/globals.css` (see `THEME.md`); never raw hex
  or Tailwind palette colours in components.
- Never put `overflow: hidden` on a wrapper around scroll-animated content; use
  `overflow: clip`. `hidden` creates a scroll container and breaks scroll timelines.
- Every section reveals on scroll through `src/components/ui/reveal/`; reduced
  motion must still show all content.
- Unconfirmed facts (links, handles) are `[...]` placeholders in `siteConfig`,
  never guessed.

## Commit messages

Format: [Conventional Commits](https://www.conventionalcommits.org/).

    type(scope): summary

    Body: why the change was needed.

**Header**

- `type` — one of:
  - `feat`: new behaviour for users
  - `fix`: bug fix
  - `refactor`: code change without behaviour change
  - `test`: tests only
  - `docs`: documentation only
  - `chore`: tooling, dependencies, config
- `scope` — optional, lowercase; one of `ui`, `motion`, `content`, `seo`,
  `legal`, `theme`, `deps`, `config`.
- `summary` — imperative mood ("add", not "added"), lowercase first word,
  no trailing period.
- Whole header ≤ 72 characters.

**Body** (optional; required for non-obvious changes)

- Blank line after the header; wrap at 72 characters.
- Explain why, not what — the diff shows what.

**Rules**

- One logical change per commit.
- `npm run lint` and `npm test` pass before committing.
