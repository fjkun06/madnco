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
import { ExternalLink } from "@/components/ui/ExternalLink";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";

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
const PLATFORM = "font-mono text-[10px] font-extrabold tracking-[0.1em] sm:text-[13px]";

const ROW =
  "grid grid-cols-[minmax(0,1fr)_22px] items-center gap-x-2.5 gap-y-0.5 border-b-2 border-ink-3 px-0.5 py-3 no-underline sm:grid-cols-[minmax(0,1fr)_32px] sm:gap-x-3 sm:gap-y-1 sm:px-1 sm:py-5 md:grid-cols-[150px_minmax(0,1fr)_40px] md:gap-5 md:px-2 md:py-[26px]";

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
      <div className="grid grid-cols-1 gap-5 sm:gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <RevealGroup as="ul" className="m-0 list-none border-t-2 border-ink-3 p-0">
          {rows.map(({ key, handle, href }) => {
            const url = confirmedHref(href);
            return (
              <RevealItem as="li" key={key}>
                {url ? (
                  <ExternalLink
                    href={url}
                    className={`${ROW} group text-paper transition-[background-color,color,padding] duration-300 ease-smooth hover:bg-tq hover:pl-2.5 hover:text-ink sm:hover:pl-6 focus-visible:outline-offset-[-3px]`}
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
                        strokeWidth={2.5}
                        className="size-5 transition-transform duration-500 ease-smooth group-hover:rotate-45 sm:size-7"
                      />
                    </RevealItem>
                  </ExternalLink>
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
                      strokeWidth={2.5}
                      className="col-start-2 row-span-2 row-start-1 size-5 text-line sm:size-7 md:col-start-auto md:row-span-1 md:row-start-auto"
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
      className="flex flex-col gap-3 self-start bg-ink-2 p-[clamp(1.125rem,0.8rem+1.3vw,2rem)] cut sm:gap-5 md:max-w-[34rem] lg:max-w-none"
    >
      <span className={SECTION_LABEL}>{t.label}</span>
      <h3
        id="quest-title"
        className={`m-0 font-display text-quest leading-[0.95] font-normal ${DISPLAY_TRACKING}`}
      >
        {t.title}
      </h3>
      <p className="m-0 text-sm leading-[1.5] text-muted sm:text-base sm:leading-[1.55]">
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
        className="flex h-[18px] bg-ink-3 p-[3px] sm:h-[26px] sm:p-1"
      >
        {/* Fills up to the real count as the card scrolls into view. */}
        <span
          className="block h-full"
          style={{ width: `${Math.max(progress, MIN_XP) * 100}%` }}
        >
          <ScrollProgress
            as="span"
            range={["start end", "center 55%"]}
            className="block h-full"
          >
            <span className="xp-fill block h-full origin-left scale-x-[var(--p)]" />
          </ScrollProgress>
        </span>
      </div>
      <div className="flex justify-between label-mono text-[10px] text-muted sm:text-xs">
        <span>{t.followers}</span>
        <span>
          <b className="text-tq" data-nosnippet={followers === null ? "" : undefined}>
            {followers ?? t.unknown}
          </b>{" "}
          / {goal}
        </span>
      </div>
      <ExternalLink href={siteConfig.links.tiktok} className={BUTTON_PRIMARY_S}>
        {interpolate(t.cta, { handle: handles.tiktok })}
      </ExternalLink>
    </Reveal>
  );
}
