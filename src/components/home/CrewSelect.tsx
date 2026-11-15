"use client";

import { useState } from "react";
import { Ghost, Mystery, Skull } from "@/components/icons/Mascots";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import type { Dictionary } from "@/locales/en";
import { DISPLAY_TRACKING } from "@/utils/ui.classes";
import { crewOrder, crewScheme, type CrewId } from "./crew.content";

type CrewText = Dictionary["crew"];

/**
 * "Choose your fighter": three cards (Mad, Co, the open guest slot). Picking
 * one shows its bio, screen-time meter and games. Cards are real toggle
 * buttons (`aria-pressed`); the bio is a polite live region.
 */
export function CrewSelect({ text }: { text: CrewText }) {
  const [selected, setSelected] = useState<CrewId>("mad");
  const member = text.members[selected];
  const scheme = crewScheme[selected];

  return (
    <div className="grid grid-cols-1 gap-[clamp(1rem,0.4rem+2vw,2.5rem)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <RevealGroup
        className="grid grid-cols-3 gap-[clamp(0.625rem,0.4rem+0.7vw,1.125rem)]"
        role="group"
        aria-label={text.groupLabel}
        stagger={0.12}
      >
        {crewOrder.map((id) => {
          const isOn = id === selected;
          const s = crewScheme[id];
          return (
            <RevealItem key={id} effect="pop">
              <button
                type="button"
                aria-pressed={isOn}
                onClick={() => setSelected(id)}
                className={`relative flex h-full min-h-[clamp(12.5rem,6.5rem+22vw,25rem)] w-full flex-col justify-between border-0 p-[clamp(0.75rem,0.45rem+1.2vw,1.375rem)] text-left focus-inset transition-[transform,background-color] duration-200 cut hover:-translate-y-2 motion-reduce:hover:translate-y-0 ${isOn ? s.active : s.idle}`}
              >
                <span
                  className={`font-mono text-[13px] font-extrabold tracking-[0.1em] ${isOn ? "" : s.tagIdle}`}
                >
                  {s.tag}
                </span>
                {isOn && (
                  <span className="absolute top-[18px] right-[18px] hidden bg-ink px-2 py-[5px] font-mono text-[11px] font-extrabold tracking-[0.1em] text-paper md:block">
                    {text.selected}
                  </span>
                )}
                <span className="flex flex-1 items-center justify-center py-2 md:py-[18px]">
                  <CrewArt id={id} />
                </span>
                <span>
                  <span className="block font-display text-card leading-none">
                    {text.members[id].name}
                  </span>
                  <span
                    className={`mt-1.5 block text-[clamp(0.75rem,0.68rem+0.3vw,0.875rem)] ${isOn ? "" : "text-muted"}`}
                  >
                    {text.members[id].role}
                  </span>
                </span>
              </button>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <Reveal
        effect="slide-right"
        delay={0.35}
        className="flex flex-col gap-[22px] bg-ink-2 p-[clamp(1.5rem,1rem+1.6vw,2.25rem)] cut"
      >
        <div aria-live="polite" className="flex flex-col gap-[22px]">
          <div className="flex items-baseline gap-4">
            <span className={`font-display text-bio leading-[0.9] ${DISPLAY_TRACKING}`}>
              {member.name}
            </span>
            <span className="label-mono text-[13px] text-muted">
              {scheme.tag} · {member.role}
            </span>
          </div>
          <p className="m-0 text-body-lg leading-[1.55]">{member.blurb}</p>
        </div>
        <div>
          <div className="mb-2.5 flex justify-between label-mono text-xs text-muted">
            <span>{text.screenTime}</span>
            <span>{member.time}</span>
          </div>
          <div className="flex h-[18px] bg-ink-3 p-[3px]" aria-hidden="true">
            <span
              className={`block h-full transition-[width] duration-500 ${scheme.fill}`}
              style={{ width: `${scheme.share * 100}%` }}
            />
          </div>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
          {member.plays.map((game) => (
            <li
              key={game}
              className="bg-ink-3 px-3 py-[9px] label-mono text-xs font-bold text-paper cut-s"
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
  const art = "w-[76%] max-w-[150px]";
  if (id === "mad") return <Skull className={art} fill="var(--color-paper)" />;
  if (id === "co") return <Ghost className={art} fill="var(--color-paper)" />;
  return <Mystery className={art} />;
}
