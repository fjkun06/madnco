import { Radio } from "lucide-react";
import { Skull } from "@/components/icons/Mascots";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import { WRAP } from "@/utils/ui.classes";
import { MobileMenu, type NavLink } from "./MobileMenu";

/**
 * Top bar: logo, in-page nav, where the lives happen, and a Discord button.
 * There is no live/offline badge on purpose: TikTok offers no public live
 * status, and a hand-set one would be wrong most of the time.
 */
export function Header() {
  const t = en.nav;
  const links: NavLink[] = [
    { href: "#crew", label: t.crew },
    { href: "#what", label: t.what },
    { href: "#discord", label: t.discord },
    { href: "#links", label: t.links },
  ];
  return (
    <header
      className={`${WRAP} relative flex h-[68px] items-center justify-between gap-6 md:h-[84px]`}
    >
      <a
        href="#top"
        aria-label={t.home}
        className="flex items-center gap-2.5 font-display text-2xl text-paper no-underline md:text-[30px]"
      >
        <Skull className="h-9 w-[34px]" teeth={false} />
        <span aria-hidden="true">
          MADNCO<span className="text-tq">.</span>
        </span>
      </a>
      <nav aria-label={t.label} className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="label-mono text-[13px] text-muted no-underline hover:text-tq"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3.5">
        <a
          href={siteConfig.links.tiktokLive}
          className="hidden h-9 items-center gap-2.5 bg-ink-3 px-3.5 label-mono text-xs font-extrabold text-muted no-underline cut-s hover:text-paper sm:inline-flex"
        >
          <Radio aria-hidden="true" size={16} strokeWidth={2.5} className="text-live" />
          {interpolate(en.live.pill, { handle: siteConfig.handles.tiktokLive })}
        </a>
        <a
          href="#discord"
          className="hidden min-h-11 items-center bg-tq px-[18px] label-mono text-[13px] font-extrabold text-ink no-underline focus-inset transition-colors cut hover:bg-paper md:inline-flex"
        >
          {t.joinDiscord}
        </a>
        <MobileMenu links={links} openLabel={t.openMenu} closeLabel={t.closeMenu} />
      </div>
    </header>
  );
}
