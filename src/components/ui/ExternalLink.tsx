import type { AnchorHTMLAttributes, ReactNode } from "react";
import { en } from "@/locales/en";

/**
 * A link to another site (TikTok, Twitch, YouTube, Discord …). Opens in a new
 * tab so the hub stays open, without giving the other site access to this
 * page (`noopener noreferrer`). Screen readers hear "(opens in a new tab)".
 */
export function ExternalLink({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) {
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> {en.a11y.newTab}</span>
    </a>
  );
}
