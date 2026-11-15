"use client";

import { useState } from "react";
import { Ghost, Mystery, Skull } from "@/components/icons/Mascots";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import type { Dictionary } from "@/locales/en";
import { DISPLAY_TRACKING } from "@/utils/ui.classes";
import { crewOrder, crewScheme, type CrewId } from "./crew.content";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";

type CrewText = Dictionary["crew"];

/**
 * "Choose your fighter": three cards (Mad, Co, the open guest slot). Picking
 * one shows its bio, screen-time meter and games. Cards are real toggle
 * buttons (`aria-pressed`); the bio is a polite live region.
 */
/**
 * Scroll parallax: while the section passes, the three cards drift at
 * different speeds (Mad up, the guest slot down), like layers in a game menu.
 * Desktop only: on phones and tablets the bio sits right below the cards.
 */
const PARALLAX: Record<CrewId, string> = {
  mad: "lg:translate-y-[calc((var(--p)-0.5)*-70px)]",
  co: "lg:translate-y-[calc((var(--p)-0.5)*10px)]",
  guest: "lg:translate-y-[calc((var(--p)-0.5)*90px)]",
};

export function CrewSelect({ text }: { text: CrewText }) {
  const [selected, setSelected] = useState<CrewId>("mad");
  const member = text.members[selected];
  const scheme = crewScheme[selected];

  return (
    <div className="grid grid-cols-1 gap-[clamp(0.75rem,0.1rem+2.7vw,2.5rem)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <RevealGroup
        className="grid grid-cols-3 gap-[clamp(0.5rem,0.25rem+1vw,1.125rem)]"
        role="group"
        aria-label={text.groupLabel}
        stagger={0.12}
      >
        {crewOrder.map((id) => {
          const isOn = id === selected;
          const s = crewScheme[id];
          return (
            <RevealItem key={id} effect="pop" className="h-full">
              <ScrollProgress className={`h-full ${PARALLAX[id]}`}>
                <button
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => setSelected(id)}
                  className={`relative flex h-full min-h-[clamp(9.25rem,3.4rem+24vw,25rem)] w-full flex-col justify-between border-0 p-[clamp(0.625rem,0.35rem+1.1vw,1.375rem)] text-left focus-inset transition-[transform,background-color] duration-300 ease-smooth cut hover:-translate-y-2 motion-reduce:hover:translate-y-0 ${isOn ? s.active : s.idle}`}
                >
                  <span
                    className={`font-mono text-[11px] font-extrabold tracking-[0.1em] sm:text-[13px] ${isOn ? "" : s.tagIdle}`}
                  >
                    {s.tag}
                  </span>
                  {isOn && (
                    <span className="absolute top-[18px] right-[18px] hidden bg-ink px-2 py-[5px] font-mono text-[11px] font-extrabold tracking-[0.1em] text-paper md:block">
                      {text.selected}
                    </span>
                  )}
                  <span className="flex flex-1 items-center justify-center py-1 sm:py-2 md:py-[18px]">
                    <CrewArt id={id} />
                  </span>
                  <span>
                    <span className="block font-display text-card leading-none">
                      {text.members[id].name}
                    </span>
                    <span
                      className={`mt-0.5 block text-[clamp(0.6875rem,0.6rem+0.35vw,0.875rem)] sm:mt-1.5 ${isOn ? "" : "text-muted"}`}
                    >
                      {text.members[id].role}
                    </span>
                  </span>
                </button>
              </ScrollProgress>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Reveal
        effect="slide-right"
        delay={0.35}
        className="flex flex-col gap-3.5 bg-ink-2 p-[clamp(1.125rem,0.6rem+2.1vw,2.25rem)] cut sm:gap-[22px]"
      >
        <div aria-live="polite" className="flex flex-col gap-3.5 sm:gap-[22px]">
          <div className="flex items-baseline gap-2.5 sm:gap-4">
            <span className={`font-display text-bio leading-[0.9] ${DISPLAY_TRACKING}`}>
              {member.name}
            </span>
            <span className="label-mono text-[11px] text-muted sm:text-[13px]">
              {scheme.tag} · {member.role}
            </span>
          </div>
          <p className="m-0 text-body-lg leading-[1.5] sm:leading-[1.55]">
            {member.blurb}
          </p>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between label-mono text-[10px] text-muted sm:mb-2.5 sm:text-xs">
            <span>{text.screenTime}</span>
            <span>{member.time}</span>
          </div>
          <div
            className="flex h-3 bg-ink-3 p-0.5 sm:h-[18px] sm:p-[3px]"
            aria-hidden="true"
          >
            <span
              className={`block h-full transition-[width] duration-500 ease-smooth ${scheme.fill}`}
              style={{ width: `${scheme.share * 100}%` }}
            />
          </div>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 sm:gap-2.5">
          {member.plays.map((game) => (
            <li
              key={game}
              className="bg-ink-3 px-2 py-1.5 label-mono text-[10px] font-bold text-paper cut-s sm:px-3 sm:py-[9px] sm:text-xs"
            >
              {game}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

function CrewArt({ id }: { id: CrewId }) {
  const art = "w-[60%] max-w-[150px] sm:w-[76%]";
  if (id === "mad") return <Skull className={art} fill="var(--color-paper)" />;
  if (id === "co") return <Ghost className={art} fill="var(--color-paper)" />;
  return <Mystery className={art} />;
}
