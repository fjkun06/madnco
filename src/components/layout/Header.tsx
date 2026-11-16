import { Radio } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import { WRAP } from "@/utils/ui.classes";
import { MobileMenu, type NavLink } from "./MobileMenu";
import { StickyHeader } from "./StickyHeader";
import { ExternalLink } from "@/components/ui/ExternalLink";

/**
 * Top bar: logo, in-page nav, where the lives happen, and a Discord button.
 * Links point at "/#section" so they also work from the legal pages; the
 * bar sticks to the top and slides in or out with the scroll direction.
 * There is no live/offline badge on purpose: TikTok offers no public live
 * status, and a hand-set one would be wrong most of the time.
 */
export function Header() {
  const t = en.nav;
  const links: NavLink[] = [
    { href: "/#crew", label: t.crew },
    { href: "/#what", label: t.what },
    { href: "/#discord", label: t.discord },
    { href: "/#links", label: t.links },
  ];
  return (
    <StickyHeader>
      <header
        className={`${WRAP} relative flex h-16 items-center justify-between gap-4 sm:h-[72px] sm:gap-6 md:h-[84px]`}
      >
        <Link href="/#top" aria-label={t.home} className="flex shrink-0 items-center no-underline">
          {/* M + skull + C. A static SVG (masks + shading) rather than inline
              markup, so the header HTML stays small and the file is cached. */}
          <Image
            src="/madnco-logo.svg"
            alt=""
            width={320}
            height={178}
            unoptimized
            priority
            className="h-[46px] w-auto sm:h-[54px] md:h-[66px]"
          />
        </Link>
        <nav
          aria-label={t.label}
          className="hidden items-center gap-[clamp(1.25rem,2.4vw,2rem)] lg:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="label-mono text-[13px] whitespace-nowrap text-muted no-underline hover:text-tq"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-3.5">
          <ExternalLink
            href={siteConfig.links.tiktokLive}
            className="hidden h-9 items-center gap-2.5 bg-ink-3 px-3.5 label-mono text-xs font-extrabold text-muted no-underline whitespace-nowrap cut-s hover:text-paper md:inline-flex"
          >
            <Radio aria-hidden="true" size={16} strokeWidth={2.5} className="text-live" />
            {interpolate(en.live.pill, { handle: siteConfig.handles.tiktokLive })}
          </ExternalLink>
          <Link
            href="/#discord"
            className="inline-flex min-h-10 items-center bg-tq px-3.5 label-mono text-[11px] font-extrabold sm:min-h-11 sm:px-[18px] sm:text-[13px] text-ink no-underline focus-inset transition-colors duration-300 ease-smooth whitespace-nowrap cut hover:bg-paper"
          >
            {t.joinDiscord}
          </Link>
          <MobileMenu links={links} openLabel={t.openMenu} closeLabel={t.closeMenu} />
        </div>
      </header>
    </StickyHeader>
  );
}
