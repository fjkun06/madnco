import { ArrowUpRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { confirmedHref, siteConfig } from "@/utils/app.constants";
import { BUTTON_INK, WRAP } from "@/utils/ui.classes";

/** Channels shown in the server preview; the first one gets the PING badge. */
const channels = ["live-now", "memes-and-funny", "clips", "fifa", "suggestions"] as const;

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
      className="band-stripes relative border-t-4 border-tq bg-wine py-[72px] md:py-[110px]"
    >
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-9 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-12`}
      >
        <div>
          <Reveal as="span" className="label-mono block text-[13px] font-bold text-paper">
            {t.label}
          </Reveal>
          <Reveal
            as="h2"
            effect="wipe"
            delay={0.1}
            id="discord-title"
            className="font-display mt-3.5 mb-0 text-[68px] leading-[0.85] text-paper md:text-[clamp(64px,8vw,128px)]"
          >
            {t.titleLead} <span className="text-tq">{t.titleAccent}</span>
          </Reveal>
          <Reveal
            as="p"
            delay={0.25}
            className="mt-6 mb-9 max-w-[520px] text-lg leading-normal md:text-xl"
          >
            {t.text}
          </Reveal>
          <Reveal
            effect="pop"
            delay={0.4}
            className="relative inline-flex w-full md:w-auto"
          >
            <span
              aria-hidden="true"
              className="cut absolute inset-0 translate-x-1.5 translate-y-1.5 bg-ink-3"
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

        <Reveal effect="slide-right" delay={0.15} className="cut bg-ink p-6">
          <span className="label-mono mb-3.5 block text-xs text-muted">
            {t.channelsLabel}
          </span>
          <RevealGroup
            as="ul"
            delay={0.2}
            aria-label={t.channelsAria}
            className="m-0 flex list-none flex-col gap-1.5 p-0"
          >
            {channels.map((name, i) => (
              <RevealItem
                as="li"
                key={name}
                effect="slide-right"
                className={`flex items-center gap-3 px-3.5 py-3 text-[17px] font-medium ${i === 0 ? "bg-ink-3" : "bg-ink-2"}`}
              >
                <span aria-hidden="true" className="font-mono font-extrabold text-tq">
                  #
                </span>
                {name}
                {i === 0 && (
                  <span className="label-mono ml-auto bg-live px-1.5 py-1 text-[11px] font-extrabold text-ink">
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
