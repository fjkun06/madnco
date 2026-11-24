"use client";

import {
  TICKER_ITEM_MAX,
  TICKER_ITEMS_MAX,
  TICKER_SCENES,
  questProgress,
  type TickerScene,
} from "@/lib/stream/extras";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { Card } from "../Card";
import { CHIP, CHIP_OFF, CHIP_ON, INPUT, LABEL } from "../fields";
import { Toggle } from "../Toggle";
import type { TabProps } from "./shared";

const MINI =
  "focus-inset flex size-11 flex-none items-center justify-center bg-ink-3 font-mono text-[15px] font-extrabold text-muted transition-colors duration-200 hover:bg-bordeaux hover:text-paper disabled:pointer-events-none disabled:opacity-30 cut-s";

export function ScreenTab({ form, update }: TabProps) {
  const t = en.admin.ticker;
  const q = en.admin.questStream;
  const items = form.tickerItems;
  const filled = items.map((item) => item.trim()).filter(Boolean);

  function setItem(index: number, value: string) {
    update({ tickerItems: items.map((item, i) => (i === index ? value : item)) });
  }
  function move(index: number, by: number) {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    update({ tickerItems: next });
  }
  function toggleScene(scene: TickerScene) {
    const on = form.tickerScenes.includes(scene);
    update({
      tickerScenes: TICKER_SCENES.filter((s) =>
        s === scene ? !on : form.tickerScenes.includes(s),
      ),
    });
  }
  const quest = form.quest;

  return (
    <div className="flex flex-col gap-7">
      <Card title={t.title} hint={t.hint}>
        <p className="m-0 text-[15px] leading-relaxed text-muted">{t.help}</p>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="text"
                aria-label={interpolate(t.item, { n: i + 1 })}
                maxLength={TICKER_ITEM_MAX}
                value={item}
                placeholder={t.placeholder}
                onChange={(event) => setItem(i, event.target.value)}
                className={`${INPUT} min-w-0 flex-1`}
              />
              <button
                type="button"
                aria-label={interpolate(t.up, { n: i + 1 })}
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className={MINI}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={interpolate(t.down, { n: i + 1 })}
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                className={MINI}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={interpolate(t.remove, { n: i + 1 })}
                onClick={() => update({ tickerItems: items.filter((_, j) => j !== i) })}
                className={`${MINI} hover:bg-live hover:text-ink`}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={items.length >= TICKER_ITEMS_MAX}
          onClick={() => update({ tickerItems: [...items, ""] })}
          className={`${CHIP} ${CHIP_OFF} self-start`}
        >
          {items.length >= TICKER_ITEMS_MAX ? t.max : t.add}
        </button>

        <div className="flex flex-col gap-2">
          <span id="ticker-scenes" className={LABEL}>
            {t.showOn}
          </span>
          <div role="group" aria-labelledby="ticker-scenes" className="flex flex-wrap gap-2">
            {TICKER_SCENES.map((scene) => {
              const on = form.tickerScenes.includes(scene);
              return (
                <button
                  key={scene}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleScene(scene)}
                  className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  {t.scenes[scene]}
                </button>
              );
            })}
          </div>
          <p className="m-0 text-[13px] leading-snug text-muted">{t.gamingNote}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className={LABEL}>{t.preview}</span>
          <div className="flex h-12 items-center overflow-hidden bg-ink">
            <span className="flex h-full flex-none items-center bg-bordeaux-hi px-4 label-mono text-[13px] font-extrabold text-ink">
              MadnCo.
            </span>
            <p className="m-0 truncate pl-5 text-lg font-bold text-paper">
              {filled.length
                ? filled.map((item, i) => (
                    <span key={i}>
                      {i > 0 ? (
                        <span aria-hidden="true" className="px-3.5 font-mono text-tq">
                          //
                        </span>
                      ) : null}
                      {item}
                    </span>
                  ))
                : <span className="font-normal text-muted">{t.empty}</span>}
            </p>
          </div>
        </div>
      </Card>

      <Card title={q.title} hint={q.hint}>
        <div className="flex flex-col gap-3.5">
          <Toggle
            checked={quest.onBrb}
            onChange={(onBrb) => update({ quest: { ...quest, onBrb } })}
          >
            {q.onBrb}
          </Toggle>
          <Toggle
            checked={quest.onStarting}
            onChange={(onStarting) => update({ quest: { ...quest, onStarting } })}
          >
            {q.onStarting}
          </Toggle>
          <Toggle
            checked={quest.hideWhenDone}
            onChange={(hideWhenDone) => update({ quest: { ...quest, hideWhenDone } })}
          >
            {q.hideWhenDone}
          </Toggle>
        </div>
        <div className="flex items-center gap-4 bg-ink p-4">
          <span className="flex-none label-mono text-xs font-extrabold text-bordeaux-hi">
            {en.admin.quest.title}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="truncate font-display text-[22px] leading-none">{quest.title}</span>
            <span className="block h-4 bg-ink-3 p-[3px]">
              <span
                className="xp-fill block h-full"
                style={{ width: `${Math.max(questProgress(quest), 0.02) * 100}%` }}
              />
            </span>
          </div>
          <span className="flex-none font-mono text-sm font-extrabold">
            <b className="text-tq">{quest.followers ?? "?"}</b> / {quest.goal}
          </span>
        </div>
      </Card>
    </div>
  );
}
