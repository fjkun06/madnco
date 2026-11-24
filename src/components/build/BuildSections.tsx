import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SectionHead } from "@/components/home/SectionHead";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, siteConfig } from "@/utils/app.constants";
import { BUTTON_GHOST, BUTTON_PRIMARY, DISPLAY_TRACKING, WRAP } from "@/utils/ui.classes";
import { OverlayDemo } from "./OverlayDemo";

const t = en.build;
const tiktok = confirmedHref(siteConfig.links.tiktok);

/** Top of /build: what this is, in Frank's words. CSS entrance only. */
export function BuildHero() {
  return (
    <section
      aria-labelledby="build-title"
      className={`${WRAP} pt-[clamp(1.5rem,0.5rem+4vw,4.5rem)] pb-[clamp(1.5rem,0.8rem+3vw,3.5rem)]`}
    >
      <p className="animate-rise-in m-0 inline-flex items-center gap-2 label-mono text-[11px] font-bold text-tq sm:gap-2.5 sm:text-[13px] [animation-delay:0.1s]">
        <span aria-hidden="true" className="h-[3px] w-[18px] bg-tq sm:w-7" />
        {t.label}
      </p>
      <h1
        id="build-title"
        className={`hero-title mt-[clamp(0.625rem,0.35rem+1.1vw,1.375rem)] mb-0 max-w-[15ch] font-display text-section leading-[0.92] text-paper ${DISPLAY_TRACKING}`}
      >
        {t.titleLead} <span className="text-bordeaux-hi">{t.titleAccent}</span>
      </h1>
      <p className="animate-rise-in mt-[clamp(0.875rem,0.6rem+1.2vw,1.75rem)] mb-0 max-w-[40rem] text-body-lg leading-[1.55] text-muted [animation-delay:0.35s]">
        {t.lead} <strong className="text-paper">{t.leadStrong}</strong>
      </p>
      <div className="animate-rise-in mt-[clamp(1.125rem,0.7rem+1.6vw,2.25rem)] flex flex-row flex-wrap gap-2.5 [animation-delay:0.5s] sm:gap-[18px]">
        <a href="#try" className={BUTTON_PRIMARY}>
          {t.tryIt}
          <ArrowDown aria-hidden="true" strokeWidth={2.5} className="size-4 sm:size-5" />
        </a>
        {tiktok ? (
          <ExternalLink href={tiktok} className={BUTTON_GHOST}>
            {t.follow}
            <ArrowUpRight aria-hidden="true" strokeWidth={2.5} className="size-4 sm:size-5" />
          </ExternalLink>
        ) : null}
      </div>
    </section>
  );
}

/** 01 / Try it — the demo remote and the real overlay. */
export function BuildDemo() {
  return (
    <section id="try" aria-label={t.demo.label} className={`${WRAP} scroll-mt-24 pb-section`}>
      <p className="m-0 mb-3 label-mono text-[11px] font-bold text-bordeaux-hi sm:text-[13px]">
        {t.demo.label}
      </p>
      <OverlayDemo />
    </section>
  );
}

const EDGES = ["border-tq", "border-bordeaux-hi", "border-bordeaux"] as const;

/** 02 / What's inside — six cards. */
export function BuildInside() {
  const s = t.inside;
  return (
    <section aria-labelledby="inside-title" className={`${WRAP} py-section`}>
      <SectionHead
        id="inside-title"
        label={s.label}
        titleLead={s.titleLead}
        titleAccent={s.titleAccent}
      />
      <RevealGroup
        as="ul"
        className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      >
        {s.items.map((item, i) => (
          <RevealItem
            as="li"
            key={item.title}
            className={`border-t-[3px] bg-ink-2 p-5 sm:p-6 ${EDGES[i % EDGES.length]}`}
          >
            <span className="label-mono text-[11px] font-bold text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 mb-2 font-display text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)] leading-[1.05]">
              {item.title}
            </h3>
            <p className="m-0 text-[15px] leading-[1.55] text-muted">{item.text}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/** 03 / How it's built — honest about the AI, plus the build log. */
export function BuildHow() {
  const s = t.how;
  return (
    <section aria-labelledby="how-title" className={`${WRAP} py-section`}>
      <SectionHead id="how-title" label={s.label} titleLead={s.titleLead} titleAccent={s.titleAccent} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <p className="m-0 max-w-[36rem] text-body-lg leading-[1.6] text-muted">{s.text}</p>
          <ul className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
            {s.stack.map((item) => (
              <li
                key={item}
                className="bg-ink-3 px-3 py-2 label-mono text-[11px] font-extrabold text-paper cut-s"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="m-0 mb-4 label-mono text-[11px] font-bold text-tq sm:text-[13px]">{s.logLabel}</h3>
          <RevealGroup as="ul" className="m-0 list-none border-l-2 border-ink-3 p-0 pl-6">
            {s.log.map((entry) => (
              <RevealItem as="li" key={entry.when} className="relative mb-4 last:mb-0">
                <span aria-hidden="true" className="absolute top-1.5 -left-[31px] size-3 bg-tq" />
                <span className="block label-mono text-[11px] font-bold text-tq">{entry.when}</span>
                <span className="text-[16px] leading-[1.5] text-paper">{entry.what}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

/** 04 / Your turn — comments vote the next feature. */
export function BuildVote() {
  const s = t.vote;
  return (
    <section aria-labelledby="vote-title" className={`${WRAP} pt-section pb-[clamp(3rem,2rem+4vw,7rem)]`}>
      <div className="grid grid-cols-1 gap-6 border-l-[6px] border-bordeaux-hi bg-ink-2 p-6 cut sm:p-9 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <p className="m-0 label-mono text-[11px] font-bold text-bordeaux-hi sm:text-[13px]">{s.label}</p>
          <h2
            id="vote-title"
            className={`mt-2 mb-3 font-display text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] leading-[0.95] ${DISPLAY_TRACKING}`}
          >
            {s.titleLead} <span className="text-tq">{s.titleAccent}</span>
          </h2>
          <p className="m-0 max-w-[30rem] text-body-lg leading-[1.55] text-muted">{s.text}</p>
          {tiktok ? (
            <ExternalLink href={tiktok} className={`${BUTTON_PRIMARY} mt-5`}>
              {s.cta}
              <ArrowUpRight aria-hidden="true" strokeWidth={2.5} className="size-4 sm:size-5" />
            </ExternalLink>
          ) : null}
        </div>
        <ol className="m-0 flex list-none flex-col gap-2 self-center p-0">
          {s.options.map((option, i) => (
            <li key={option} className="flex items-center justify-between gap-4 bg-ink-3 px-4 py-3.5">
              <span className="text-[16px]">{option}</span>
              <b className="font-mono text-[15px] font-extrabold text-tq">{i + 1}</b>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
