"use client";

import { Radio } from "lucide-react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";

const BASE =
  "hidden h-9 items-center gap-2.5 px-3.5 label-mono text-xs font-extrabold no-underline whitespace-nowrap cut-s md:inline-flex";

/**
 * Header pill. Offline: where the lives happen ("Lives on @clipzhub06").
 * Live (Twitch says so, or the admin forced it): a red "Live now" linking to Twitch.
 */
export function LivePill() {
  const live = useStreamStatus()?.status.live ?? false;
  if (live) {
    return (
      <ExternalLink
        href={siteConfig.links.twitch}
        className={`${BASE} bg-live text-ink hover:bg-paper`}
      >
        <span aria-hidden="true" className="live-dot size-2.5 rounded-full bg-ink" />
        {en.live.pillLive}
      </ExternalLink>
    );
  }
  return (
    <ExternalLink
      href={siteConfig.links.tiktokLive}
      className={`${BASE} bg-ink-3 text-muted hover:text-paper`}
    >
      <Radio aria-hidden="true" size={16} strokeWidth={2.5} className="text-live" />
      {interpolate(en.live.pill, { handle: siteConfig.handles.tiktokLive })}
    </ExternalLink>
  );
}
