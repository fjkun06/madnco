import Link from "next/link";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { WRAP } from "@/utils/ui.classes";
import { FooterSign } from "./FooterSign";
import { MotionToggle } from "./MotionToggle";

/**
 * The ENDLESS MADNESS sign (full width, see FooterSign), then credits, legal
 * links and the pause switch.
 */
export function Footer() {
  const t = en.footer;
  return (
    <footer className={`${WRAP} pt-band pb-[clamp(2.5rem,2rem+1.5vw,3.5rem)]`}>
      <FooterSign first={t.outlineA} second={t.outlineB} />
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
