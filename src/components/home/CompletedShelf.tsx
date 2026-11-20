"use client";

import { Reveal } from "@/components/ui/reveal";
import { MOOD_COLORS, type ShelfItem } from "@/lib/stream/games";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { WRAP } from "@/utils/ui.classes";
import { SectionHead } from "./SectionHead";

/** Series we played to the end, set in the control room's Games tab. */
export function CompletedShelf() {
  const shelf = useStreamStatus()?.status.shelf ?? [];
  if (!shelf.length) return null;
  const t = en.shelf;
  return (
    <section id="completed" aria-labelledby="completed-title" className={`${WRAP} py-section`}>
      <SectionHead
        id="completed-title"
        label={t.label}
        titleLead={t.titleLead}
        titleAccent={t.titleAccent}
        aside={t.aside}
      />
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {shelf.map((item, i) => (
          <Reveal as="li" key={`${item.name}-${item.completedAt}`} delay={i * 0.05}>
            <ShelfCard item={item} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function ShelfCard({ item }: { item: ShelfItem }) {
  const t = en.shelf;
  const stats = [
    interpolate(t.parts, { n: item.parts }),
    item.hours ? interpolate(t.hours, { n: item.hours }) : "",
    ...item.counters.map((c) => `${c.value} ${c.label.toLowerCase()}`),
  ].filter(Boolean);
  return (
    <article
      style={{ borderColor: MOOD_COLORS[item.mood].a }}
      className="relative flex h-full flex-col gap-3 border-l-[6px] bg-ink-2 p-5 cut sm:p-6"
    >
      <span
        className="absolute top-4 right-4 rotate-[-4deg] bg-paper px-2.5 py-1 label-mono text-[11px] font-extrabold text-ink cut-s"
        aria-hidden="true"
      >
        {t.stamp}
      </span>
      <span
        className="label-mono text-xs font-extrabold"
        style={{ color: MOOD_COLORS[item.mood].a }}
      >
        {t.moods[item.mood]}
      </span>
      <h3 className="m-0 pr-24 font-display text-[28px] leading-none">{item.name}</h3>
      <p className="m-0 label-mono text-xs font-extrabold text-muted">{stats.join(" · ")}</p>
    </article>
  );
}
