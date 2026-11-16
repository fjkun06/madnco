/**
 * Every word on the site, in English. Structure (order, ids, colours) lives in
 * the `*.content.ts` files next to the components; numbers and handles come
 * from `siteConfig` and are interpolated, never typed in here.
 *
 * Adding FR/DE later: copy this file, keep the keys, and add a locale switch
 * the way Herzog does (next-international).
 */
export const en = {
  meta: {
    // The handle is in the title: people search for what they saw on TikTok.
    title: "MadnCo. (@madnco8) · The duo of endless madness",
    description:
      "MadnCo. (@madnco8) is Mad and Co: game nights, RP chaos, story mode roasts and OmeTV lives on TikTok, Twitch and YouTube. Join the Discord.",
  },
  a11y: {
    /** Read after every link that opens in a new tab. */
    newTab: "(opens in a new tab)",
  },
  nav: {
    skip: "Skip to content",
    label: "Main",
    crew: "The crew",
    what: "What we do",
    discord: "Discord",
    links: "Find us",
    joinDiscord: "Join Discord",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "MadnCo. home",
  },
  live: {
    pill: "Lives on {handle}",
  },
  hero: {
    kicker: "Player 1 has entered the chat",
    titleTop: "MAD",
    titleMid: "n",
    titleBottom: "CO.",
    sloganLead: "The duo of",
    sloganAccent: "endless madness.",
    sloganRest:
      "Game nights, RP chaos, story mode roasts, OmeTV and the funniest stuff on the internet.",
    ctaDiscord: "Join the Discord",
    ctaLive: "Watch the lives",
    artLabel: "Skull and ghost mascots of Mad and Co on a game screen",
    screenName: "MADNCO.EXE",
    nowPlayingLabel: "Now playing",
    nowPlaying: "FIFA · RP · Story mode",
  },
  tapes: {
    a: ["GAME NIGHTS", "RP CHAOS", "STORY MODE ROASTS", "OMETV CHAOS", "RAGE QUITS"],
    b: ["THE DUO OF ENDLESS MADNESS", "JOIN THE FAM"],
  },
  crew: {
    label: "01 / The crew",
    titleLead: "Choose your",
    titleAccent: "fighter",
    aside:
      "Mad runs the show. Co jumps in when school and work let him. And there is always a free slot for whoever drops in to game.",
    groupLabel: "Crew members",
    selected: "Selected",
    screenTime: "Screen time",
    members: {
      mad: {
        name: "MAD",
        role: "Host",
        time: "90%",
        blurb:
          "Runs the show. Every stream, every rage moment, every OmeTV stranger. If MadnCo. is live, Mad is there.",
        plays: ["FIFA", "RP", "Story mode", "OmeTV", "Funny finds"],
      },
      co: {
        name: "CO",
        role: "Co-host",
        time: "10%",
        blurb:
          "Joins when school and work let him. When Co is in, game nights and OmeTV lives get twice as loud.",
        plays: ["FIFA", "OmeTV"],
      },
      guest: {
        name: "???",
        role: "Guest slot",
        time: "Open",
        blurb:
          "Pals drop in to game with Mad all the time. The next one could be you: hop in the Discord and say hi.",
        plays: ["Gaming", "Voice chat"],
      },
    },
  },
  what: {
    label: "02 / What we do",
    titleLead: "Pick your",
    titleAccent: "madness",
    aside:
      "No fixed schedule: school and work come first. Turn on Live Ping in the Discord and you will know the second we go live.",
    items: {
      games: {
        title: "Game nights",
        text: "FC, eFootball and whatever else the crew is playing that week. Last-minute goals, rage moments, zero chill.",
      },
      rp: {
        title: "RP chaos",
        text: "In character on roleplay servers: gangs, heists, police chases, and a lot of talking our way out of trouble.",
      },
      story: {
        title: "Story mode, roasted",
        text: "Cyberpunk, Red Dead, Wukong and more, with dark humour, sarcasm and plenty of dying.",
      },
      ometv: {
        title: "OmeTV chaos",
        text: "Random strangers, live reactions. You never know who is next.",
      },
      chill: {
        title: "Chill streams",
        text: "Just hanging out with the chat. Questions, stories, whatever comes up.",
      },
      finds: {
        title: "Funny finds",
        text: "The funniest stuff we find online, and the best of what you drop in the Discord.",
      },
    },
    where: { live: "LIVE", tiktok: "TIKTOK" },
  },
  discord: {
    label: "03 / Home base",
    titleLead: "Join the",
    titleAccent: "madness.",
    text: "The Discord is where the fam hangs out between streams: memes, clips, FIFA talk, voice chats, and a ping the moment we go live.",
    cta: "Open the Discord",
    missing: "[Discord invite link]",
    channelsLabel: "MadnCo. · channels",
    channelsAria: "Some of the Discord channels",
    ping: "PING",
  },
  links: {
    label: "04 / Find us",
    titleLead: "Every",
    titleAccent: "channel",
    platforms: {
      tiktok: "TikTok",
      tiktokLive: "TikTok Live",
      twitch: "Twitch",
      youtube: "YouTube",
      discord: "Discord",
    },
    discordName: "MadnCo. server",
    notLinked: "link coming soon",
  },
  quest: {
    label: "Side quest",
    title: "Unlock MadnCo. LIVE",
    text: "TikTok lets {handle} go live at {goal} followers. Until then we stream on {liveHandle}. Every follow gets us closer.",
    followers: "Followers",
    unknown: "[...]",
    cta: "Follow {handle}",
  },
  caseFile: {
    label: "05 / Also by Mad",
    stamp: "CASE FILE",
    intro: "Mad's anime channel",
    quote: "Everything has a file.",
  },
  footer: {
    outlineA: "ENDLESS",
    outlineB: "MADNESS",
    credit: "MadnCo. · Mad & Co",
    builtBy: "Built by Mad · frankjordan.dev",
    impressum: "Impressum",
    privacy: "Privacy",
    pause: "Pause animations",
    play: "Play animations",
  },
  notFound: {
    title: "Wrong lobby.",
    text: "This page doesn't exist, or it rage quit.",
    cta: "Back to the hub",
  },
  legal: {
    back: "Back to the hub",
    impressumTitle: "Impressum",
    privacyTitle: "Privacy",
  },
} as const;

export type Dictionary = typeof en;
