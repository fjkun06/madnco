"use client";

import { ExternalLink } from "@/components/ui/ExternalLink";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";

/** Second hero button: "Watch the lives" (TikTok), or "Watch live now" (Twitch) while live. */
export function HeroLiveCta({ className }: { className: string }) {
  const live = useStreamStatus()?.status.live ?? false;
  return (
    <ExternalLink
      href={live ? siteConfig.links.twitch : siteConfig.links.tiktokLive}
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
