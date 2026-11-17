"use client";

import { formatNextWhen, nowPlayingText } from "@/lib/stream/state";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";

/**
 * Bottom of the hero's game screen. Live: today's game and topic.
 * Offline with a next stream planned: when and what. Otherwise the
 * evergreen "FIFA · RP · Story mode".
 */
export function NowPlaying() {
  const snap = useStreamStatus();
  const status = snap?.status;

  let label: string = en.hero.nowPlayingLabel;
  let value: string = en.hero.nowPlaying;
  if (status?.live) {
    value = nowPlayingText(status) || value;
  } else if (status?.next && snap) {
    label = en.live.nextLabel;
    value = [formatNextWhen(status.next.at, snap.at), status.next.plan]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-4 label-mono sm:inset-x-[26px] sm:bottom-[22px]">
      <p className="m-0 text-[10px] leading-[1.6] text-muted sm:text-xs sm:leading-[1.8]">
        {label}
        <b className="block text-xs text-paper sm:text-[15px]">{value}</b>
      </p>
      {status?.live ? (
        <span className="bg-live px-3 py-2 text-[11px] font-extrabold text-ink sm:text-[13px]">
          {en.live.pillLive.split(" · ")[0]}
        </span>
      ) : null}
    </div>
  );
}
