"use client";

import { useState } from "react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { Reveal } from "@/components/ui/reveal";
import { clipEmbedUrl, type Clip } from "@/lib/stream/extras";
import { useStreamStatus } from "@/lib/stream/useStreamStatus";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { BUTTON_GHOST, DISPLAY_TRACKING, WRAP } from "@/utils/ui.classes";
import { SectionHead } from "./SectionHead";

type ShownClip = Omit<Clip, "show">;

/**
 * The clip picked in the control room. Nothing third-party loads until a
 * visitor taps play: the player is only created then.
 */
export function LatestClip() {
  const clip = useStreamStatus()?.status.clip ?? null;
  if (!clip) return null;
  return <ClipSection key={`${clip.platform}:${clip.id}`} clip={clip} />;
}

function ClipSection({ clip }: { clip: ShownClip }) {
  const t = en.clip;
  const [src, setSrc] = useState<string | null>(null);
  const platform = t.platforms[clip.platform];
  const portrait = clip.platform === "tiktok";
  const playLabel = clip.title ? interpolate(t.play, { title: clip.title }) : t.playFallback;

  return (
    <section id="clip" aria-labelledby="clip-title" className={`${WRAP} py-section`}>
      <SectionHead
        id="clip-title"
        label={t.label}
        titleLead={t.titleLead}
        titleAccent={t.titleAccent}
      />
      <div className="grid grid-cols-1 items-center gap-6 sm:gap-10 md:grid-cols-[auto_minmax(0,1fr)]">
        <Reveal
          effect="pop"
          className={`relative overflow-hidden bg-ink-2 cut ${
            portrait
              ? "aspect-[9/16] w-full max-w-[22rem] justify-self-center md:w-[22rem]"
              : "aspect-video w-full md:w-[40rem]"
          }`}
        >
          {src ? (
            <iframe
              src={src}
              title={clip.title || playLabel}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <button
              type="button"
              aria-label={playLabel}
              onClick={() => setSrc(clipEmbedUrl(clip, window.location.hostname))}
              className="group absolute inset-0 flex items-center justify-center bg-[linear-gradient(160deg,var(--color-ink-3),var(--color-ink))] focus-visible:outline-offset-[-4px]"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-tq transition-transform duration-300 ease-smooth group-hover:scale-110 sm:size-24">
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" fill="currentColor" className="text-ink" />
                </svg>
              </span>
              <span className="absolute top-3.5 left-3.5 bg-ink px-2.5 py-1.5 label-mono text-[11px] font-extrabold text-paper cut-s">
                {[platform, clip.tag].filter(Boolean).join(" · ")}
              </span>
            </button>
          )}
        </Reveal>
        <div className="flex flex-col items-start gap-4 sm:gap-6">
          {clip.title ? (
            <p
              className={`m-0 font-display text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] leading-[0.95] ${DISPLAY_TRACKING}`}
            >
              {clip.title}
            </p>
          ) : null}
          <ExternalLink href={clip.url} className={BUTTON_GHOST}>
            {interpolate(t.watchOn, { platform })}
          </ExternalLink>
          {!src ? (
            <p className="m-0 text-sm text-muted">{interpolate(t.note, { platform })}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
