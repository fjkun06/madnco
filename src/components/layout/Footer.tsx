import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { WRAP } from "@/utils/ui.classes";
import { MotionToggle } from "./MotionToggle";

/**
 * Outlined ENDLESS MADNESS sign whose solid copy wipes in over the outline,
 * then credits, legal links and the pause switch.
 */
export function Footer() {
  const t = en.footer;
  const line =
    "font-display m-0 text-[64px] leading-[0.85] md:text-[clamp(70px,11vw,170px)] md:whitespace-nowrap";
  return (
    <footer className={`${WRAP} pt-[72px] pb-10 md:pt-[110px] md:pb-14`}>
      <div className="relative" aria-label={`${t.outlineA} ${t.outlineB}`} role="img">
        <p aria-hidden="true" className={`${line} text-outline`}>
          {t.outlineA}{" "}
          <span className="text-tq [-webkit-text-stroke:0]">{t.outlineB}</span>
        </p>
        <Reveal
          as="p"
          effect="wipe"
          aria-hidden
          className={`${line} absolute inset-0 text-paper`}
        >
          {t.outlineA} <span className="text-tq">{t.outlineB}</span>
        </Reveal>
      </div>
      <div className="label-mono mt-12 flex flex-wrap justify-between gap-5 text-xs text-muted">
        <span>{t.credit}</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-5">
          <Link href="/impressum" className="no-underline hover:text-tq">
            {t.impressum}
          </Link>
          <Link href="/privacy" className="no-underline hover:text-tq">
            {t.privacy}
          </Link>
          <MotionToggle pause={t.pause} play={t.play} />
        </nav>
        <a href={siteConfig.builderUrl} className="no-underline hover:text-tq">
          {t.builtBy}
        </a>
      </div>
    </footer>
  );
}
