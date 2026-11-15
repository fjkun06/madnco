import { MessageSquare } from "lucide-react";
import { Ghost, Skull } from "@/components/icons/Mascots";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { BUTTON_GHOST, BUTTON_PRIMARY, WRAP } from "@/utils/ui.classes";

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
      className={`${WRAP} grid grid-cols-1 items-center gap-9 pt-7 pb-14 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:gap-14 md:pt-14 md:pb-24`}
    >
      <div>
        <p className="animate-rise-in m-0 inline-flex items-center gap-2.5 label-mono text-[13px] font-bold text-tq [animation-delay:0.1s]">
          <span aria-hidden="true" className="h-[3px] w-7 bg-tq" />
          {t.kicker}
        </p>
        <h1
          id="hero-title"
          className="hero-title mt-5 mb-0 font-display text-[104px] leading-[0.8] text-paper md:text-[clamp(96px,13.5vw,200px)]"
        >
          {t.titleTop}
          <span className="block text-[0.42em] leading-[1.05] text-tq [text-shadow:none]">
            {t.titleMid}
          </span>
          {t.titleBottom}
        </h1>
        <p className="animate-rise-in mt-6 mb-0 max-w-[560px] text-[22px] leading-tight font-bold [animation-delay:0.45s] md:mt-8 md:text-[28px]">
          {t.sloganLead} <em className="text-bordeaux-hi not-italic">{t.sloganAccent}</em>{" "}
          {t.sloganRest}
        </p>
        <div className="animate-rise-in mt-8 flex flex-col gap-4 [animation-delay:0.6s] md:mt-10 md:flex-row md:flex-wrap md:gap-5">
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
          <a href={siteConfig.links.tiktokLive} className={BUTTON_GHOST}>
            <span aria-hidden="true" className="size-2.5 rounded-full bg-live" />
            {t.ctaLive}
          </a>
        </div>
      </div>

      <div
        role="img"
        aria-label={t.artLabel}
        className="hud-scan relative aspect-square bg-ink-2 md:aspect-[1/1.05]"
      >
        <Brackets />
        <div className="absolute inset-x-6 top-5 flex items-center justify-between label-mono text-xs text-muted">
          <span>{t.screenName}</span>
          <span>
            <b className="text-tq">P1</b> + <b className="text-tq">P2</b>
          </span>
        </div>
        <div className="absolute inset-x-6 top-[70px] bottom-[92px] flex items-center justify-center gap-[4%]">
          <Skull className="mascot-skull w-[40%] max-w-[210px]" />
          <span
            aria-hidden="true"
            className="mascot-amp font-display text-[44px] md:text-[64px]"
          >
            &amp;
          </span>
          <Ghost className="mascot-ghost w-[40%] max-w-[210px]" />
        </div>
        <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-4 label-mono">
          <p className="m-0 text-xs leading-loose text-muted">
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
