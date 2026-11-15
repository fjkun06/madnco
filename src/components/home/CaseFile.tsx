import { Reveal } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, siteConfig } from "@/utils/app.constants";
import { BUTTON_INK_S, SECTION_LABEL, WRAP } from "@/utils/ui.classes";

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
          <p className="m-0 text-body-lg leading-[1.55] text-case-ink">{t.text}</p>
          <div className="flex flex-wrap gap-3.5">
            <a href={show.tiktok} className={button}>
              TikTok
            </a>
            {youtube ? (
              <a href={youtube} className={button}>
                YouTube
              </a>
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
