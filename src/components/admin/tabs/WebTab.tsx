"use client";

import { CLIP_TAG_MAX, CLIP_TITLE_MAX, parseClipUrl } from "@/lib/stream/extras";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { Card } from "../Card";
import { CHIP, CHIP_OFF, CHIP_ON, ERROR_LINE, INPUT, LABEL } from "../fields";
import { Toggle } from "../Toggle";
import type { TabProps } from "./shared";

export function WebTab({ form, update, issueFor }: TabProps) {
  const t = en.admin.clip;
  const parsed = parseClipUrl(form.clipUrl);
  const issue = issueFor("clipUrl");
  const customTag = form.clipTag && !(t.tags as readonly string[]).includes(form.clipTag);

  return (
    <div className="flex flex-col gap-7">
      <Card title={t.title} hint={t.hint}>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.link}</span>
          <input
            type="url"
            inputMode="url"
            value={form.clipUrl}
            placeholder={t.placeholder}
            aria-invalid={issue ? true : undefined}
            aria-describedby={issue ? "clip-issue" : parsed ? "clip-ok" : undefined}
            onChange={(event) => update({ clipUrl: event.target.value })}
            className={`${INPUT} ${issue ? "border-live" : ""}`}
          />
        </label>
        {issue ? (
          <p id="clip-issue" className={ERROR_LINE}>
            <span aria-hidden="true">✕</span>
            {issue}
          </p>
        ) : parsed ? (
          <p id="clip-ok" className="m-0 label-mono text-xs font-extrabold text-tq">
            ✓ {t.detected[parsed.platform]}
          </p>
        ) : null}
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.titleLabel}</span>
          <input
            type="text"
            maxLength={CLIP_TITLE_MAX}
            value={form.clipTitle}
            placeholder={t.titlePlaceholder}
            onChange={(event) => update({ clipTitle: event.target.value })}
            className={INPUT}
          />
        </label>
        <div className="flex flex-col gap-2">
          <span id="clip-tag" className={LABEL}>
            {t.tag}
          </span>
          <div role="group" aria-labelledby="clip-tag" className="flex flex-wrap gap-2">
            {t.tags.map((tag) => {
              const on = form.clipTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ clipTag: on ? "" : tag })}
                  className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  {tag}
                </button>
              );
            })}
            <input
              type="text"
              aria-label={t.tag}
              maxLength={CLIP_TAG_MAX}
              value={customTag ? form.clipTag : ""}
              placeholder="…"
              onChange={(event) => update({ clipTag: event.target.value })}
              className={`${INPUT} min-h-11 w-32 text-base`}
            />
          </div>
        </div>
        <Toggle checked={form.clipShow} onChange={(clipShow) => update({ clipShow })}>
          {t.show}
        </Toggle>
        <p className="m-0 text-sm leading-relaxed text-muted">{t.help}</p>
        {form.clipUrl ? (
          <button
            type="button"
            onClick={() => update({ clipUrl: "", clipTitle: "", clipTag: "", clipShow: true })}
            className={`${CHIP} ${CHIP_OFF} self-start`}
          >
            {t.remove}
          </button>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3">
        <span className={LABEL}>{t.preview}</span>
        {parsed ? (
          <div
            className={`flex flex-col gap-4 bg-ink-2 p-7 cut ${form.clipShow ? "" : "opacity-40"}`}
          >
            <span className="label-mono text-xs font-extrabold text-bordeaux-hi">
              {en.clip.label}
            </span>
            <div
              className={`relative flex items-center justify-center bg-[linear-gradient(160deg,var(--color-ink-3),var(--color-ink))] cut ${
                parsed.platform === "tiktok" ? "aspect-[9/12]" : "aspect-video"
              }`}
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-tq">
                <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" fill="currentColor" className="text-ink" />
                </svg>
              </span>
              <span className="absolute top-3.5 left-3.5 bg-ink px-2.5 py-1.5 label-mono text-[11px] font-extrabold cut-s">
                {[en.clip.platforms[parsed.platform], form.clipTag].filter(Boolean).join(" · ")}
              </span>
            </div>
            {form.clipTitle ? (
              <p className="m-0 font-display text-[32px] leading-none">{form.clipTitle}</p>
            ) : null}
            <span className="self-start px-5 py-3 label-mono text-xs font-extrabold shadow-[inset_0_0_0_2px_var(--color-ink-3)] cut-s">
              {interpolate(en.clip.watchOn, { platform: en.clip.platforms[parsed.platform] })}
            </span>
          </div>
        ) : (
          <p className="m-0 bg-ink-2 p-7 text-muted cut">{t.none}</p>
        )}
      </div>
    </div>
  );
}
