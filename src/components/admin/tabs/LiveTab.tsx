"use client";

import { useEffect, useState } from "react";
import { BRB_MESSAGE_MAX, PRESET_NAME_MAX, PRESETS_MAX } from "@/lib/stream/extras";
import { discordMessage, type TikTokAccount } from "@/lib/stream/discord";
import { GAME_CHIPS, GAME_MAX, TOPIC_MAX, type LiveMode } from "@/lib/stream/state";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { BUTTON_PRIMARY } from "@/utils/ui.classes";
import { Card, StatusLine } from "../Card";
import { errorText } from "../errors";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, INPUT, LABEL } from "../fields";
import { nextOccurrence, toTimeValue } from "../time";
import { TimePicker } from "../TimePicker";
import { readNow } from "../useNow";
import type { TabProps } from "./shared";
import { timerLine } from "./timerLine";

const MODES: LiveMode[] = ["auto", "live", "off"];
const QUICK_MINUTES = [5, 10, 15];
const BRB_MINUTES = [2, 5, 10];

export const isOtherGame = (game: string) =>
  game !== "" && !(GAME_CHIPS as readonly string[]).includes(game);

export function LiveTab({
  form,
  update,
  saved,
  now,
  push,
  otherGame,
  setOtherGame,
  twitchReady,
}: TabProps & {
  otherGame: boolean;
  setOtherGame: (other: boolean) => void;
  twitchReady: boolean;
}) {
  const t = en.admin;
  const clock = now
    ? { h: new Date(now).getHours(), m: new Date(now).getMinutes() }
    : null;
  const countdown = timerLine(form.countdown?.to ?? null, now, t.countdown);
  const brb = timerLine(form.brbUntil, now, t.brb);

  return (
    <div className="flex flex-col gap-7">
      <Presets
        {...{ form, update, push }}
        onLoad={(game) => setOtherGame(isOtherGame(game))}
      />

      <Card title={t.live.title} hint={t.live.hint}>
        <div role="group" aria-label={t.live.title} className="flex flex-wrap gap-2">
          {MODES.map((mode) => {
            const on = form.mode === mode;
            const onClass = mode === "live" ? "bg-live text-ink" : CHIP_ON;
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={on}
                onClick={() => update({ mode })}
                className={`${CHIP} ${on ? onClass : CHIP_OFF}`}
              >
                {t.live.modes[mode]}
              </button>
            );
          })}
        </div>
        <p className="m-0 text-[15px] leading-relaxed text-muted">
          {t.live.help[form.mode]}
          {form.mode === "auto" && !twitchReady
            ? " (TWITCH_CLIENT_ID/SECRET missing, so Auto stays offline.)"
            : ""}
        </p>
      </Card>

      <Card title={t.today.title}>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.today.topic}</span>
          <input
            type="text"
            maxLength={TOPIC_MAX}
            value={form.topic}
            placeholder={t.today.topicPlaceholder}
            onChange={(event) => update({ topic: event.target.value })}
            className={INPUT}
          />
        </label>
        <div className="flex flex-col gap-2">
          <span id="game-label" className={LABEL}>
            {t.today.game}
          </span>
          <div role="group" aria-labelledby="game-label" className="flex flex-wrap gap-2">
            {GAME_CHIPS.map((game) => {
              const on = !otherGame && form.game === game;
              return (
                <button
                  key={game}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setOtherGame(false);
                    update({ game: on ? "" : game });
                  }}
                  className={`${CHIP} ${on ? CHIP_ON : CHIP_OFF}`}
                >
                  {game}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={otherGame}
              onClick={() => {
                setOtherGame(!otherGame);
                update({ game: "" });
              }}
              className={`${CHIP} ${otherGame ? CHIP_ON : CHIP_OFF}`}
            >
              {t.today.other}
            </button>
          </div>
          {otherGame ? (
            <input
              type="text"
              aria-label={t.today.otherPlaceholder}
              maxLength={GAME_MAX}
              value={form.game}
              placeholder={t.today.otherPlaceholder}
              onChange={(event) => update({ game: event.target.value })}
              className={INPUT}
            />
          ) : null}
        </div>
      </Card>

      <Card title={t.countdown.title} hint={t.countdown.hint}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TimePicker
            id="countdown-time"
            label={t.countdown.at}
            value={toTimeValue(form.countdown?.to)}
            pastBefore={clock}
            onPick={(value) => {
              const at = readNow();
              const to = nextOccurrence(value, at);
              update({ countdown: to ? { from: at, to } : null });
            }}
          />
          <div className="flex flex-col gap-2">
            <span className={LABEL}>{t.countdown.quick}</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_MINUTES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    const at = readNow();
                    update({ countdown: { from: at, to: at + n * 60_000 } });
                  }}
                  className={`${CHIP} ${CHIP_OFF}`}
                >
                  {interpolate(t.countdown.minutes, { n })}
                </button>
              ))}
            </div>
          </div>
        </div>
        <StatusLine
          tone={countdown.tone}
          action={
            form.countdown ? (
              <button
                type="button"
                onClick={() => update({ countdown: null })}
                className={`${CHIP_SM} ${CHIP_OFF}`}
              >
                {t.countdown.clear}
              </button>
            ) : null
          }
        >
          {countdown.line}
        </StatusLine>
        {countdown.tomorrow ? (
          <p className="m-0 text-sm text-bordeaux-hi">{t.countdown.tomorrowNote}</p>
        ) : null}
      </Card>

      <Card title={t.brb.title} hint={t.brb.hint}>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.brb.message}</span>
          <input
            type="text"
            maxLength={BRB_MESSAGE_MAX}
            value={form.brbMessage}
            placeholder={t.brb.placeholder}
            onChange={(event) => update({ brbMessage: event.target.value })}
            className={INPUT}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {t.brb.quick.map((message) => (
            <button
              key={message}
              type="button"
              aria-pressed={form.brbMessage === message}
              onClick={() => update({ brbMessage: message })}
              className={`${CHIP_SM} ${form.brbMessage === message ? CHIP_ON : CHIP_OFF}`}
            >
              {message}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className={LABEL}>{t.brb.backIn}</span>
          <div className="flex flex-wrap gap-2">
            {BRB_MINUTES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ brbUntil: readNow() + n * 60_000 })}
                className={`${CHIP} ${CHIP_OFF}`}
              >
                {interpolate(t.brb.minutes, { n })}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={form.brbUntil === null}
              onClick={() => update({ brbUntil: null })}
              className={`${CHIP} ${form.brbUntil === null ? CHIP_ON : CHIP_OFF}`}
            >
              {t.brb.noTimer}
            </button>
          </div>
        </div>
        <StatusLine
          tone={brb.tone}
          action={
            form.brbUntil || form.brbMessage ? (
              <button
                type="button"
                onClick={() => update({ brbUntil: null, brbMessage: "" })}
                className={`${CHIP_SM} ${CHIP_OFF}`}
              >
                {t.brb.clear}
              </button>
            ) : null
          }
        >
          {brb.line}
        </StatusLine>
      </Card>

      <DiscordCard {...{ form, saved, now, push }} />
    </div>
  );
}

/** One-tap fills for topic, game and plan; saved with the rest. */
function Presets({
  form,
  update,
  push,
  onLoad,
}: Pick<TabProps, "form" | "update" | "push"> & { onLoad: (game: string) => void }) {
  const t = en.admin.presets;
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const full = form.presets.length >= PRESETS_MAX;
  const clash = form.presets.some(
    (preset) => preset.name.toLowerCase() === name.trim().toLowerCase(),
  );

  function addPreset() {
    const clean = name.trim();
    if (!clean || clash || full) return;
    update({
      presets: [
        ...form.presets,
        {
          name: clean,
          topic: form.topic.trim(),
          game: form.game.trim(),
          plan: form.nextPlan.trim(),
        },
      ],
    });
    setName("");
    setNaming(false);
  }

  return (
    <Card title={t.title} hint={t.hint}>
      {form.presets.length ? (
        <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
          {form.presets.map((preset) => {
            const active =
              form.topic.trim() === preset.topic && form.game.trim() === preset.game;
            return (
              <li key={preset.name} className="flex cut-s">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    update({
                      topic: preset.topic,
                      game: preset.game,
                      nextPlan: preset.plan,
                    });
                    onLoad(preset.game);
                    push(
                      "ok",
                      t.loadedTitle,
                      interpolate(t.loadedText, { name: preset.name }),
                    );
                  }}
                  className={`flex min-h-12 items-center gap-2.5 px-4 text-left focus-inset transition-colors duration-200 ${
                    active ? "bg-tq text-ink" : "bg-ink-3 text-paper hover:bg-bordeaux"
                  }`}
                >
                  <span className="label-mono text-[13px] font-extrabold">
                    {preset.name}
                  </span>
                  {preset.game ? (
                    <span className={`text-xs ${active ? "text-ink/70" : "text-muted"}`}>
                      {preset.game}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label={interpolate(t.remove, { name: preset.name })}
                  onClick={() =>
                    update({
                      presets: form.presets.filter((p) => p.name !== preset.name),
                    })
                  }
                  className="flex w-10 items-center justify-center border-l border-ink bg-ink-3 text-muted focus-inset transition-colors hover:bg-live hover:text-ink"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 text-[15px] text-muted">{t.empty}</p>
      )}

      {naming ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addPreset();
          }}
          className="flex flex-wrap items-end gap-2.5"
        >
          <label className="flex min-w-56 flex-1 flex-col gap-2">
            <span className={LABEL}>{t.name}</span>
            <input
              type="text"
              autoFocus
              maxLength={PRESET_NAME_MAX}
              value={name}
              placeholder={t.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={clash ? true : undefined}
              className={INPUT}
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim() || clash}
            className={`${CHIP} ${CHIP_ON}`}
          >
            {t.save}
          </button>
          <button
            type="button"
            onClick={() => setNaming(false)}
            className={`${CHIP} ${CHIP_OFF}`}
          >
            {t.cancel}
          </button>
          {clash ? <p className="m-0 w-full text-sm text-live">{t.exists}</p> : null}
        </form>
      ) : (
        <button
          type="button"
          disabled={full}
          onClick={() => setNaming(true)}
          className={`${CHIP} self-start bg-transparent text-tq shadow-[inset_0_0_0_2px_var(--color-ink-3)] hover:bg-ink-3`}
        >
          {t.saveCurrent}
        </button>
      )}
      <p className="m-0 text-sm text-muted">{full ? t.full : t.help}</p>
    </Card>
  );
}

type DiscordInfo = {
  configured: boolean;
  lastSentAt: number | null;
  lockedUntil: number | null;
};

/** Posts the TikTok LIVE ping right away (not part of Save). */
function DiscordCard({
  form,
  saved,
  now,
  push,
}: Pick<TabProps, "form" | "saved" | "now" | "push">) {
  const t = en.admin.discord;
  const [info, setInfo] = useState<DiscordInfo | null>(null);
  const [account, setAccount] = useState<TikTokAccount>("live");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/discord", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<DiscordInfo>) : null))
      .then((data) => {
        if (active && data) setInfo(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const message = discordMessage(saved, account, "0");
  const embed = message.embeds[0];
  const locked = Boolean(info?.lockedUntil && now && info.lockedUntil > now);
  const topicChanged =
    form.topic.trim() !== saved.topic || form.game.trim() !== saved.game;

  async function send() {
    setSending(true);
    try {
      const res = await fetch("/api/admin/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<DiscordInfo> & {
        error?: string;
      };
      if (!res.ok) {
        push("error", t.title, errorText(body.error));
        if (body.lockedUntil) {
          setInfo((current) => ({
            configured: current?.configured ?? true,
            lastSentAt: current?.lastSentAt ?? null,
            lockedUntil: body.lockedUntil ?? null,
          }));
        }
        return;
      }
      setInfo({
        configured: true,
        lastSentAt: body.lastSentAt ?? null,
        lockedUntil: body.lockedUntil ?? null,
      });
      push("ok", t.sentTitle, t.sentText);
    } catch {
      push("error", t.title, errorText());
    } finally {
      setSending(false);
    }
  }

  return (
    <Card title={t.title} hint={t.hint}>
      <p className="m-0 text-[15px] leading-relaxed text-muted">{t.text}</p>

      {/* What Discord will show */}
      <div className="flex gap-3.5 rounded bg-[#313338] px-4 py-4 text-[15px] leading-normal text-[#DBDEE1]">
        <span
          aria-hidden="true"
          className="size-10 flex-none rounded-full bg-bordeaux-hi"
        />
        <div className="min-w-0 flex-1">
          <p className="m-0">
            <b className="text-[#F2F3F5]">{t.bot}</b>{" "}
            <span className="rounded-sm bg-[#5865F2] px-1 text-[11px] text-white">
              {t.app}
            </span>{" "}
            <span className="text-xs text-[#949BA4]">
              {now ? interpolate(t.today, { time: toTimeValue(now) }) : ""}
            </span>
          </p>
          <p className="m-0">
            <span className="rounded-sm bg-[#5865F2]/30 px-0.5 text-[#C9CDFB]">
              {t.role}
            </span>{" "}
            {message.content.replace(/^<@&\d+> /, "")}
          </p>
          <div className="mt-2 rounded border-l-4 border-tq bg-[#2B2D31] px-3.5 py-3">
            <p className="m-0 font-bold text-[#F2F3F5]">{embed.title}</p>
            <p className="m-0 text-sm">{embed.description}</p>
            <p className="m-0 text-sm break-all text-[#00A8FC]">{embed.url}</p>
          </div>
        </div>
      </div>
      {topicChanged ? (
        <p className="m-0 text-sm text-bordeaux-hi">{t.savedNote}</p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span id="discord-account" className={LABEL}>
            {t.liveOn}
          </span>
          <div
            role="group"
            aria-labelledby="discord-account"
            className="flex flex-wrap gap-2"
          >
            {(["live", "main"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={account === key}
                onClick={() => setAccount(key)}
                className={`${CHIP} ${account === key ? CHIP_ON : CHIP_OFF}`}
              >
                {key === "live" ? "@clipzhub06" : "@madnco8"}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={send}
          disabled={sending || locked || info?.configured === false}
          className={`${BUTTON_PRIMARY} disabled:opacity-50`}
        >
          {sending ? t.sending : t.send}
        </button>
      </div>
      <p className="m-0 label-mono text-xs font-extrabold text-muted">
        {info?.configured === false
          ? t.notConfigured
          : locked && info?.lockedUntil
            ? interpolate(t.unlocksAt, { time: toTimeValue(info.lockedUntil) })
            : info?.lastSentAt
              ? interpolate(t.lastSent, { time: toTimeValue(info.lastSentAt) })
              : t.never}
      </p>
    </Card>
  );
}
