import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, followerProgress, siteConfig } from "@/utils/app.constants";
import { interpolate, interpolateParts } from "@/utils/interpolate";
import {
  BUTTON_PRIMARY_S,
  DISPLAY_TRACKING,
  SECTION_LABEL,
  WRAP,
} from "@/utils/ui.classes";
import { SectionHead } from "./SectionHead";

type Row = { key: keyof typeof en.links.platforms; handle: string; href: string };

const rows: Row[] = [
  { key: "tiktok", handle: siteConfig.handles.tiktok, href: siteConfig.links.tiktok },
  {
    key: "tiktokLive",
    handle: siteConfig.handles.tiktokLive,
    href: siteConfig.links.tiktokLive,
  },
  { key: "twitch", handle: siteConfig.handles.twitch, href: siteConfig.links.twitch },
  { key: "youtube", handle: siteConfig.handles.youtube, href: siteConfig.links.youtube },
  { key: "discord", handle: en.links.discordName, href: siteConfig.links.discord },
];

/** Platform name: mono, wide tracking, kept in its own case (TikTok). */
const PLATFORM = "font-mono text-[13px] font-extrabold tracking-[0.1em]";

const ROW =
  "grid grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 gap-y-1 border-b-2 border-ink-3 px-1 py-5 no-underline md:grid-cols-[150px_minmax(0,1fr)_40px] md:gap-5 md:px-2 md:py-[26px]";

/** 04 / Find us — every channel as a big row, plus the side quest card. */
export function FindUs() {
  const t = en.links;
  return (
    <section id="links" aria-labelledby="links-title" className={`${WRAP} py-section`}>
      <SectionHead
        id="links-title"
        label={t.label}
        titleLead={t.titleLead}
        titleAccent={t.titleAccent}
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <RevealGroup as="ul" className="m-0 list-none border-t-2 border-ink-3 p-0">
          {rows.map(({ key, handle, href }) => {
            const url = confirmedHref(href);
            return (
              <RevealItem as="li" key={key}>
                {url ? (
                  <a
                    href={url}
                    className={`${ROW} group text-paper transition-[background-color,color,padding] duration-150 hover:bg-tq hover:pl-6 hover:text-ink focus-visible:outline-offset-[-3px]`}
                  >
                    <span className={`${PLATFORM} text-muted group-hover:text-ink`}>
                      {t.platforms[key]}
                    </span>
                    <span className="col-start-1 font-display text-handle leading-none md:col-start-auto">
                      {handle}
                    </span>
                    {/* Swings into place with its row, then turns on hover. */}
                    <RevealItem
                      as="span"
                      effect="spin"
                      aria-hidden
                      className="col-start-2 row-span-2 row-start-1 inline-flex md:col-start-auto md:row-span-1 md:row-start-auto"
                    >
                      <ArrowUpRight
                        aria-hidden="true"
                        size={28}
                        strokeWidth={2.5}
                        className="transition-transform duration-300 group-hover:rotate-45"
                      />
                    </RevealItem>
                  </a>
                ) : (
                  // Same layout as a linked row, but not a link: the muted
                  // arrow is decoration and the note is for screen readers.
                  <div data-nosnippet className={`${ROW} text-paper`}>
                    <span className={`${PLATFORM} text-muted`}>{t.platforms[key]}</span>
                    <span className="col-start-1 font-display text-handle leading-none md:col-start-auto">
                      {handle}
                      <span className="sr-only"> ({t.notLinked})</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      size={28}
                      strokeWidth={2.5}
                      className="col-start-2 row-span-2 row-start-1 text-line md:col-start-auto md:row-span-1 md:row-start-auto"
                    />
                  </div>
                )}
              </RevealItem>
            );
          })}
        </RevealGroup>
        <SideQuest />
      </div>
    </section>
  );
}

/** The bar always shows a sliver, as in the design, so it reads as a bar. */
const MIN_XP = 0.02;

/** XP bar towards TikTok's follower minimum for going LIVE on @madnco8. */
function SideQuest() {
  const t = en.quest;
  const { madncoFollowers: followers, liveFollowerGoal: goal, handles } = siteConfig;
  const progress = followerProgress(followers, goal);
  return (
    <Reveal
      as="aside"
      effect="pop"
      delay={0.3}
      aria-labelledby="quest-title"
      className="flex flex-col gap-5 self-start bg-ink-2 p-[clamp(1.5rem,1.2rem+1vw,2rem)] cut md:max-w-[34rem] lg:max-w-none"
    >
      <span className={SECTION_LABEL}>{t.label}</span>
      <h3
        id="quest-title"
        className={`m-0 font-display text-quest leading-[0.95] font-normal ${DISPLAY_TRACKING}`}
      >
        {t.title}
      </h3>
      <p className="m-0 text-base leading-[1.55] text-muted">
        {interpolateParts(t.text, {
          handle: handles.tiktok,
          goal,
          liveHandle: handles.tiktokLive,
        }).map(({ text, slot }, i) =>
          slot === "handle" || slot === "liveHandle" ? (
            <b key={i} className="text-paper">
              {text}
            </b>
          ) : (
            text
          ),
        )}
      </p>
      <div
        role="progressbar"
        aria-label={t.followers}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={followers ?? undefined}
        className="flex h-[26px] bg-ink-3 p-1"
      >
        <Reveal
          as="span"
          effect="draw"
          delay={0.6}
          className="xp-fill block h-full origin-left"
          style={{ width: `${Math.max(progress, MIN_XP) * 100}%` }}
        />
      </div>
      <div className="flex justify-between label-mono text-xs text-muted">
        <span>{t.followers}</span>
        <span>
          <b className="text-tq" data-nosnippet={followers === null ? "" : undefined}>
            {followers ?? t.unknown}
          </b>{" "}
          / {goal}
        </span>
      </div>
      <a href={siteConfig.links.tiktok} className={BUTTON_PRIMARY_S}>
        {interpolate(t.cta, { handle: handles.tiktok })}
      </a>
    </Reveal>
  );
}
