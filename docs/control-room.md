# Control room (/admin) and OBS overlays

The admin panel at `/admin` sets the stream of the day. The website and the
OBS overlays read it from `GET /api/stream`.

## What lives where

| Piece | Path |
| --- | --- |
| Data model, validation, public view (pure, tested) | `src/lib/stream/state.ts` |
| Upstash Redis over REST (no npm package) | `src/lib/stream/redis.ts` |
| Twitch live check (Helix, app token, cached 60 s) | `src/lib/stream/twitch.ts` |
| Load / save / public status | `src/lib/stream/store.ts` |
| Password login + signed cookie (Web Crypto) | `src/lib/auth/session.ts`, `admin.ts` |
| API | `src/app/api/stream`, `src/app/api/admin/{login,logout,state}` |
| Admin UI | `src/app/admin/page.tsx`, `src/components/admin/*` |
| Admin form model, checks, change count (pure, tested) | `src/components/admin/form.ts`, `time.ts` |
| Website live bits (client, after hydration) | `src/components/live/*`, `src/lib/stream/useStreamStatus.ts` |
| OBS overlays (static HTML) + live slots | `public/overlay/*.html`, `public/overlay/live.js` |

## Environment variables (Vercel → Settings → Environment Variables)

| Name | What |
| --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Set automatically when Upstash Redis is added from the Vercel Marketplace (the older `KV_REST_API_URL`/`KV_REST_API_TOKEN` also work). |
| `ADMIN_PASSWORD` | The admin password, at least 8 characters. |
| `ADMIN_SESSION_SECRET` | Optional, long random string. Changing it signs everyone out. Defaults to the password. |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | From dev.twitch.tv → Your Console → Register Your Application (OAuth redirect `http://localhost`, category "Website Integration"). Without them, "Auto" stays offline. |
| `TWITCH_LOGIN` | Optional; defaults to the Twitch handle in `siteConfig` (`madnco8`). |

## OBS browser sources

Untick "Local file" and use the URL; size as listed.

| Scene | URL | Size |
| --- | --- | --- |
| Starting Soon | `https://www.madnco.frankjordan.dev/overlay/starting-soon.html` | 2560 × 1440 |
| BRB | `…/overlay/brb.html` | 2560 × 1440 |
| Ending | `…/overlay/ending.html` | 2560 × 1440 |
| Gaming | `…/overlay/gaming.html?cam=bl&logo=tr` | 2560 × 1440 |
| Just Chatting | `…/overlay/just-chatting.html` | 2560 × 1440 |
| Chat | `…/overlay/chat.html?channel=madnco8` | 576 × 1025 |
| Vertical | `…/overlay/v-starting-soon.html`, `v-brb`, `v-ending`, `v-gaming`, `v-just-chatting` | 1080 × 1920 |

Slots in the overlays use `data-text`, `data-show`, `data-hide` and
`data-bar` attributes; `live.js` documents them. Overlays poll every 5 s;
`/api/stream` is CDN-cached for 5 s, so many sources still cost about one
Redis read per 5 s.

## Admin panel behaviour

- Edits stay in the browser until **Save & push** (or Ctrl+S / Cmd+S). The
  bar at the bottom counts unsaved fields; leaving with unsaved changes asks
  first. **Undo changes** goes back to what is saved. **Reset all fields**
  asks once ("Sure? Tap again", 3 s), then empties topic, game, countdown and
  next stream and sets Live status to Auto; nothing goes live until Save.
- Notifications appear top right and leave after 4 s.
- Countdown: the time picker crosses out times already past today; picking
  one means tomorrow, and the panel says so in pink. A new or changed
  countdown starts counting at the save (server side), so the progress bar
  on Starting Soon starts empty.
- Next stream: past days can't be picked; a date needs a time (and the other
  way round); a new date and time that is already over can't be saved. The
  server checks the same (`saveError` in `state.ts`, HTTP 422), but only for
  *changed* times, so a stream that started ten minutes ago can still be
  saved unchanged while the topic is edited.
- On load, a countdown that ended over 30 min ago and a next stream that
  started over 2 h ago are dropped (`pruneState`), so they never come back.

## Tabs and extras (v3)

The panel has a sub navbar: **Live** (presets, live status, today, countdown,
BRB, Notify Discord), **Schedule** (next stream), **On screen** (ticker, side
quest on stream), **Side quest** (followers, goal, texts) and **Website**
(latest clip). A pink dot on a tab = unsaved changes there, red = something to
fix. One Save & push saves every tab. The **Live preview** column embeds the
real overlays (`/overlay/*.html`, saved state) with open and copy-for-OBS
links. Pure logic: `src/lib/stream/extras.ts` and `discord.ts` (tested).

- **BRB:** message + optional "back in" timer → `brb.html`, `v-brb.html`.
- **Ticker:** up to 8 lines; scenes Gaming (new strip at the bottom, cam and
  follow badge move up), Just Chatting / BRB / Starting Soon (their tapes), and
  the vertical versions (their tapes). Off = the tapes keep their own text.
- **Side quest:** follower count and goal replace the hard-coded numbers in
  `app.constants.ts` (those are now only the defaults). Website card
  (`components/home/SideQuest.tsx`) switches to "Quest complete" by itself;
  optional XP card on BRB and Starting Soon.
- **Latest clip:** TikTok video, YouTube video/Short or Twitch clip link only
  (`parseClipUrl`); homepage section `components/home/LatestClip.tsx` loads
  the third-party player only after a tap.
- **Presets:** admin only, never in `/api/stream`; kept on Reset.
- **Notify Discord:** `POST /api/admin/discord` posts a TikTok LIVE ping with
  the saved topic/game. Only the Live Ping role can be mentioned
  (`allowed_mentions`). Locked for 10 minutes per send (Redis `SET NX EX`).
  Needs `DISCORD_WEBHOOK_URL` and `DISCORD_LIVE_ROLE_ID` on Vercel.

## Not verified

Written without npm access: the pure modules (`state`, `session`, admin
`time` and `form`) pass their tests (in four time zones) and a strict
typecheck in isolation; the admin panel was bundled with esbuild against
React 19.2 and driven in Chrome with a mocked API (pickers, Ctrl+S, reset,
undo, blocked save, phone width); the overlays
were rendered with a mocked `/api/stream`, and every file transpiles. Never
run here: `npm install`, `tsc` on the whole app, ESLint, Jest, `next build`,
the admin panel in a browser, real Redis or Twitch calls.
