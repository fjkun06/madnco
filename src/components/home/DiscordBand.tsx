import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, siteConfig } from "@/utils/app.constants";
import { BUTTON_INK, DISPLAY_TRACKING, WRAP } from "@/utils/ui.classes";

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
 * 03 / Home base — the wine band that sends people to the Discord. Without a
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
      className="band-stripes relative border-t-4 border-tq bg-wine py-band"
    >
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-[clamp(2.25rem,1.5rem+2.4vw,3rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
      >
        <div>
          <Reveal as="span" className="block label-mono text-[13px] font-bold text-paper">
            {t.label}
          </Reveal>
          <Reveal
            as="h2"
            effect="wipe"
            delay={0.1}
            id="discord-title"
            className={`mt-3.5 mb-0 font-display text-band leading-[0.85] text-paper ${DISPLAY_TRACKING}`}
          >
            {t.titleLead} <span className="text-tq">{t.titleAccent}</span>
          </Reveal>
          <Reveal
            as="p"
            delay={0.25}
            className="mt-6 mb-9 max-w-[32.5rem] text-[clamp(1.125rem,1rem+0.4vw,1.25rem)] leading-normal"
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
              className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-bordeaux cut"
            />
            {href ? (
              <a href={href} className={`${BUTTON_INK} relative w-full`}>
                {t.cta}
                <ArrowUpRight aria-hidden="true" size={18} strokeWidth={2.5} />
              </a>
            ) : (
              <span data-nosnippet className={`${BUTTON_INK} relative w-full`}>
                {t.missing}
              </span>
            )}
          </Reveal>
        </div>

        <Reveal effect="slide-right" delay={0.15} className="bg-ink p-6 cut">
          <span className="mb-3.5 block label-mono text-xs text-muted">
            {t.channelsLabel}
          </span>
          <RevealGroup
            as="ul"
            delay={0.2}
            aria-label={t.channelsAria}
            className="m-0 flex list-none flex-col gap-1.5 p-0"
          >
            {channels.map(({ glyph, name }, i) => (
              <RevealItem
                as="li"
                key={name}
                effect="slide-right"
                className={`flex items-center gap-3 px-3.5 py-3 text-[17px] font-medium ${i === 0 ? "bg-ink-3" : "bg-ink-2"}`}
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
