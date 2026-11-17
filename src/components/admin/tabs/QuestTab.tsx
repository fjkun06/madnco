"use client";

import {
  DEFAULT_QUEST,
  FOLLOWERS_MAX,
  GOAL_MAX,
  QUEST_TEXT_MAX,
  QUEST_TITLE_MAX,
  questDone,
  questProgress,
  questText,
  type Quest,
} from "@/lib/stream/extras";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { interpolate } from "@/utils/interpolate";
import { Card } from "../Card";
import { CHIP, CHIP_OFF, CHIP_SM, INPUT, LABEL } from "../fields";
import { Stepper } from "../Stepper";
import { Toggle } from "../Toggle";
import type { TabProps } from "./shared";

const ADD = [1, 5, 10, 50];

export function QuestTab({ form, update }: TabProps) {
  const t = en.admin.quest;
  const quest = form.quest;
  const set = (patch: Partial<Quest>) => update({ quest: { ...quest, ...patch } });
  const done = questDone(quest);
  const pct = Math.round(questProgress(quest) * 100);
  const left = quest.followers === null ? quest.goal : Math.max(0, quest.goal - quest.followers);

  return (
    <div className="flex flex-col gap-7">
      <Card title={t.title} hint={t.hint}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <label htmlFor="quest-followers" className={LABEL}>
              {t.followers}
            </label>
            <Stepper
              id="quest-followers"
              label={t.followers}
              value={quest.followers}
              onChange={(followers) => set({ followers })}
              max={FOLLOWERS_MAX}
              allowEmpty
              lessLabel={t.fewer}
              moreLabel={t.more}
            />
            <div className="flex flex-wrap gap-2">
              {ADD.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    set({ followers: Math.min(FOLLOWERS_MAX, (quest.followers ?? 0) + n) })
                  }
                  className={`${CHIP_SM} ${CHIP_OFF}`}
                >
                  {interpolate(t.add, { n })}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="quest-goal" className={LABEL}>
              {t.goal}
            </label>
            <Stepper
              id="quest-goal"
              label={t.goal}
              value={quest.goal}
              onChange={(goal) => set({ goal: goal ?? 1 })}
              min={1}
              max={GOAL_MAX}
              lessLabel={t.lowerGoal}
              moreLabel={t.raiseGoal}
              accent={false}
            />
            <p className="m-0 text-sm leading-snug text-muted">{t.goalNote}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-ink p-4">
          <span className="block h-[26px] bg-ink-3 p-1 cut-s">
            <span
              className={`${done ? "xp-fill-done" : "xp-fill"} block h-full transition-[width] duration-300`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </span>
          <div className="flex justify-between font-mono text-[13px] font-extrabold text-muted">
            <span>
              {interpolate(t.progress, {
                n: quest.followers ?? "?",
                goal: quest.goal,
                pct,
              })}
            </span>
            <span className={done ? "text-tq" : "text-bordeaux-hi"}>
              {done ? t.done : interpolate(t.left, { n: left })}
            </span>
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.titleLabel}</span>
          <input
            type="text"
            maxLength={QUEST_TITLE_MAX}
            value={quest.title}
            onChange={(event) => set({ title: event.target.value })}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.text}</span>
          <textarea
            rows={3}
            maxLength={QUEST_TEXT_MAX}
            value={quest.text}
            onChange={(event) => set({ text: event.target.value })}
            className={`${INPUT} min-h-24 resize-y py-3 leading-normal`}
          />
        </label>
        <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
          {t.fillIns}
          {t.tokens.map(([token, meaning]) => (
            <span key={token} className="inline-flex items-center gap-1.5">
              <code className="bg-ink-3 px-2 py-0.5 font-mono text-xs font-extrabold text-tq">
                {token}
              </code>
              {meaning}
            </span>
          ))}
        </p>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.doneText}</span>
          <input
            type="text"
            maxLength={QUEST_TEXT_MAX}
            value={quest.doneText}
            onChange={(event) => set({ doneText: event.target.value })}
            className={INPUT}
          />
        </label>
        <Toggle checked={quest.show} onChange={(show) => set({ show })}>
          {t.show}
        </Toggle>
        <button
          type="button"
          onClick={() =>
            set({
              title: DEFAULT_QUEST.title,
              text: DEFAULT_QUEST.text,
              doneText: DEFAULT_QUEST.doneText,
            })
          }
          className={`${CHIP} ${CHIP_OFF} self-start`}
        >
          {t.defaults}
        </button>
      </Card>

      <div className="flex flex-col gap-3">
        <span className={LABEL}>{t.preview}</span>
        <QuestPreview quest={quest} />
      </div>
    </div>
  );
}

/** The homepage card as it will look (without the scroll animation). */
function QuestPreview({ quest }: { quest: Quest }) {
  const done = questDone(quest);
  return (
    <div
      className={`flex flex-col gap-4 bg-ink-2 p-7 cut ${
        quest.show ? "" : "opacity-40"
      } ${done ? "shadow-[inset_0_0_0_2px_var(--color-tq)]" : ""}`}
    >
      {done ? (
        <span className="self-start bg-tq px-3 py-1.5 label-mono text-xs font-extrabold text-ink cut-s">
          ✓ {en.quest.done}
        </span>
      ) : (
        <span className="label-mono text-xs font-extrabold text-bordeaux-hi">
          {en.quest.label}
        </span>
      )}
      <p className="m-0 font-display text-[40px] leading-[0.95]">{quest.title}</p>
      <p className="m-0 text-base leading-relaxed text-muted">{questText(quest)}</p>
      <span className="block h-[26px] bg-ink-3 p-1">
        <span
          className={`${done ? "xp-fill-done" : "xp-fill"} block h-full`}
          style={{ width: `${Math.max(questProgress(quest), 0.02) * 100}%` }}
        />
      </span>
      <div className="flex justify-between label-mono text-xs text-muted">
        <span>{en.quest.followers}</span>
        <span>
          <b className={done ? "text-bordeaux-hi" : "text-tq"}>{quest.followers ?? "?"}</b> /{" "}
          {quest.goal}
        </span>
      </div>
      <span className="self-start bg-tq px-5 py-3 label-mono text-xs font-extrabold text-ink cut-s">
        {interpolate(en.quest.cta, { handle: siteConfig.handles.tiktok })}
      </span>
    </div>
  );
}
