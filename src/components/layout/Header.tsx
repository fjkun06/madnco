import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/seo/metadata";
import { en } from "@/locales/en";
import { WRAP } from "@/utils/ui.classes";
import { MobileMenu, type NavLink } from "./MobileMenu";
import { StickyHeader } from "./StickyHeader";
import { LivePill } from "@/components/live/LivePill";

/**
 * Top bar: logo, in-page nav, where the lives happen, and a Discord button.
 * Links point at "/#section" so they also work from other pages (and /build
 * is its own page); the
 * bar sticks to the top and slides in or out with the scroll direction.
 * The pill turns red while Twitch says @madnco8 is live (or the admin forces
 * it, see /admin); TikTok has no public live status, so it never decides.
 */
export function Header() {
  const t = en.nav;
  const links: NavLink[] = [
    { href: "/#crew", label: t.crew },
    { href: "/#what", label: t.what },
    { href: "/#discord", label: t.discord },
    { href: "/#links", label: t.links },
    { href: routes.build, label: t.build },
  ];
  return (
    <StickyHeader>
      <header
        className={`${WRAP} relative flex h-16 items-center justify-between gap-4 sm:h-[72px] sm:gap-6 md:h-[84px]`}
      >
        <Link
          href="/#top"
          aria-label={t.home}
          className="flex shrink-0 items-center no-underline"
        >
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
          <LivePill />
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
