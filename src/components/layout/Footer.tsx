import Link from "next/link";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { WRAP } from "@/utils/ui.classes";
import { FooterSign } from "./FooterSign";
import { MotionToggle } from "./MotionToggle";
import { ExternalLink } from "@/components/ui/ExternalLink";

/**
 * The ENDLESS MADNESS sign (full width, see FooterSign), then credits, legal
 * links and the pause switch.
 */
export function Footer() {
  const t = en.footer;
  return (
    <footer
      className={`${WRAP} pt-[clamp(3rem,1.6rem+5.6vw,6.875rem)] pb-[clamp(1.75rem,1rem+3vw,3.5rem)]`}
    >
      <FooterSign first={t.outlineA} second={t.outlineB} />
      <div className="mt-[22px] flex flex-wrap justify-between gap-2.5 label-mono text-[10px] text-muted sm:mt-12 sm:gap-5 sm:text-xs">
        <span>{t.credit}</span>
        <nav aria-label="Legal" className="flex flex-wrap gap-2.5 sm:gap-5">
          <Link href="/impressum" className="underline-offset-2 hover:text-tq">
            {t.impressum}
          </Link>
          <Link href="/privacy" className="underline-offset-2 hover:text-tq">
            {t.privacy}
          </Link>
          <MotionToggle pause={t.pause} play={t.play} />
        </nav>
        <ExternalLink
          href={siteConfig.builderUrl}
          className="underline-offset-2 hover:text-tq"
        >
          {t.builtBy}
        </ExternalLink>
      </div>
    </footer>
  );
}
