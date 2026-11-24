"use client";

import { useRef, useState, type CSSProperties } from "react";
import {
  COUNTER_LABEL_MAX,
  COUNTER_PRESETS,
  COUNTER_TOTAL_MAX,
  COUNTERS_MAX,
  EMPTY_LIVE,
  GAME_NAME_MAX,
  GAME_TICKER_ITEM_MAX,
  GAME_TICKER_MAX,
  GAMES_MAX,
  GOAL_LINE_MAX,
  MOOD_COLORS,
  MOODS,
  POLL_OPTION_MAX,
  POLL_OPTIONS_MAX,
  POLL_QUESTION_MAX,
  PREVIOUSLY_MAX,
  SHORT_NAME_MAX,
  UNIT_MAX,
  WIDGETS,
  newProfile,
  suggestShort,
  type CounterDef,
  type GameProfile,
  type Mood,
} from "@/lib/stream/games";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { Card, StatusLine } from "../Card";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, INPUT, LABEL } from "../fields";
import { Toggle } from "../Toggle";
import { ShareArtCard } from "./ShareArt";
import { useGameLive } from "../useGameLive";
import type { TabProps } from "./shared";

const t = en.admin.games;

/** A small −/+ counter that saves straight away. */
function LiveCounter({
  label,
  value,
  total,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  total?: number | null;
  onChange: (by: number) => void;
  disabled: boolean;
}) {
  const BTN =
    "focus-inset w-12 flex-none bg-ink-3 font-display text-[28px] leading-none text-paper transition-colors duration-200 hover:bg-bordeaux disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-2">
      <span className={LABEL}>{label}</span>
      <div className="flex h-14 items-stretch cut-s">
        <button
          type="button"
          aria-label={interpolate(t.less, { label })}
          disabled={disabled || value <= 0}
          onClick={() => onChange(-1)}
          className={BTN}
        >
          −
        </button>
        <output
          aria-live="polite"
          className="flex flex-1 items-center justify-center bg-ink font-display text-[30px] text-paper"
        >
          {value}
          {total ? <span className="ml-1 text-lg text-muted">/ {total}</span> : null}
        </output>
        <button
          type="button"
          aria-label={interpolate(t.more, { label })}
          disabled={disabled}
          onClick={() => onChange(1)}
          className={BTN}
        >
          +
        </button>
      </div>
    </div>
  );
}

function moodStyle(mood: Mood) {
  return { "--mood": MOOD_COLORS[mood].a } as CSSProperties;
}

export function GamesTab({ form, update, saved, push }: TabProps) {
  const games = form.games;
  const current = games.list.find((g) => g.id === games.current) ?? null;
  const [selected, setSelected] = useState<string | null>(games.current);
  const [query, setQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState<Mood | "all">("all");
  const [newName, setNewName] = useState("");
  const editing = games.list.find((g) => g.id === selected) ?? null;

  const setGames = (patch: Partial<typeof games>) => update({ games: { ...games, ...patch } });
  const setProfile = (id: string, patch: Partial<GameProfile>) =>
    setGames({ list: games.list.map((g) => (g.id === id ? { ...g, ...patch } : g)) });

  function addGame() {
    const name = newName.trim();
    if (!name || games.list.length >= GAMES_MAX) return;
    const profile = newProfile(name, games.list.map((g) => g.id));
    setGames({ list: [...games.list, profile] });
    setSelected(profile.id);
    setNewName("");
  }

  const q = query.trim().toLowerCase();
  const shown = games.list.filter(
    (g) =>
      (moodFilter === "all" || g.mood === moodFilter) &&
      (!q || g.name.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-7">
      <OnStream
        current={current}
        switched={games.current !== saved.games.current}
        onTakeOff={() => setGames({ current: null })}
        onError={() => push("error", t.liveError, t.liveError)}
      />

      <Card title={t.library} hint={interpolate(t.libraryHint, { n: games.list.length })}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            aria-label={t.search}
            placeholder={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${INPUT} max-w-72`}
          />
          {(["all", ...MOODS] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={moodFilter === m}
              onClick={() => setMoodFilter(m)}
              className={`${CHIP_SM} ${moodFilter === m ? CHIP_ON : CHIP_OFF}`}
            >
              {m === "all" ? t.all : t.moods[m]}
            </button>
          ))}
        </div>
        <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((g) => {
            const onAir = g.id === games.current;
            const active = g.id === selected;
            return (
              <li key={g.id} style={moodStyle(g.mood)} className="flex items-stretch">
                <button
                  type="button"
                  aria-label={interpolate(t.edit, { name: g.name })}
                  aria-pressed={active}
                  onClick={() => setSelected(g.id)}
                  className={`focus-inset flex min-h-16 flex-1 flex-col justify-center gap-1 border-l-4 border-(--mood) px-4 py-2 text-left cut-s transition-colors duration-200 ${
                    active ? "bg-ink-3" : "bg-ink hover:bg-ink-3"
                  }`}
                >
                  <span className="text-base leading-tight text-paper">{g.name}</span>
                  <span className="label-mono text-[11px] font-extrabold text-(--mood)">
                    {t.moods[g.mood]}
                    {onAir ? ` · ${t.onAir}` : ""}
                    {g.completedAt ? ` · ${t.done}` : ""}
                  </span>
                </button>
                {!onAir && !g.completedAt ? (
                  <button
                    type="button"
                    onClick={() => {
                      setGames({ current: g.id });
                      setSelected(g.id);
                    }}
                    className={`${CHIP_SM} ${CHIP_OFF} ml-1 self-center`}
                  >
                    {t.putOn}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addGame();
          }}
        >
          <input
            aria-label={t.addPlaceholder}
            placeholder={t.addPlaceholder}
            value={newName}
            maxLength={GAME_NAME_MAX}
            onChange={(e) => setNewName(e.target.value)}
            className={`${INPUT} max-w-80`}
          />
          <button
            type="submit"
            disabled={!newName.trim() || games.list.length >= GAMES_MAX}
            className={`${CHIP} ${CHIP_OFF}`}
          >
            {t.add}
          </button>
          {games.list.length >= GAMES_MAX ? (
            <span className="label-mono self-center text-xs font-extrabold text-muted">
              {t.full}
            </span>
          ) : null}
        </form>
      </Card>

      {editing ? (
        <>
          <ProfileEditor
            key={editing.id}
            profile={editing}
            set={(patch) => setProfile(editing.id, patch)}
            onRemove={() => {
              setGames({
                list: games.list.filter((g) => g.id !== editing.id),
                current: games.current === editing.id ? null : games.current,
              });
              setSelected(null);
            }}
          />
          <ShareArtCard
            key={`share-${editing.id}`}
            profile={editing}
            set={(patch) => setProfile(editing.id, patch)}
            push={push}
          />
        </>
      ) : (
        <Card title={t.profile}>
          <p className="m-0 text-muted">{t.pickOne}</p>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- on stream

function OnStream({
  current,
  switched,
  onTakeOff,
  onError,
}: {
  current: GameProfile | null;
  switched: boolean;
  onTakeOff: () => void;
  onError: () => void;
}) {
  const { live, busy, change, reset } = useGameLive(current?.id ?? null, onError);
  const [confirm, setConfirm] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  if (!current) {
    return (
      <Card title={t.onStream} hint={t.onStreamHint}>
        <p className="m-0 text-muted">{t.nothing}</p>
        {switched ? <StatusLine tone="warn">{t.offNote}</StatusLine> : null}
      </Card>
    );
  }

  const disabled = busy || !live;
  const values = live ?? EMPTY_LIVE;
  const unit = current.unit.toLowerCase();

  return (
    <Card title={t.onStream} hint={t.onStreamHint}>
      <div
        style={moodStyle(current.mood)}
        className="flex flex-wrap items-center gap-4 border-l-[6px] border-(--mood) bg-ink px-5 py-4"
      >
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="label-mono text-xs font-extrabold text-(--mood)">
            {t.moods[current.mood]}
            {current.finalPart ? ` · ${interpolate(t.finalPart, { unit: current.unit })}` : ""}
          </span>
          <span className="font-display text-[34px] leading-none text-paper">{current.name}</span>
          <span className="label-mono text-xs font-extrabold text-muted">
            {current.showPart ? `${current.unit} ${values.part} · ` : ""}
            {interpolate(t.hours, { h: Math.round((values.mins / 60) * 10) / 10 })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {current.showPart ? (
            <>
              <button
                type="button"
                disabled={disabled || values.part <= 1}
                onClick={() => change("part", -1)}
                aria-label={interpolate(t.prevPart, { unit })}
                className={`${CHIP_SM} ${CHIP_OFF}`}
              >
                ←
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => change("part", 1)}
                className={`${CHIP} ${CHIP_ON}`}
              >
                {interpolate(t.nextPart, { unit })}
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={disabled || values.mins < 60}
            onClick={() => change("mins", -60)}
            className={`${CHIP_SM} ${CHIP_OFF}`}
          >
            {t.removeHour}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => change("mins", 60)}
            className={`${CHIP_SM} ${CHIP_OFF}`}
          >
            {t.addHour}
          </button>
        </div>
      </div>

      {!live ? <p className="m-0 label-mono text-xs text-muted">{t.liveLoading}</p> : null}

      {current.widget === "counters" && current.counters.length ? (
        <div className="flex flex-wrap gap-4">
          {current.counters.map((c, i) => (
            <LiveCounter
              key={`c${i + 1}`}
              label={c.label}
              total={c.total}
              value={i === 0 ? values.c1 : values.c2}
              disabled={disabled}
              onChange={(by) => change(i === 0 ? "c1" : "c2", by)}
            />
          ))}
        </div>
      ) : null}

      {current.widget === "football" ? (
        <div className="flex flex-wrap gap-4">
          {(["w", "d", "l", "gf", "ga"] as const).map((field) => (
            <LiveCounter
              key={field}
              label={t.football[field]}
              value={values[field]}
              disabled={disabled}
              onChange={(by) => change(field, by)}
            />
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <p className="m-0 flex-1 label-mono text-xs font-extrabold text-muted">{t.liveNote}</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            window.clearTimeout(timer.current);
            if (!confirm) {
              setConfirm(true);
              timer.current = window.setTimeout(() => setConfirm(false), 3000);
              return;
            }
            setConfirm(false);
            reset();
          }}
          className={`${CHIP_SM} ${confirm ? "bg-live text-paper" : CHIP_OFF}`}
        >
          {confirm ? t.resetConfirm : t.resetNumbers}
        </button>
        <button type="button" onClick={onTakeOff} className={`${CHIP_SM} ${CHIP_OFF}`}>
          {t.takeOff}
        </button>
      </div>
      {switched ? <StatusLine tone="warn">{t.switchNote}</StatusLine> : null}
    </Card>
  );
}

// ---------------------------------------------------------------- editor

function Field({
  id,
  label,
  value,
  onChange,
  max,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </div>
  );
}

function ProfileEditor({
  profile,
  set,
  onRemove,
}: {
  profile: GameProfile;
  set: (patch: Partial<GameProfile>) => void;
  onRemove: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const p = profile;
  const setCounter = (i: number, patch: Partial<CounterDef>) =>
    set({ counters: p.counters.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <Card title={p.name || t.profile} hint={t.profileHint}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          id="game-name"
          label={t.name}
          value={p.name}
          max={GAME_NAME_MAX}
          onChange={(name) => set({ name })}
        />
        <div className="flex flex-col gap-2">
          <span className={LABEL}>{t.mood}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t.mood}>
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={p.mood === m}
                onClick={() => set({ mood: m })}
                style={moodStyle(m)}
                className={`${CHIP} ${
                  p.mood === m ? "bg-(--mood) text-ink" : "bg-ink-3 text-(--mood) hover:bg-ink"
                }`}
              >
                {t.moods[m]}
              </button>
            ))}
          </div>
        </div>
        <Field
          id="game-unit"
          label={t.unit}
          value={p.unit}
          max={UNIT_MAX}
          placeholder={t.unitPlaceholder}
          onChange={(unit) => set({ unit })}
        />
        <div className="flex flex-col gap-2">
          <Field
            id="game-short"
            label={t.short}
            value={p.short}
            max={SHORT_NAME_MAX}
            placeholder={suggestShort(p.name)}
            onChange={(short) => set({ short })}
          />
          <span className="text-[13px] leading-snug text-muted">{t.shortHint}</span>
        </div>
        <Field
          id="game-goal"
          label={t.goal}
          value={p.goal}
          max={GOAL_LINE_MAX}
          placeholder={t.goalPlaceholder}
          onChange={(goal) => set({ goal })}
        />
        <Field
          id="game-previously"
          label={t.previously}
          value={p.previously}
          max={PREVIOUSLY_MAX}
          placeholder={t.previouslyPlaceholder}
          onChange={(previously) => set({ previously })}
        />
      </div>

      <div className="flex flex-col gap-3 border-l-4 border-ink-3 pl-4">
        <span className={LABEL}>{t.onOverlay}</span>
        <Toggle checked={p.showTitle} onChange={(showTitle) => set({ showTitle })}>
          {t.showTitle}
        </Toggle>
        <Toggle checked={p.showPart} onChange={(showPart) => set({ showPart })}>
          {interpolate(t.showPartUnit, { unit: p.unit || "Part" })}
        </Toggle>
        <Toggle checked={p.showGoal} onChange={(showGoal) => set({ showGoal })}>
          {t.showGoal}
        </Toggle>
        {p.widget === "football" ? (
          <>
            <Toggle checked={p.showRecord} onChange={(showRecord) => set({ showRecord })}>
              {t.showRecord}
            </Toggle>
            <Toggle checked={p.showGoals} onChange={(showGoals) => set({ showGoals })}>
              {t.showGoals}
            </Toggle>
          </>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.widget}</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.widget}>
          {WIDGETS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={p.widget === w}
              onClick={() => set({ widget: w })}
              className={`${CHIP} ${p.widget === w ? CHIP_ON : CHIP_OFF}`}
            >
              {t.widgets[w]}
            </button>
          ))}
        </div>
      </div>

      {p.widget === "counters" ? (
        <div className="flex flex-col gap-4 border-l-4 border-ink-3 pl-4">
          <span className={LABEL}>{t.counters}</span>
          {p.counters.map((c, i) => (
            <div key={`counter-${i + 1}`} className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                <input
                  aria-label={interpolate(t.counterLabel, { n: i + 1 })}
                  value={c.label}
                  maxLength={COUNTER_LABEL_MAX}
                  onChange={(e) => setCounter(i, { label: e.target.value })}
                  className={INPUT}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={COUNTER_TOTAL_MAX}
                  aria-label={t.total}
                  placeholder={t.total}
                  value={c.total ?? ""}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setCounter(i, {
                      total: e.target.value && n >= 1 ? Math.min(COUNTER_TOTAL_MAX, n) : null,
                    });
                  }}
                  className={INPUT}
                />
                <button
                  type="button"
                  aria-label={interpolate(t.removeCounter, { n: i + 1 })}
                  onClick={() => set({ counters: p.counters.filter((_, j) => j !== i) })}
                  className={`${CHIP} ${CHIP_OFF}`}
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="label-mono text-[11px] font-extrabold text-muted">
                  {t.presets}
                </span>
                {COUNTER_PRESETS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCounter(i, { label })}
                    className={`${CHIP_SM} ${c.label === label ? CHIP_ON : CHIP_OFF}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {p.counters.length < COUNTERS_MAX ? (
              <button
                type="button"
                onClick={() =>
                  set({ counters: [...p.counters, { label: "Deaths", total: null }] })
                }
                className={`${CHIP} ${CHIP_OFF}`}
              >
                {t.addCounter}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() =>
                set({
                  counters: [
                    { label: "Wins", total: null },
                    { label: "Losses", total: null },
                  ],
                })
              }
              className={`${CHIP} ${CHIP_OFF}`}
            >
              {t.winsLosses}
            </button>
          </div>
        </div>
      ) : null}

      {p.widget === "poll" ? (
        <div className="flex flex-col gap-3 border-l-4 border-ink-3 pl-4">
          <Field
            id="game-poll-q"
            label={t.pollQuestion}
            value={p.poll.question}
            max={POLL_QUESTION_MAX}
            placeholder={t.pollQuestionPlaceholder}
            onChange={(question) => set({ poll: { ...p.poll, question } })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: POLL_OPTIONS_MAX }, (_, i) => (
              <Field
                key={`option-${i + 1}`}
                id={`game-poll-${i + 1}`}
                label={interpolate(t.pollOption, { n: i + 1 })}
                value={p.poll.options[i] ?? ""}
                max={POLL_OPTION_MAX}
                onChange={(value) => {
                  const options = [...p.poll.options];
                  while (options.length <= i) options.push("");
                  options[i] = value;
                  set({ poll: { ...p.poll, options } });
                }}
              />
            ))}
          </div>
          <Toggle
            checked={p.poll.open}
            onChange={(open) =>
              set({ poll: { ...p.poll, open, openedAt: open ? Date.now() : p.poll.openedAt } })
            }
          >
            {t.pollOpen}
          </Toggle>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className={LABEL}>{t.ticker}</span>
        {Array.from({ length: GAME_TICKER_MAX }, (_, i) => (
          <input
            key={`ticker-${i + 1}`}
            aria-label={`${t.ticker} ${i + 1}`}
            placeholder={i === 0 ? t.tickerPlaceholder : ""}
            value={p.ticker[i] ?? ""}
            maxLength={GAME_TICKER_ITEM_MAX}
            onChange={(e) => {
              const ticker = [...p.ticker];
              while (ticker.length <= i) ticker.push("");
              ticker[i] = e.target.value;
              set({ ticker });
            }}
            className={INPUT}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Toggle checked={p.finalPart} onChange={(finalPart) => set({ finalPart })}>
          {interpolate(t.finalPart, { unit: p.unit || "Part" })}
        </Toggle>
        <Toggle
          checked={p.completedAt !== null}
          onChange={(done) => set({ completedAt: done ? Date.now() : null })}
        >
          {t.completed}
        </Toggle>
      </div>

      <div>
        <button
          type="button"
          onClick={() => (confirm ? onRemove() : setConfirm(true))}
          onBlur={() => setConfirm(false)}
          className={`${CHIP_SM} ${confirm ? "bg-live text-paper" : CHIP_OFF}`}
        >
          {confirm ? t.removeConfirm : t.remove}
        </button>
      </div>
    </Card>
  );
}
