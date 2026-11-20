"use client";

import { ExternalLink } from "@/components/ui/ExternalLink";
import { liveLinks } from "@/lib/stream/liveLinks";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";

/** Second hero button: "Watch the lives" (TikTok), or "Watch live now" (Twitch) while live. */
export function HeroLiveCta({ className }: { className: string }) {
  const status = useStreamStatus()?.status;
  const live = status?.live ?? false;
  const links = liveLinks(status);
  return (
    <ExternalLink
      href={live ? links.live.href : links.lives.href}
      className={className}
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full bg-live sm:size-2.5 ${live ? "live-dot" : ""}`}
      />
      {live ? en.live.ctaLive : en.hero.ctaLive}
    </ExternalLink>
  );
}
