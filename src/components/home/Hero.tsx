import { MessageSquare } from "lucide-react";
import { Ghost, Skull } from "@/components/icons/Mascots";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { BUTTON_GHOST, BUTTON_PRIMARY, DISPLAY_TRACKING, WRAP } from "@/utils/ui.classes";
import { ExternalLink } from "@/components/ui/ExternalLink";

/**
 * Above the fold. The entrance is CSS only (globals.css: `.hero-title`,
 * `.mascot-*`, `.animate-rise-in`), so it paints at once without waiting
 * for JavaScript. Nothing here is linked to the scroll.
 */
export function Hero() {
  const t = en.hero;
  return (
    <section
      aria-labelledby="hero-title"
      className={`${WRAP} grid grid-cols-1 items-center gap-[clamp(1.25rem,0.2rem+3.7vw,3.5rem)] pt-[clamp(0.625rem,-0.6rem+4.55vw,3.5rem)] pb-[clamp(1.75rem,0.1rem+6.5vw,6rem)] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]`}
    >
      <div>
        <p className="animate-rise-in m-0 inline-flex items-center gap-2 label-mono text-[11px] font-bold text-tq sm:gap-2.5 sm:text-[13px] [animation-delay:0.1s]">
          <span aria-hidden="true" className="h-[3px] w-[18px] bg-tq sm:w-7" />
          {t.kicker}
        </p>
        <h1
          id="hero-title"
          className={`hero-title mt-[clamp(0.625rem,0.35rem+1.1vw,1.375rem)] mb-0 font-display text-hero leading-[0.9] whitespace-nowrap text-paper lg:leading-[0.8] lg:whitespace-normal ${DISPLAY_TRACKING}`}
        >
          {t.titleTop}
          <span className="mx-[0.04em] inline text-[0.42em] leading-[1.05] text-tq [text-shadow:none] lg:mx-0 lg:mt-[0.12em] lg:mb-[0.02em] lg:block">
            {t.titleMid}
          </span>
          {t.titleBottom}
        </h1>
        <p className="animate-rise-in mt-[clamp(0.875rem,0.6rem+1.2vw,2.125rem)] mb-0 max-w-[35rem] text-lead leading-[1.35] font-bold sm:leading-tight [animation-delay:0.45s]">
          {t.sloganLead} <em className="text-bordeaux-hi not-italic">{t.sloganAccent}</em>{" "}
          {t.sloganRest}
        </p>
        <div className="animate-rise-in mt-[clamp(1.125rem,0.7rem+1.6vw,2.5rem)] flex flex-row gap-2.5 [animation-delay:0.6s] sm:flex-wrap sm:gap-[22px]">
          <span className="relative inline-flex min-w-0 flex-1 sm:flex-none">
            <span
              aria-hidden="true"
              className="absolute inset-0 translate-x-1 translate-y-1 bg-bordeaux cut sm:translate-x-1.5 sm:translate-y-1.5"
            />
            <a href="#discord" className={`${BUTTON_PRIMARY} relative w-full`}>
              <MessageSquare
                aria-hidden="true"
                strokeWidth={2.5}
                className="size-4 sm:size-5"
              />
              {t.ctaDiscord}
            </a>
          </span>
          <ExternalLink
            href={siteConfig.links.tiktokLive}
            className={`${BUTTON_GHOST} min-w-0 flex-1 sm:flex-none`}
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-live sm:size-2.5"
            />
            {t.ctaLive}
          </ExternalLink>
        </div>
      </div>

      <div
        role="img"
        aria-label={t.artLabel}
        className="hud-scan relative aspect-[16/10] w-full bg-ink-2 cut lg:aspect-[1/1.05]"
      >
        <Brackets />
        <div className="absolute inset-x-4 top-3 flex items-center justify-between label-mono text-[10px] text-muted sm:inset-x-[26px] sm:top-[22px] sm:text-xs">
          <span>{t.screenName}</span>
          <span>
            <b className="text-tq">P1</b> + <b className="text-tq">P2</b>
          </span>
        </div>
        <div className="absolute inset-x-4 top-[34px] bottom-[42px] flex items-center justify-center gap-[4%] sm:inset-x-6 sm:top-[70px] sm:bottom-[92px]">
          <Skull className="mascot-skull h-full max-h-[260px] w-[34%] max-w-[210px] sm:w-[40%]" />
          <span
            aria-hidden="true"
            className={`mascot-amp font-display text-amp ${DISPLAY_TRACKING}`}
          >
            &amp;
          </span>
          <Ghost className="mascot-ghost h-full max-h-[260px] w-[34%] max-w-[210px] sm:w-[40%]" />
        </div>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-4 label-mono sm:inset-x-[26px] sm:bottom-[22px]">
          <p className="m-0 text-[10px] leading-[1.6] text-muted sm:text-xs sm:leading-[1.8]">
            {t.nowPlayingLabel}
            <b className="block text-xs text-paper sm:text-[15px]">{t.nowPlaying}</b>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Turquoise corner brackets of the game screen. */
function Brackets() {
  const corner = "absolute size-[26px] border-tq border-solid sm:size-11";
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
