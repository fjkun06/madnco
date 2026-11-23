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
| Stream log (numbers per stream, charts) | `src/lib/stream/streamLog.ts`, `streamLogStore.ts`, `src/app/api/admin/streamlog`, `src/components/admin/tabs/StreamLogTab.tsx`, `streamlog/charts.tsx` |

## Environment variables (Vercel → Settings → Environment Variables)

| Name | What |
| --- | --- |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Set automatically when Upstash Redis is added from the Vercel Marketplace (the older `KV_REST_API_URL`/`KV_REST_API_TOKEN` also work). |
| `ADMIN_PASSWORD` | The admin password, at least 8 characters. |
| `ADMIN_SESSION_SECRET` | Optional, long random string. Changing it signs everyone out. Defaults to the password. |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | From dev.twitch.tv → Your Console → Register Your Application (OAuth redirect `http://localhost`, category "Website Integration"). Without them, "Auto" stays offline. |
| `TWITCH_EVENTSUB_SECRET` | Optional, 10–100 random characters. Twitch follow alerts (see Founding 50). |
| `DECK_KEY` | Optional, 24+ random characters. Lets Stream Deck keys change the game counters (`/api/deck`). |
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
`data-bar` attributes; `live.js` documents them. Overlays poll every 2 s
while OBS shows them (every 30 s while hidden, via the `obsSourceVisibleChanged`
event); `/api/stream` is CDN-cached for 3 s (no stale-while-revalidate), so all
sources together cost at most one run (~5 Redis commands) per 3 s: ~6,000
commands per streaming hour, ~70 h/month inside Upstash's free 500K. A tap
shows on stream in ~3–5 s.

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

## Game modes (v4)

The **Games** tab holds one profile per game (28 installed games to start)
and picks the game that is on stream.

- **Profile** (saved with *Save & push*): name, mood (football · horror ·
  action · story · retro), part label (Part, Ep, Day…) and whether the part
  chip shows, goal line, "Previously on…" line, stats box (counters,
  scoreboard, Chat decides, none), up to 2 counters with an optional total
  ("4 / 16"), poll, up to 4 extra ticker lines, FINAL badge, Completed.
- **Live numbers** (part, counters, W/D/L, goals, hours) save instantly in
  their own Redis hash per game (`madnco:game:<id>`), so the Stream Deck and
  the admin form never overwrite each other. Reset numbers sets part 1 and
  everything else to 0.
- **Overlays**: `gaming` / `v-gaming` show the title card and stats box in the
  game's mood colours (`/overlay/play.css`); `starting-soon` shows "Up next /
  Previously", `ending` "Survived Part N" or "Completed", `brb` takes the mood
  colour. With no game on stream everything looks like v3.
- **Chat decides**: while the poll is open the gaming overlays read Twitch
  chat anonymously and count `!1`–`!4` (one vote per viewer, last one counts).
  Opening the poll again starts a new count. Add `?channel=name` to the
  overlay URL for another channel.
- **Website**: "Now playing" uses the current game; finished series appear in
  the **Completed** section of the homepage.

### Stream Deck counters

Set `DECK_KEY` in Vercel (any random string, 24+ characters, e.g.
`openssl rand -hex 24`). Then per key: **System → Website**, tick
**GET request in background**, URL

```
https://www.madnco.frankjordan.dev/api/deck?key=DECK_KEY&do=c1+
```

| `do=` | Effect on the game on stream |
| --- | --- |
| `c1+` `c1-` | first counter (e.g. Deaths) |
| `c2+` `c2-` | second counter |
| `part+` `part-` | next / previous part |
| `w` `d` `l` | add a win / draw / loss |
| `gf` `ga` (`gf-` `ga-`) | goal for / against |
| `hour+` `hour-` | hours played |

Answers are plain text (`ok c1=15`, `no game on stream`, `unauthorized`).
120 presses a minute max. Keep the key private: anyone with the URL can count.

## Remote, Home / Guest, Co tonight (v5)

- **Remote** (`/admin/remote`, button "Remote ↗" in the control room): one
  page for a laptop, tablet or phone while streaming. Big +/− for the game's
  counters (or W/D/L and goals), next part, ±1 h, game on stream, BRB "back
  in 5/10" and clear, ticker on Gaming, FINAL badge, poll open/close, Co
  tonight, Home/Guest. Every tap is live in ~3–5 s, no Save. Counters, part and
  hours have Undo. It refreshes itself every 10 s.
- Taps go to `POST /api/admin/quick` (one change, applied to the saved state
  on the server), so they never overwrite other fields. If the control room
  form was loaded before a Remote tap, its Save is refused (409 "stale"): the
  panel loads the latest state and asks you to redo the edit.
- **Where are we live?** (Live tab): Home = @madnco8, Guest = a borrowed
  channel, set separately for landscape (Twitch + YouTube) and vertical
  (TikTok). In Guest mode the overlays (`/overlay/guest.css`) show:
  - Gaming: "Guest on @…" tag under the logo, the "Our home is @madnco8"
    card instead of the Follow toast (peeks in every 2 min), GUEST ticker label
    and a guest line in the ticker; vertical: "On @…" chip and a pinned follow
    card with the followers still needed.
  - Starting Soon: full "This channel got hijacked" takeover (case file with
    the side-quest progress). Ending: "Next time at home?".
  - Website: the Live button links to the guest YouTube channel; the header
    pill links to the guest TikTok account.
- **Co tonight** (Live tab): Solo (slot open) or a name from the roster (new
  names join it; Courinho is the OG Co). Shows as "CO · name" next to "MAD P1"
  on Gaming (both canvases), "CO · SLOT OPEN" on solo nights.
- Rebrand: slogan "Madness loves company." on the site, tapes and Ending.

## The Founding 50, follow alerts, welcomes (v6)

The first 50 followers of @madnco8 are **founders**: their name goes on the
Founders Wall (homepage, shows once there is one), rolls in the Ending
credits, and plays a follow alert on stream ("New in the fam · Founder #28").
First-time chatters get a welcome strip. Alerts play one at a time in the
alert lane (landscape: along the top, beside the cam; vertical: the tape
slot) on Gaming and Just Chatting.

Control room → **Fans** tab: connections, the wall (add / remove), test
buttons. The **Remote** has a "New follower · shout out" tile.

| Source | Follow alert | Welcome |
| --- | --- | --- |
| Twitch | automatic, with name (EventSub webhook) | automatic, from chat (`first-msg`), landscape scenes |
| YouTube | Remote shout-out or added after the stream (automatic left out for now) | not yet |
| TikTok | Remote shout-out or added after the stream (the official API only gives the count) | not available |

Founders are stored in Redis (`madnco:founders`, plus a name set so nobody
is added twice), alerts in `madnco:alerts` (last 20; overlays only play ones
from the last 2 minutes, so reopening a scene doesn't replay old ones).

To hear every chat and event while playing (all platforms, only in your
headphones), use Social Stream Ninja's TTS; keep its audio off the stream.

### Set up Twitch follow alerts

1. Vercel → env: `TWITCH_EVENTSUB_SECRET` = a random string, 10–100
   characters (`openssl rand -hex 32`). Redeploy.
2. dev.twitch.tv → Console → your app → OAuth Redirect URLs → add
   `https://www.madnco.frankjordan.dev/api/admin/twitch/callback`.
3. /admin → Fans → Twitch → **Connect**, log in as madnco8, allow. Back on
   the Fans tab it says "waiting for Twitch to confirm", then "follow alerts on".

### Share links with game pictures (v7)

Share `https://www.madnco.frankjordan.dev/live/tiktok` (or `/live/twitch`,
`/live/youtube`, or just `/live` = Twitch / guest YouTube) instead of the
platform link. The page (`src/app/live/[[...platform]]/route.ts`, logic in
`src/lib/stream/share.ts`) answers with Open Graph tags — the game's picture,
"🔴 LIVE: <goal>", part + counters — and forwards people to the live with a
meta refresh. Crawlers (WhatsApp, Discord, iMessage, X) read the tags; people
never see the page.

Pictures: Games tab → Share link → **Choose screenshot** (your own gameplay
shot, e.g. the SHOT key). The browser makes four 1200×630 JPEGs (LIVE on
TikTok / Twitch / YouTube, and offline), each under ~240 KB: Meta's limit is 600 KB, but
WhatsApp only shows the big preview reliably under ~300 KB. **Upload picture** stores them on Vercel
Blob (`/api/admin/art`), then **Save & push**. No picture = the site's
`og-image.png`. The **Copy … link** buttons add `?s=…` so chat apps fetch a
fresh preview each time.

One-time setup:
1. `npm install @vercel/blob` (adds it to package.json).
2. Vercel → project → **Storage** tab → **Create Storage** → **Blob** →
   **Continue** → access **Public**, connect it to the project in all
   environments. Vercel adds `BLOB_STORE_ID` (OIDC; older stores:
   `BLOB_READ_WRITE_TOKEN`). Redeploy.

### Realtime overlays (Ably, v7)

Optional, free (Ably Free: 6M messages/month, 200 connections). After every
change (Remote, Games tab counters, Save & push, quick ops, Stream Deck, Fans
tab, Twitch follows) the server publishes the public status to the Ably
channel `madnco-stream` (`src/lib/stream/realtime.ts`, run with `after()`).
`/api/stream` adds `realtime: { key, channel }` (the subscribe-only key);
`live.js` opens Ably's SSE stream with it and redraws on every push
(~0.5 s). Polling stays as a backup every 30 s (2 s while Ably isn't
connected). Without the env vars nothing changes.

Setup:
1. ably.com → sign up (free) → **Create new app** ("madnco").
2. App → **API Keys**: copy the **Root** key (`appId.keyId:secret`) →
   Vercel env `ABLY_API_KEY`. Secret: server only.
3. **Create new API key** "overlays": capability **Subscribe** only,
   resource restriction: selected channels → `madnco-stream`. Copy it →
   Vercel env `ABLY_SUBSCRIBE_KEY` (public on purpose: it can only listen).
4. Redeploy, then refresh the OBS browser sources.

### Stream log (v7)

Control Room → **Stream log**. One entry per stream, saved in Upstash (hash
`madnco:streamlog`, one read per page open, one write per save; no extra
Vercel or Ably cost).

- **Log a stream**: date (past days only), start and end (an end before the
  start means the stream ran past midnight; the duration is worked out),
  game (pick from the library or type), part, co, then per platform the
  numbers from each platform's stream summary: peak, average and unique
  viewers, comments, new followers, followers now. Leave a box empty when a
  platform doesn't show that number; empty is not the same as 0. Extras:
  deaths/counter, clips made, raids in, goal reached/partly/missed, a 1–5
  "how did it feel", notes. **Fill from the game on stream** copies the
  current game, part, counter and co.
- **Edit / delete**: tap a row in "Streams in this period". Delete asks twice.
- **Browse**: Week (Mon–Sun) / Month / Year, ‹ › to move, Today to jump back.
- **What the charts show**:
  - top row: streams, hours, new followers, average viewers (all platforms
    added up, mean per stream), comments, followers per hour, each with the
    change against the previous week/month/year (hidden when that one is
    empty) and the best stream by followers per hour;
  - new followers per day (week, month) or per month (year), stacked by
    platform: which platform actually grows the channel;
  - where viewers come from: unique viewers split by platform;
  - hours live per day / week / month: are you streaming enough;
  - average viewers per stream, one line per platform: hover or tap a dot
    for the game, followers, comments and goal of that stream.
- Platform colours: Twitch purple, YouTube orange, TikTok green (checked for
  colour blindness against the panel background).

## Not verified

Written without npm access: the pure modules (`state`, `session`, admin
`time` and `form`) pass their tests (in four time zones) and a strict
typecheck in isolation; the admin panel was bundled with esbuild against
React 19.2 and driven in Chrome with a mocked API (pickers, Ctrl+S, reset,
undo, blocked save, phone width); the overlays
were rendered with a mocked `/api/stream`, and every file transpiles. Never
run here: `npm install`, `tsc` on the whole app, ESLint, Jest, `next build`,
the admin panel in a browser, real Redis or Twitch calls.
