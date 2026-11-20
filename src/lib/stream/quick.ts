/**
 * One-tap changes from the Remote (/admin/remote). Each applies to the saved
 * state on the server, so a tap never sends a whole (maybe stale) form.
 * Pure, so every rule is unit-tested.
 */

import { CANVASES, cleanHandle, pickCo, type Canvas } from "./channels";
import { TICKER_SCENES, type TickerScene } from "./extras";
import type { StreamState } from "./state";

export type QuickOp =
  /** "Back in N min" (null = no timer), keeps the message. */
  | { op: "brb"; minutes: number | null }
  /** Clear the BRB message and timer. */
  | { op: "brb-clear" }
  | { op: "ticker"; scene: TickerScene; on: boolean }
  | { op: "final"; on: boolean }
  | { op: "poll"; open: boolean }
  /** The game on stream (null = none). */
  | { op: "game"; id: string | null }
  /** Tonight's Co ("" = solo). */
  | { op: "co"; name: string }
  | { op: "channel"; canvas: Canvas; guest: boolean; host?: string };

const BRB_MAX_MIN = 120;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A valid op from untrusted JSON, or `null`. */
export function parseQuickOp(input: unknown): QuickOp | null {
  if (!isObject(input) || typeof input.op !== "string") return null;
  const on = input.on === true;
  switch (input.op) {
    case "brb": {
      const m = input.minutes;
      if (m === null) return { op: "brb", minutes: null };
      return typeof m === "number" && Number.isFinite(m) && m >= 1 && m <= BRB_MAX_MIN
        ? { op: "brb", minutes: Math.round(m) }
        : null;
    }
    case "brb-clear":
      return { op: "brb-clear" };
    case "ticker":
      return TICKER_SCENES.includes(input.scene as TickerScene)
        ? { op: "ticker", scene: input.scene as TickerScene, on }
        : null;
    case "final":
      return { op: "final", on };
    case "poll":
      return { op: "poll", open: input.open === true };
    case "game":
      return input.id === null || (typeof input.id === "string" && /^[a-z0-9-]{1,56}$/.test(input.id))
        ? { op: "game", id: input.id as string | null }
        : null;
    case "co":
      return typeof input.name === "string" ? { op: "co", name: input.name } : null;
    case "channel": {
      if (!CANVASES.includes(input.canvas as Canvas)) return null;
      const host = input.host === undefined ? undefined : cleanHandle(input.host);
      if (host === "") return null;
      return { op: "channel", canvas: input.canvas as Canvas, guest: input.guest === true, host };
    }
    default:
      return null;
  }
}

/**
 * The state after the tap, or `null` when it can't apply (e.g. a game that
 * isn't in the library, or Final part with no game on stream).
 */
export function applyQuick(state: StreamState, op: QuickOp, now: number): StreamState | null {
  const games = state.games;
  const current = games.list.find((g) => g.id === games.current) ?? null;
  const setCurrent = (patch: Partial<NonNullable<typeof current>>) => ({
    ...state,
    games: {
      ...games,
      list: games.list.map((g) => (g.id === current?.id ? { ...g, ...patch } : g)),
    },
  });

  switch (op.op) {
    case "brb":
      return {
        ...state,
        brb: { ...state.brb, until: op.minutes === null ? null : now + op.minutes * 60_000 },
      };
    case "brb-clear":
      return { ...state, brb: { message: "", until: null } };
    case "ticker": {
      const scenes = state.ticker.scenes.filter((s) => s !== op.scene);
      if (op.on) scenes.push(op.scene);
      return { ...state, ticker: { ...state.ticker, scenes } };
    }
    case "final":
      return current ? setCurrent({ finalPart: op.on }) : null;
    case "poll":
      if (!current || current.widget !== "poll") return null;
      return setCurrent({
        poll: { ...current.poll, open: op.open, openedAt: op.open ? now : current.poll.openedAt },
      });
    case "game":
      if (op.id !== null && !games.list.some((g) => g.id === op.id)) return null;
      return { ...state, games: { ...games, current: op.id } };
    case "co":
      return { ...state, co: pickCo(state.co, op.name) };
    case "channel":
      return {
        ...state,
        channels: {
          ...state.channels,
          [op.canvas]: {
            guest: op.guest,
            host: op.host ?? state.channels[op.canvas].host,
          },
        },
      };
  }
}
