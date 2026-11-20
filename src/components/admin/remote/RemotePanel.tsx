"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EMPTY_LIVE, MOOD_COLORS, type GameLive, type LiveField } from "@/lib/stream/games";
import type { Canvas } from "@/lib/stream/channels";
import type { QuickOp } from "@/lib/stream/quick";
import type { StreamState } from "@/lib/stream/state";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { errorText } from "../errors";

const t = en.remote;
const REFRESH_MS = 10_000;

const TILE = "relative flex flex-col gap-3 bg-ink-2 p-4 cut sm:p-5";
const LBL = "label-mono text-[11px] font-extrabold text-muted";
const BTN =
  "focus-inset flex min-h-14 items-center justify-center gap-2 px-3 label-mono text-[13px] font-extrabold cut-s transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";
const OFF = "bg-ink-3 text-paper hover:bg-bordeaux active:bg-bordeaux";
const ON = "bg-bordeaux-hi text-ink";
const BIG =
  "focus-inset flex items-center justify-center font-display text-[56px] leading-none cut-s transition-transform duration-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

type Last = { text: string; undo?: () => void } | null;

/**
 * The Remote: the buttons you need while streaming, big enough for a tablet
 * or phone. Counters, part and hours save instantly (own Redis hash, like the
 * Stream Deck); the other taps go through /api/admin/quick, which applies
 * them to the saved state on the server. Refreshes itself every 10 s.
 */
export function RemotePanel({
  initial,
  storageReady,
}: {
  initial: StreamState;
  storageReady: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<StreamState>(initial);
  const [values, setValues] = useState<{ id: string; live: GameLive } | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<Last>(null);
  const [error, setError] = useState("");
  const busyRef = useRef(false);

  const current = state.games.list.find((g) => g.id === state.games.current) ?? null;
  const live = current && values?.id === current.id ? values.live : null;
  const currentId = current?.id ?? null;

  // Keep in sync with the control room, the Stream Deck and other devices.
  useEffect(() => {
    let stop = false;
    const refresh = () => {
      if (busyRef.current) return;
      fetch("/api/admin/state", { cache: "no-store" })
        .then((res) => {
          if (res.status === 401) router.refresh();
          return res.ok ? (res.json() as Promise<StreamState>) : null;
        })
        .then((next) => {
          if (next && !stop && !busyRef.current) setState(next);
        })
        .catch(() => undefined);
      if (currentId) {
        fetch(`/api/admin/game?ids=${encodeURIComponent(currentId)}`, { cache: "no-store" })
          .then((res) => (res.ok ? (res.json() as Promise<Record<string, GameLive>>) : null))
          .then((body) => {
            if (body && !stop && !busyRef.current)
              setValues({ id: currentId, live: body[currentId] ?? EMPTY_LIVE });
          })
          .catch(() => undefined);
      }
    };
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [currentId, router]);

  async function send<T>(url: string, body: unknown): Promise<T | null> {
    if (busyRef.current || !storageReady) return null;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as T & { error?: string };
      if (!res.ok) {
        if (res.status === 401) router.refresh();
        setError(errorText(json.error));
        return null;
      }
      return json;
    } catch {
      setError(errorText());
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function change(field: LiveField, by: number, label: string, undoable = true) {
    if (!current) return;
    const id = current.id;
    const next = await send<GameLive>("/api/admin/game", { id, field, by });
    if (!next) return;
    setValues({ id, live: next });
    const amount = field === "mins" ? by / 60 : by;
    setLast({
      text: `${label} ${amount > 0 ? "+" : ""}${amount}${field === "mins" ? " h" : ""}`,
      undo: undoable ? () => void change(field, -by, label, false) : undefined,
    });
  }

  async function quick(op: QuickOp, text: string) {
    const next = await send<StreamState>("/api/admin/quick", op);
    if (!next) return;
    setState(next);
    setLast({ text });
  }

  const unit = current?.unit ?? "Part";
  const brbOn = state.brb.until !== null || state.brb.message !== "";
  const tickerOn = state.ticker.scenes.includes("gaming");
  const ch = state.channels;
  const style = current
    ? ({ "--mood": MOOD_COLORS[current.mood].a } as CSSProperties)
    : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 font-display text-3xl leading-none">{t.title}</h1>
        <span className={`inline-flex h-9 items-center px-3 label-mono text-xs font-extrabold cut-s ${state.mode === "live" ? "bg-live text-ink" : "bg-ink-3 text-muted"}`}>
          {en.admin.live.modes[state.mode]}
        </span>
        <span className="inline-flex h-9 items-center px-3 label-mono text-xs font-extrabold text-ink cut-s bg-paper">
          {channelLine(ch)}
        </span>
        <Link href="/admin" className={`${BTN} ${OFF} ml-auto min-h-9 no-underline`}>
          {t.back}
        </Link>
      </div>
      {!storageReady ? (
        <p role="alert" className="m-0 label-mono text-xs text-live">
          {en.admin.errors["storage-not-configured"]}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <div style={style} className={`${TILE} border-l-[6px] ${current ? "border-(--mood)" : "border-ink-3"}`}>
            <span className={`${LBL} ${current ? "text-(--mood)" : ""}`}>
              {current ? `${en.admin.games.moods[current.mood]} · ${t.onStream}` : t.noGame}
            </span>
            {current ? (
              <>
                <span className="font-display text-[32px] leading-none">{current.name}</span>
                <span className={LBL}>
                  {current.showPart && live ? `${unit} ${live.part} · ` : ""}
                  {live ? interpolate(t.hours, { h: Math.round((live.mins / 60) * 10) / 10 }) : t.loading}
                </span>
                {current.showPart ? (
                  <div className="grid grid-cols-[64px_1fr] gap-2">
                    <button type="button" aria-label={interpolate(t.prevPart, { unit })} disabled={busy || !live || live.part <= 1} onClick={() => change("part", -1, unit)} className={`${BTN} ${OFF}`}>←</button>
                    <button type="button" disabled={busy || !live} onClick={() => change("part", 1, unit)} className={`${BTN} min-h-16 bg-(--mood) text-ink`}>
                      {interpolate(t.nextPart, { unit })}
                    </button>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={busy || !live || live.mins < 60} onClick={() => change("mins", -60, t.hoursLabel)} className={`${BTN} ${OFF}`}>−1 h</button>
                  <button type="button" disabled={busy || !live} onClick={() => change("mins", 60, t.hoursLabel)} className={`${BTN} ${OFF}`}>+1 h</button>
                </div>
              </>
            ) : null}
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t.switchGame}</span>
              <select
                value={state.games.current ?? ""}
                disabled={busy}
                onChange={(e) => {
                  const id = e.target.value || null;
                  const name = state.games.list.find((g) => g.id === id)?.name ?? t.noGame;
                  void quick({ op: "game", id }, interpolate(t.didGame, { name }));
                }}
                className="min-h-12 w-full border-2 border-ink-3 bg-ink px-3 text-base text-paper outline-none cut-s focus:border-tq"
              >
                <option value="">{t.noGame}</option>
                {state.games.list
                  .filter((g) => !g.completedAt || g.id === state.games.current)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className={TILE}>
            <span className={LBL}>{t.quick}</span>
            <div className="grid grid-cols-2 gap-2">
              {[5, 10].map((m) => (
                <button key={m} type="button" disabled={busy} onClick={() => quick({ op: "brb", minutes: m }, interpolate(t.didBrb, { m }))} className={`${BTN} ${OFF}`}>
                  {interpolate(t.backIn, { m })}
                </button>
              ))}
              <button type="button" disabled={busy || !brbOn} onClick={() => quick({ op: "brb-clear" }, t.didBrbClear)} className={`${BTN} ${brbOn ? ON : OFF}`}>
                {brbOn ? t.brbClear : t.brbNone}
              </button>
              <button type="button" aria-pressed={tickerOn} disabled={busy} onClick={() => quick({ op: "ticker", scene: "gaming", on: !tickerOn }, tickerOn ? t.didTickerOff : t.didTickerOn)} className={`${BTN} ${tickerOn ? ON : OFF}`}>
                {t.ticker}
              </button>
              {current ? (
                <button type="button" aria-pressed={current.finalPart} disabled={busy} onClick={() => quick({ op: "final", on: !current.finalPart }, current.finalPart ? t.didFinalOff : t.didFinalOn)} className={`${BTN} ${current.finalPart ? ON : OFF}`}>
                  {interpolate(t.final, { unit })}
                </button>
              ) : null}
              {current?.widget === "poll" ? (
                <button type="button" aria-pressed={current.poll.open} disabled={busy || !current.poll.question} onClick={() => quick({ op: "poll", open: !current.poll.open }, current.poll.open ? t.didPollClose : t.didPollOpen)} className={`${BTN} ${current.poll.open ? ON : OFF}`}>
                  {current.poll.open ? t.pollClose : t.pollOpen}
                </button>
              ) : null}
            </div>
          </div>

          <div className={TILE}>
            <span className={LBL}>{t.co}</span>
            <div className="flex flex-wrap gap-2">
              {["", ...state.co.roster].map((name) => (
                <button key={name || "solo"} type="button" aria-pressed={state.co.name === name} disabled={busy} onClick={() => quick({ op: "co", name }, name ? interpolate(t.didCo, { name }) : t.didSolo)} className={`${BTN} min-h-12 ${state.co.name === name ? "bg-tq text-ink" : OFF}`}>
                  {name || t.solo}
                </button>
              ))}
            </div>
          </div>

          <div className={TILE}>
            <span className={LBL}>{t.channels}</span>
            {(["landscape", "vertical"] as Canvas[]).map((canvas) => {
              const mode = ch[canvas];
              return (
                <div key={canvas} className="flex items-center gap-2">
                  <span className="flex-1 text-[15px]">{t.canvases[canvas]}</span>
                  <button type="button" aria-pressed={!mode.guest} disabled={busy} onClick={() => quick({ op: "channel", canvas, guest: false }, interpolate(t.didHome, { canvas: t.canvases[canvas] }))} className={`${BTN} min-h-11 ${!mode.guest ? "bg-tq text-ink" : OFF}`}>
                    {t.home}
                  </button>
                  <button type="button" aria-pressed={mode.guest} disabled={busy} onClick={() => quick({ op: "channel", canvas, guest: true }, interpolate(t.didGuest, { host: mode.host }))} className={`${BTN} min-h-11 ${mode.guest ? ON : OFF}`}>
                    {mode.host}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: the big counters (first on a phone) */}
        <div className="order-first flex flex-col gap-4 md:order-none">
          {current?.widget === "counters" && current.counters.length ? (
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {current.counters.map((c, i) => {
                const field: LiveField = i === 0 ? "c1" : "c2";
                return (
                  <Counter key={field} label={c.label} value={live ? live[field] : null} total={c.total} disabled={busy || !live} onChange={(by) => change(field, by, c.label)} />
                );
              })}
            </div>
          ) : null}
          {current?.widget === "football" ? (
            <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-3">
              {(["w", "d", "l", "gf", "ga"] as const).map((field) => (
                <Counter key={field} label={en.admin.games.football[field]} value={live ? live[field] : null} disabled={busy || !live} onChange={(by) => change(field, by, en.admin.games.football[field])} compact />
              ))}
            </div>
          ) : null}
          {!current || current.widget === "none" || current.widget === "poll" ? (
            <div className={`${TILE} flex-1 items-center justify-center text-center`}>
              <p className="m-0 max-w-sm text-muted">{current ? t.noCounters : t.pickGame}</p>
            </div>
          ) : null}

          <div className={`${TILE} flex-row items-center gap-3 py-3`} aria-live="polite">
            <span className={LBL}>{t.last}</span>
            <span className={`flex-1 text-[15px] ${error ? "text-live" : ""}`}>
              {error || (last ? `${last.text} · ${t.lastNote}` : t.nothingYet)}
            </span>
            {last?.undo && !error ? (
              <button type="button" disabled={busy} onClick={() => { last.undo?.(); setLast(null); }} className={`${BTN} ${OFF} min-h-11`}>
                {t.undo}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function channelLine(ch: StreamState["channels"]): string {
  const part = (label: string, mode: { guest: boolean; host: string }) =>
    `${label} ${mode.guest ? mode.host : t.home}`;
  return [part("YT/Twitch", ch.landscape), part("TikTok", ch.vertical)].join(" · ");
}

function Counter({
  label,
  value,
  total = null,
  disabled,
  onChange,
  compact = false,
}: {
  label: string;
  value: number | null;
  total?: number | null;
  disabled: boolean;
  onChange: (by: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`${TILE} min-h-64`}>
      <span className={`${LBL} text-bordeaux-hi`}>{label}</span>
      <output aria-live="polite" className={`text-center font-display leading-none ${compact ? "text-[56px]" : "text-[96px]"}`}>
        {value ?? "…"}
        {total ? <span className="text-[32px] text-muted"> / {total}</span> : null}
      </output>
      <div className="grid flex-1 grid-cols-[1fr_2fr] gap-2">
        <button type="button" aria-label={interpolate(t.less, { label })} disabled={disabled || value === null || value <= 0} onClick={() => onChange(-1)} className={`${BIG} min-h-20 bg-ink-3 text-paper`}>
          −
        </button>
        <button type="button" aria-label={interpolate(t.more, { label })} disabled={disabled} onClick={() => onChange(1)} className={`${BIG} min-h-20 bg-tq text-ink`}>
          +
        </button>
      </div>
    </div>
  );
}
