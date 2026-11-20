"use client";

import { useState } from "react";
import {
  CANVASES,
  CO_NAME_MAX,
  GUEST_LINE_MAX,
  HOST_MAX,
  cleanHandle,
  pickCo,
  type Canvas,
  type Channels,
} from "@/lib/stream/channels";
import { en } from "@/locales/en";
import { Card } from "../Card";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, INPUT, LABEL } from "../fields";
import { Toggle } from "../Toggle";
import type { TabProps } from "./shared";

const OPT =
  "focus-inset flex min-h-20 flex-1 flex-col justify-center gap-1 border-2 px-4 py-3 text-left cut-s transition-colors duration-200";

/** "Where are we live?": Home (@madnco8) or Guest (a borrowed channel), per canvas. */
export function ChannelsCard({ form, update }: Pick<TabProps, "form" | "update">) {
  const t = en.admin.channels;
  const ch = form.channels;
  const set = (patch: Partial<Channels>) => update({ channels: { ...ch, ...patch } });
  const setMode = (canvas: Canvas, patch: Partial<Channels[Canvas]>) =>
    set({ [canvas]: { ...ch[canvas], ...patch } });

  return (
    <Card title={t.title} hint={t.hint}>
      <p className="m-0 text-[15px] leading-relaxed text-muted">{t.help}</p>
      {CANVASES.map((canvas) => {
        const mode = ch[canvas];
        return (
          <div key={canvas} className="flex flex-col gap-2">
            <span className={LABEL}>{t.canvases[canvas]}</span>
            <div role="group" aria-label={t.canvases[canvas]} className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!mode.guest}
                onClick={() => setMode(canvas, { guest: false })}
                className={`${OPT} ${!mode.guest ? "border-tq bg-[#0f1d1c]" : "border-ink-3 bg-ink hover:border-tq"}`}
              >
                <span className="label-mono text-[11px] font-extrabold text-muted">{t.home}</span>
                <span className="font-display text-2xl leading-none">@madnco8</span>
              </button>
              <div
                className={`${OPT} ${mode.guest ? "border-bordeaux-hi bg-[#24101a]" : "border-ink-3 bg-ink"}`}
              >
                <button
                  type="button"
                  aria-pressed={mode.guest}
                  onClick={() => setMode(canvas, { guest: true })}
                  className="focus-inset cursor-pointer text-left label-mono text-[11px] font-extrabold text-muted"
                >
                  {mode.guest ? t.guestOn : t.useGuest}
                </button>
                <input
                  aria-label={t.hostLabel[canvas]}
                  aria-invalid={!cleanHandle(mode.host)}
                  value={mode.host}
                  maxLength={HOST_MAX}
                  onChange={(e) => setMode(canvas, { host: e.target.value, guest: true })}
                  onBlur={() => setMode(canvas, { host: cleanHandle(mode.host) || mode.host })}
                  className={`w-full border-0 border-b-2 bg-transparent font-display text-2xl leading-tight text-paper outline-none ${
                    cleanHandle(mode.host)
                      ? "border-transparent focus:border-bordeaux-hi"
                      : "border-live"
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}
      <label className="flex flex-col gap-2">
        <span className={LABEL}>{t.guestLine}</span>
        <input
          value={ch.guestLine}
          maxLength={GUEST_LINE_MAX}
          placeholder={t.guestLinePlaceholder}
          onChange={(e) => set({ guestLine: e.target.value })}
          className={INPUT}
        />
      </label>
      <Toggle checked={ch.homeCard} onChange={(homeCard) => set({ homeCard })}>
        {t.homeCard}
      </Toggle>
    </Card>
  );
}

/** "Co tonight": pick from the roster, add a new Co, or go solo. */
export function CoCard({ form, update }: Pick<TabProps, "form" | "update">) {
  const t = en.admin.co;
  const co = form.co;
  const [name, setName] = useState("");
  const pick = (next: string) => update({ co: pickCo(co, next) });

  return (
    <Card title={t.title} hint={t.hint}>
      <div role="group" aria-label={t.title} className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={co.name === ""}
          onClick={() => pick("")}
          className={`${CHIP} ${co.name === "" ? CHIP_ON : CHIP_OFF}`}
        >
          {t.solo}
        </button>
        {co.roster.map((member) => (
          <button
            key={member}
            type="button"
            aria-pressed={co.name === member}
            onClick={() => pick(member)}
            className={`${CHIP} ${co.name === member ? CHIP_ON : CHIP_OFF}`}
          >
            {member}
          </button>
        ))}
      </div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          pick(name);
          setName("");
        }}
      >
        <input
          aria-label={t.newLabel}
          placeholder={t.newPlaceholder}
          value={name}
          maxLength={CO_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          className={`${INPUT} max-w-72`}
        />
        <button type="submit" disabled={!name.trim()} className={`${CHIP} ${CHIP_OFF}`}>
          {t.add}
        </button>
      </form>
      {co.roster.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-mono text-[11px] font-extrabold text-muted">{t.remove}</span>
          {co.roster.map((member) => (
            <button
              key={member}
              type="button"
              aria-label={`${t.remove} ${member}`}
              onClick={() =>
                update({
                  co: {
                    name: co.name === member ? "" : co.name,
                    roster: co.roster.filter((m) => m !== member),
                  },
                })
              }
              className={`${CHIP_SM} ${CHIP_OFF}`}
            >
              {member} ✕
            </button>
          ))}
        </div>
      ) : null}
      <p className="m-0 text-[15px] leading-relaxed text-muted">{t.help}</p>
    </Card>
  );
}
