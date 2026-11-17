import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, siteConfig } from "@/utils/app.constants";
import { BUTTON_INK, DISPLAY_TRACKING, WRAP } from "@/utils/ui.classes";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";

/**
 * Channels shown in the server preview: text channels (#) and a voice
 * channel (>). The first one gets the PING badge.
 */
const channels = [
  { glyph: "#", name: "live-now" },
  { glyph: "#", name: "memes-and-funny" },
  { glyph: "#", name: "clips" },
  { glyph: "#", name: "fifa" },
  { glyph: "#", name: "suggestions" },
  { glyph: ">", name: "Gaming · voice" },
] as const;

/**
 * 03 / Home base — the wine band that sends people to the Discord. Its stripes
 * drift with the scroll. Without a
 * confirmed invite link the button shows a visible placeholder instead of
 * a dead link.
 */
export function DiscordBand() {
  const t = en.discord;
  const href = confirmedHref(siteConfig.links.discord);
  return (
    <section
      id="discord"
      aria-labelledby="discord-title"
      className="relative overflow-clip border-t-4 border-tq bg-wine py-band"
    >
      {/* Stripes drift against the scroll for depth (their own scroll tracker,
          so nothing else in the band sits inside a motion wrapper). */}
      <ScrollProgress
        aria-hidden
        className="band-stripes pointer-events-none absolute inset-0 [background-position:0_calc(var(--p)*-260px)]"
      />
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-[clamp(1.375rem,0.8rem+2.4vw,3rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
      >
        <div>
          <Reveal
            as="span"
            className="block label-mono text-[11px] font-bold text-paper sm:text-[13px]"
          >
            {t.label}
          </Reveal>
          <Reveal
            as="h2"
            delay={0.1}
            id="discord-title"
            className={`mt-2 mb-0 font-display text-band leading-[0.85] text-paper sm:mt-3.5 ${DISPLAY_TRACKING}`}
          >
            {t.titleLead} <span className="text-tq">{t.titleAccent}</span>
          </Reveal>
          <Reveal
            as="p"
            delay={0.25}
            className="mt-3 mb-5 max-w-[32.5rem] text-[clamp(0.9375rem,0.8rem+0.55vw,1.25rem)] leading-normal sm:mt-6 sm:mb-9"
          >
            {t.text}
          </Reveal>
          <Reveal
            effect="pop"
            delay={0.4}
            className="relative inline-flex w-full sm:w-auto"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 translate-x-1 translate-y-1 bg-bordeaux cut sm:translate-x-1.5 sm:translate-y-1.5"
            />
            {href ? (
              <ExternalLink href={href} className={`${BUTTON_INK} relative w-full`}>
                {t.cta}
                <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2.5} />
              </ExternalLink>
            ) : (
              <span data-nosnippet className={`${BUTTON_INK} relative w-full`}>
                {t.missing}
              </span>
            )}
          </Reveal>
        </div>

        <Reveal effect="slide-right" delay={0.15} className="bg-ink p-3.5 cut sm:p-6">
          <span className="mb-2.5 block label-mono text-[10px] text-muted sm:mb-3.5 sm:text-xs">
            {t.channelsLabel}
          </span>
          <RevealGroup
            as="ul"
            delay={0.2}
            aria-label={t.channelsAria}
            className="m-0 flex list-none flex-col gap-1 p-0 sm:gap-1.5"
          >
            {channels.map(({ glyph, name }, i) => (
              <RevealItem
                as="li"
                key={name}
                effect="slide-right"
                className={`flex items-center gap-3 px-3 py-[9px] text-sm font-medium sm:px-3.5 sm:py-3 sm:text-[17px] ${i === 0 ? "bg-ink-3" : "bg-ink-2"}`}
              >
                <span aria-hidden="true" className="font-mono font-extrabold text-tq">
                  {glyph}
                </span>
                {name}
                {i === 0 && (
                  <span className="ml-auto bg-live px-[7px] py-1 label-mono text-[11px] font-extrabold text-ink">
                    {t.ping}
                  </span>
                )}
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>
      </div>
    </section>
  );
}
