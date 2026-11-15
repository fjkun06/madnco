import { MessageSquare } from "lucide-react";
import { Ghost, Skull } from "@/components/icons/Mascots";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { BUTTON_GHOST, BUTTON_PRIMARY, DISPLAY_TRACKING, WRAP } from "@/utils/ui.classes";
import { ExternalLink } from "@/components/ui/ExternalLink";

/**
 * Above the fold. Server-rendered and animated with CSS only (globals.css:
 * `.hero-title`, `.mascot-*`, `.animate-rise-in`), so it paints at once
 * without waiting for JavaScript. Scrolling past it lifts the title and
 * sends the mascots apart where scroll timelines are supported.
 */
export function Hero() {
  const t = en.hero;
  return (
    <section
      aria-labelledby="hero-title"
      className={`${WRAP} grid grid-cols-1 items-center gap-[clamp(2.25rem,1rem+4vw,3.5rem)] pt-[clamp(1.75rem,0.9rem+3.5vw,3.5rem)] pb-[clamp(3.5rem,2rem+5vw,6rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]`}
    >
      <div>
        <p className="animate-rise-in m-0 inline-flex items-center gap-2.5 label-mono text-[13px] font-bold text-tq [animation-delay:0.1s]">
          <span aria-hidden="true" className="h-[3px] w-7 bg-tq" />
          {t.kicker}
        </p>
        <h1
          id="hero-title"
          className={`hero-title mt-[22px] mb-0 font-display text-hero leading-[0.8] text-paper ${DISPLAY_TRACKING}`}
        >
          {t.titleTop}
          <span className="mt-[0.12em] mb-[0.02em] block text-[0.42em] leading-[1.05] text-tq [text-shadow:none]">
            {t.titleMid}
          </span>
          {t.titleBottom}
        </h1>
        <p className="animate-rise-in mt-[clamp(1.5rem,1.1rem+1.2vw,2.125rem)] mb-0 max-w-[35rem] text-lead leading-tight font-bold [animation-delay:0.45s]">
          {t.sloganLead} <em className="text-bordeaux-hi not-italic">{t.sloganAccent}</em>{" "}
          {t.sloganRest}
        </p>
        <div className="animate-rise-in mt-[clamp(1.875rem,1.6rem+0.8vw,2.5rem)] flex flex-col gap-4 [animation-delay:0.6s] sm:flex-row sm:flex-wrap sm:gap-[22px]">
          <span className="relative inline-flex">
            <span
              aria-hidden="true"
              className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-bordeaux cut"
            />
            <a href="#discord" className={`${BUTTON_PRIMARY} relative w-full`}>
              <MessageSquare aria-hidden="true" size={20} strokeWidth={2.5} />
              {t.ctaDiscord}
            </a>
          </span>
          <ExternalLink href={siteConfig.links.tiktokLive} className={BUTTON_GHOST}>
            <span aria-hidden="true" className="size-2.5 rounded-full bg-live" />
            {t.ctaLive}
          </ExternalLink>
        </div>
      </div>

      <div
        role="img"
        aria-label={t.artLabel}
        className="hud-scan relative aspect-square w-full bg-ink-2 cut sm:aspect-[16/10] lg:aspect-[1/1.05]"
      >
        <Brackets />
        <div className="absolute inset-x-[26px] top-[22px] flex items-center justify-between label-mono text-xs text-muted">
          <span>{t.screenName}</span>
          <span>
            <b className="text-tq">P1</b> + <b className="text-tq">P2</b>
          </span>
        </div>
        <div className="absolute inset-x-6 top-[70px] bottom-[92px] flex items-center justify-center gap-[4%]">
          <Skull className="mascot-skull h-full max-h-[260px] w-[40%] max-w-[210px]" />
          <span
            aria-hidden="true"
            className={`mascot-amp font-display text-amp ${DISPLAY_TRACKING}`}
          >
            &amp;
          </span>
          <Ghost className="mascot-ghost h-full max-h-[260px] w-[40%] max-w-[210px]" />
        </div>
        <div className="absolute inset-x-[26px] bottom-[22px] flex items-end justify-between gap-4 label-mono">
          <p className="m-0 text-xs leading-[1.8] text-muted">
            {t.nowPlayingLabel}
            <b className="block text-[15px] text-paper">{t.nowPlaying}</b>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Turquoise corner brackets of the game screen. */
function Brackets() {
  const corner = "absolute size-11 border-tq border-solid";
  return (
    <>
      <span
        aria-hidden="true"
        className={`${corner} -top-0.5 -left-0.5 border-t-[5px] border-l-[5px]`}
      />
      <span
        aria-hidden="true"
        className={`${corner} -top-0.5 -right-0.5 border-t-[5px] border-r-[5px]`}
      />
      <span
        aria-hidden="true"
        className={`${corner} -bottom-0.5 -left-0.5 border-b-[5px] border-l-[5px]`}
      />
      <span
        aria-hidden="true"
        className={`${corner} -right-0.5 -bottom-0.5 border-r-[5px] border-b-[5px]`}
      />
    </>
  );
}
