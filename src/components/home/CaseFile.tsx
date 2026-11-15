import { Reveal } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, siteConfig } from "@/utils/app.constants";
import { BUTTON_INK_S, SECTION_LABEL, WRAP, DISPLAY_TRACKING } from "@/utils/ui.classes";
import { ExternalLink } from "@/components/ui/ExternalLink";

/** 05 / Also by Mad — The Anime Case Files, as a paper case file with a stamp. */
export function CaseFile() {
  const t = en.caseFile;
  const show = siteConfig.animeCaseFiles;
  const youtube = confirmedHref(show.youtube);
  const button = BUTTON_INK_S;
  return (
    <section aria-labelledby="case-title" className={`${WRAP} pb-6`}>
      <Reveal as="span" className={`${SECTION_LABEL} mb-[18px] block`}>
        {t.label}
      </Reveal>
      <Reveal
        delay={0.1}
        className="grid grid-cols-1 bg-paper text-ink cut md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
      >
        <div className="relative bg-paper-2 p-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)]">
          <Reveal
            as="span"
            effect="stamp"
            delay={0.55}
            className="inline-block -rotate-6 border-[3px] border-bordeaux px-3 py-2 label-mono text-[13px] font-extrabold tracking-[0.14em] text-bordeaux"
          >
            {t.stamp}
          </Reveal>
          <h3
            id="case-title"
            className="mt-[34px] mb-0 font-display text-panel leading-[0.92] font-normal"
          >
            {show.name}
          </h3>
        </div>
        <div className="flex flex-col justify-between gap-7 p-[clamp(1.75rem,1.2rem+1.8vw,2.75rem)]">
          <figure className="m-0">
            <figcaption className="mb-4 label-mono text-xs font-bold text-case-ink">
              {t.intro}
            </figcaption>
            <Reveal as="div" effect="wipe" delay={0.8}>
              <blockquote className="relative m-0 pl-[clamp(2.75rem,2rem+2.4vw,4rem)]">
                <span
                  aria-hidden="true"
                  className="absolute top-[-0.12em] left-0 font-display text-[clamp(4.5rem,3.4rem+3.6vw,7rem)] leading-none text-bordeaux"
                >
                  &ldquo;
                </span>
                <p
                  className={`m-0 font-display text-[clamp(2rem,1.5rem+1.8vw,3rem)] leading-[1.02] text-ink text-balance ${DISPLAY_TRACKING}`}
                >
                  {t.quote}
                  <span
                    aria-hidden="true"
                    className="ml-[0.08em] inline-block translate-y-[0.18em] align-top text-[1.6em] leading-[0.6] text-bordeaux"
                  >
                    &rdquo;
                  </span>
                </p>
              </blockquote>
            </Reveal>
          </figure>
          <div className="flex flex-wrap gap-3.5">
            <ExternalLink href={show.tiktok} className={button}>
              TikTok
            </ExternalLink>
            {youtube ? (
              <ExternalLink href={youtube} className={button}>
                YouTube
              </ExternalLink>
            ) : (
              <span data-nosnippet className={`${button} opacity-70`}>
                [YouTube link]
              </span>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
