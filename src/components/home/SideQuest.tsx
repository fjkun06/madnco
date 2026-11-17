"use client";

import { Reveal } from "@/components/ui/reveal";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";
import { questProgress, questText } from "@/lib/stream/extras";
import { OFFLINE_STATUS } from "@/lib/stream/state";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import { BUTTON_PRIMARY_S, DISPLAY_TRACKING, SECTION_LABEL } from "@/utils/ui.classes";

/** The bar always shows a sliver, as in the design, so it reads as a bar. */
const MIN_XP = 0.02;

/** Handles stay bold in the quest text, whatever the admin wrote around them. */
function withHandles(text: string) {
  const handles = [siteConfig.handles.tiktok, siteConfig.handles.tiktokLive];
  const parts = text.split(new RegExp(`(${handles.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`));
  return parts.map((part, i) =>
    handles.includes(part) ? (
      <b key={i} className="text-paper">
        {part}
      </b>
    ) : (
      part
    ),
  );
}

/**
 * XP bar towards the follower goal for going LIVE on @madnco8. Numbers and
 * texts come from the control room; the static HTML shows the defaults
 * until /api/stream has answered.
 */
export function SideQuest() {
  const t = en.quest;
  const quest = (useStreamStatus()?.status ?? OFFLINE_STATUS).quest;
  if (!quest.show) return null;
  const { followers, goal, done } = quest;
  const progress = questProgress(quest);

  return (
    <Reveal
      as="aside"
      effect="pop"
      delay={0.3}
      aria-labelledby="quest-title"
      className={`flex flex-col gap-3 self-start bg-ink-2 p-[clamp(1.125rem,0.8rem+1.3vw,2rem)] cut sm:gap-5 md:max-w-[34rem] lg:max-w-none ${
        done ? "shadow-[inset_0_0_0_2px_var(--color-tq)]" : ""
      }`}
    >
      {done ? (
        <span className="self-start bg-tq px-3 py-1.5 label-mono text-[10px] font-extrabold text-ink cut-s sm:text-xs">
          ✓ {t.done}
        </span>
      ) : (
        <span className={SECTION_LABEL}>{t.label}</span>
      )}
      <h3
        id="quest-title"
        className={`m-0 font-display text-quest leading-[0.95] font-normal ${DISPLAY_TRACKING}`}
      >
        {quest.title}
      </h3>
      <p className="m-0 text-sm leading-[1.5] text-muted sm:text-base sm:leading-[1.55]">
        {withHandles(questText(quest))}
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
          className="block h-full transition-[width] duration-700 ease-smooth"
          style={{ width: `${Math.max(progress, MIN_XP) * 100}%` }}
        >
          <ScrollProgress as="span" range={["start end", "center 55%"]} className="block h-full">
            <span
              className={`${done ? "xp-fill-done" : "xp-fill"} block h-full origin-left scale-x-[var(--p)]`}
            />
          </ScrollProgress>
        </span>
      </div>
      <div className="flex justify-between label-mono text-[10px] text-muted sm:text-xs">
        <span>{t.followers}</span>
        <span>
          <b
            className={done ? "text-bordeaux-hi" : "text-tq"}
            data-nosnippet={followers === null ? "" : undefined}
          >
            {followers ?? t.unknown}
          </b>{" "}
          / {goal}
        </span>
      </div>
      <ExternalLink href={siteConfig.links.tiktok} className={BUTTON_PRIMARY_S}>
        {interpolate(t.cta, { handle: siteConfig.handles.tiktok })}
      </ExternalLink>
    </Reveal>
  );
}
