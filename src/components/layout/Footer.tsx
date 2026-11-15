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
  const line = "font-display m-0 text-sign leading-[0.85] text-balance";
  return (
    <footer className={`${WRAP} pt-band pb-[clamp(2.5rem,2rem+1.5vw,3.5rem)]`}>
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
      <div className="mt-12 flex flex-wrap justify-between gap-5 label-mono text-xs text-muted">
        <span>{t.credit}</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-5">
          <Link href="/impressum" className="underline-offset-2 hover:text-tq">
            {t.impressum}
          </Link>
          <Link href="/privacy" className="underline-offset-2 hover:text-tq">
            {t.privacy}
          </Link>
          <MotionToggle pause={t.pause} play={t.play} />
        </nav>
        <a href={siteConfig.builderUrl} className="underline-offset-2 hover:text-tq">
          {t.builtBy}
        </a>
      </div>
    </footer>
  );
}
