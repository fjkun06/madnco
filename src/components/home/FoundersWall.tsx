"use client";

import { useState } from "react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/reveal";
import { FOUNDERS_MAX } from "@/lib/stream/fans";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import { BUTTON_PRIMARY, WRAP } from "@/utils/ui.classes";
import { SectionHead } from "./SectionHead";

/** Slots shown on a phone before "Show all". */
const PHONE_SLOTS = 12;

/**
 * The Founding 50: everyone who followed @madnco8 before 50, numbered, plus
 * the open slots. Shows once the first founder is in.
 */
export function FoundersWall() {
  const fans = useStreamStatus()?.status.fans;
  const [all, setAll] = useState(false);
  const founders = fans?.founders ?? [];
  if (!founders.length) return null;

  const t = en.founders;
  const goal = fans?.goal ?? FOUNDERS_MAX;
  const left = Math.max(0, goal - founders.length);
  const slots = Array.from({ length: goal }, (_, i) => founders[i] ?? null);
  const newest = founders.length - 1;

  return (
    <section id="founders" aria-labelledby="founders-title" className={`${WRAP} py-section`}>
      <SectionHead
        id="founders-title"
        label={t.label}
        titleLead={t.titleLead}
        titleAccent={t.titleAccent}
        aside={t.aside}
      />
      <div className="mb-6 flex flex-col gap-2 sm:max-w-md">
        <div className="h-5 bg-ink-3 p-1 cut-s" aria-hidden="true">
          <div
            className="h-full bg-[repeating-linear-gradient(90deg,var(--color-tq)_0_22px,#23A99E_22px_28px)]"
            style={{ width: `${(founders.length / goal) * 100}%` }}
          />
        </div>
        <p className="m-0 flex justify-between label-mono text-xs font-extrabold text-muted">
          <span>{left ? interpolate(t.spotsLeft, { n: left }) : t.full}</span>
          <span>
            <b className="text-tq">{founders.length}</b> / {goal}
          </span>
        </p>
      </div>

      <ol className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {slots.map((f, i) => {
          const hiddenOnPhone = !all && i >= PHONE_SLOTS ? "max-sm:hidden" : "";
          const num = `#${String(i + 1).padStart(2, "0")}`;
          return f ? (
            <Reveal
              as="li"
              key={f.name}
              delay={Math.min(i, 10) * 0.03}
              className={`flex min-h-12 items-center gap-2.5 px-3 cut-s ${
                i === newest ? "bg-tq text-ink" : "bg-ink-2"
              } ${hiddenOnPhone}`}
            >
              <span className={`label-mono text-[11px] font-extrabold ${i === newest ? "" : "text-tq"}`}>
                {num}
              </span>
              <span className="min-w-0 truncate text-[15px]">{f.name}</span>
            </Reveal>
          ) : (
            <li
              key={`open-${num}`}
              className={`flex min-h-12 items-center gap-2.5 border-2 border-dashed border-ink-3 px-3 text-muted cut-s ${hiddenOnPhone}`}
            >
              <span className="label-mono text-[11px] font-extrabold">{num}</span>
              {i === founders.length ? <span className="text-[14px]">{t.couldBeYou}</span> : null}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => setAll((v) => !v)}
        className="focus-inset mt-3 w-full py-2 label-mono text-xs font-extrabold text-muted sm:hidden"
      >
        {all ? t.showLess : interpolate(t.showAll, { n: founders.length })}
      </button>

      {left ? (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ExternalLink href={siteConfig.links.tiktok} className={BUTTON_PRIMARY}>
            {t.cta}
          </ExternalLink>
          <span className="label-mono text-xs font-extrabold text-muted">{t.claim}</span>
        </div>
      ) : null}
    </section>
  );
}
