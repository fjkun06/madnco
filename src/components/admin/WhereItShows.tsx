"use client";

import { useState } from "react";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import type { ToastKind } from "./Toasts";

const PART =
  "focus-inset flex min-h-9 items-center gap-1.5 px-2.5 label-mono text-[11px] font-extrabold transition-colors duration-200";
const NAME =
  "focus-inset flex items-center gap-1.5 text-[15px] font-bold text-paper hover:text-tq";

type Format = "landscape" | "portrait";
type Toast = (kind: ToastKind, title: string, text: string) => void;

/** Same-origin path for the preview, absolute URL for OBS. */
const overlayPath = (file: string) => `/overlay/${file}.html`;
const overlayUrl = (file: string) => `${siteConfig.url}${overlayPath(file)}`;

function Arrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" fill="none">
      <path d="M3 9 9 3M4 3h5v5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" fill="none">
      <rect
        x="4.5"
        y="4.5"
        width="8"
        height="8"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M2 9.5V2h7.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** Open (↗) and copy-for-OBS for one format of a scene. */
function FormatLink({
  name,
  format,
  url,
  onToast,
}: {
  name: string;
  format: string;
  url: string;
  onToast: Toast;
}) {
  const w = en.admin.where;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      onToast("ok", w.copiedTitle, interpolate(w.copiedText, { name, format }));
    } catch {
      onToast("error", w.copiedTitle, w.copyFailed);
    }
  }

  return (
    <span className="inline-flex cut-s">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={interpolate(w.openLabel, { name, format })}
        className={`${PART} bg-ink-3 text-tq hover:bg-tq hover:text-ink`}
      >
        {format}
        <Arrow />
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={interpolate(w.copyLabel, { name, format })}
        className={`${PART} border-l border-ink bg-ink-3 text-muted hover:bg-bordeaux hover:text-paper`}
      >
        <CopyIcon />
      </button>
    </span>
  );
}

/**
 * A live, scaled-down overlay. The overlay pages scale themselves to their
 * window, so the iframe only needs the right shape. Not focusable: the
 * links next to it are the way in.
 */
function Thumb({ file, format, name }: { file: string; format: Format; name: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-ink cut-s ${
        format === "landscape" ? "aspect-video w-full" : "aspect-[9/16] w-full"
      }`}
    >
      <iframe
        src={overlayPath(file)}
        title={name}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full border-0"
      />
    </div>
  );
}

/**
 * The sidebar on every tab: live previews of the overlays (saved state),
 * each with open and copy-for-OBS links for both formats.
 */
export function WhereItShows({ onToast }: { onToast: Toast }) {
  const w = en.admin.where;
  const p = en.admin.preview;
  const [format, setFormat] = useState<Format>("landscape");
  const scenes = w.scenes.filter((scene) => format === "landscape" || scene.vertical);

  return (
    <aside
      aria-labelledby="where-title"
      className="flex flex-col gap-4 bg-ink-2 p-5 cut sm:p-7 lg:sticky lg:top-40 lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto lg:overscroll-contain"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="where-title" className="m-0 font-display text-[26px] leading-none">
          {p.title}
        </h2>
        <div role="group" aria-label={p.format} className="flex gap-1.5">
          {(["landscape", "portrait"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={format === key}
              onClick={() => setFormat(key)}
              className={`min-h-9 px-3 label-mono text-[11px] font-extrabold focus-inset cut-s ${
                format === key
                  ? "bg-tq text-ink"
                  : "bg-ink-3 text-paper hover:bg-bordeaux"
              }`}
            >
              {key === "landscape" ? w.landscape : w.portrait}
            </button>
          ))}
        </div>
      </div>
      <p className="m-0 text-sm leading-relaxed text-muted">{p.note}</p>

      <ul
        className={`m-0 grid list-none gap-3.5 p-0 ${
          format === "landscape" ? "grid-cols-1" : "grid-cols-3"
        }`}
      >
        {scenes.map((scene) => {
          const file = format === "landscape" ? scene.file : `v-${scene.file}`;
          return (
            <li key={scene.file} className="flex flex-col gap-2">
              <Thumb file={file} format={format} name={scene.name} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a
                  href={overlayUrl(file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={NAME}
                >
                  {scene.name}
                  <Arrow />
                </a>
                {format === "landscape" ? (
                  <span className="label-mono text-[11px] text-tq">{scene.what}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {format === "landscape" ? (
                  <FormatLink
                    name={scene.name}
                    format={w.landscape}
                    url={overlayUrl(scene.file)}
                    onToast={onToast}
                  />
                ) : null}
                {scene.vertical ? (
                  <FormatLink
                    name={scene.name}
                    format={w.portrait}
                    url={overlayUrl(`v-${scene.file}`)}
                    onToast={onToast}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <a href="/" target="_blank" rel="noopener noreferrer" className={NAME}>
        {w.website.name}
        <Arrow />
        <span className="ml-auto label-mono text-[11px] font-normal text-tq">
          {w.website.what}
        </span>
      </a>
      <p className="m-0 text-sm leading-relaxed text-muted">{w.note}</p>
    </aside>
  );
}
