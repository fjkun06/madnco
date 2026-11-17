"use client";

import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import type { ToastKind } from "./Toasts";

const ROW =
  "group flex flex-col gap-2.5 bg-ink px-3.5 py-3 transition-colors duration-200 hover:bg-ink-3/60";
const NAME =
  "focus-inset flex items-center gap-2 text-[15px] font-bold text-paper hover:text-tq";
const PART =
  "focus-inset flex min-h-9 items-center gap-1.5 px-2.5 label-mono text-[11px] font-extrabold transition-colors duration-200";

const overlayUrl = (file: string) => `${siteConfig.url}/overlay/${file}.html`;

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
      <rect x="4.5" y="4.5" width="8" height="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 9.5V2h7.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * One format of a scene: opens the overlay, plus a copy button for the
 * OBS browser source URL.
 */
function FormatLink({
  name,
  format,
  url,
  onToast,
}: {
  name: string;
  format: string;
  url: string;
  onToast: (kind: ToastKind, title: string, text: string) => void;
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

/** The scenes the admin feeds, each clickable, with 16:9 and 9:16 links. */
export function WhereItShows({
  onToast,
}: {
  onToast: (kind: ToastKind, title: string, text: string) => void;
}) {
  const w = en.admin.where;

  return (
    <aside
      aria-labelledby="where-title"
      className="flex flex-col gap-4 bg-ink-2 p-5 cut sm:p-7 lg:sticky lg:top-28"
    >
      <h2 id="where-title" className="m-0 font-display text-[26px] leading-none">
        {w.title}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {w.scenes.map((scene) => {
          const landscape = overlayUrl(scene.file);
          return (
            <li key={scene.file} className={ROW}>
              <div className="flex items-baseline justify-between gap-3">
                <a
                  href={landscape}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={NAME}
                >
                  {scene.name}
                  <span className="text-muted transition-colors group-hover:text-tq">
                    <Arrow />
                  </span>
                </a>
                <b className="label-mono text-right text-xs text-tq">{scene.what}</b>
              </div>
              <div className="flex flex-wrap gap-2">
                <FormatLink
                  name={scene.name}
                  format={w.landscape}
                  url={landscape}
                  onToast={onToast}
                />
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
        <li className={`${ROW} flex-row items-baseline justify-between`}>
          <a href="/" target="_blank" rel="noopener noreferrer" className={NAME}>
            {w.website.name}
            <span className="text-muted transition-colors group-hover:text-tq">
              <Arrow />
            </span>
          </a>
          <b className="label-mono text-right text-xs text-tq">{w.website.what}</b>
        </li>
      </ul>
      <p className="m-0 text-sm leading-relaxed text-muted">{w.note}</p>
    </aside>
  );
}
