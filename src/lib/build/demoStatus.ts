/**
 * The made-up stream for the /build demo: what the demo remote changes, and
 * the status the overlays draw from it. Pure, so it's tested; nothing here
 * touches the real stream.
 */
import type { Alert } from "@/lib/stream/fans";
import type { Mood, PublicPlay } from "@/lib/stream/games";
import { OFFLINE_STATUS, type PublicStatus } from "@/lib/stream/state";
import type { DemoScene } from "./demoOverlay";

export const DEMO_MOODS: readonly Mood[] = ["action", "horror", "football", "story", "retro"];

type Preset = {
  name: string;
  short: string;
  unit: string;
  goals: readonly string[];
  /** Counter labels and their "out of" totals; none = football scoreboard. */
  counters: readonly { label: string; total: number | null }[];
  start: DemoValues;
};

export type DemoValues = {
  part: number;
  c1: number;
  c2: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
};

const ZERO: DemoValues = { part: 1, c1: 0, c2: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };

export const PRESETS: Record<Mood, Preset> = {
  action: {
    name: "Call of Duty: Modern Warfare 4",
    short: "MW4",
    unit: "Part",
    goals: [
      "Beat the campaign on Veteran before 1,000 deaths?",
      "Clear this mission without dying once",
      "Chat bets: how many deaths this mission?",
    ],
    counters: [{ label: "Deaths", total: 1000 }],
    start: { ...ZERO, part: 3, c1: 214 },
  },
  horror: {
    name: "Resident Evil Village",
    short: "RE Village",
    unit: "Part",
    goals: ["Find Rose without screaming", "Survive the castle on Hardcore", "Don't open that door"],
    counters: [
      { label: "Jump scares", total: null },
      { label: "Deaths", total: null },
    ],
    start: { ...ZERO, part: 2, c1: 9, c2: 4 },
  },
  football: {
    name: "EA FC 27",
    short: "EA FC 27",
    unit: "Session",
    goals: ["Road to Division 1 on Legendary", "Win 3 in a row", "Score from a corner"],
    counters: [],
    start: { ...ZERO, part: 7, w: 3, d: 1, l: 2, gf: 14, ga: 9 },
  },
  story: {
    name: "God of War",
    short: "God of War",
    unit: "Ep",
    goals: [
      "First playthrough on the hardest setting",
      "Beat the Valkyrie queen",
      "No guides, no hints",
    ],
    counters: [
      { label: "Deaths", total: null },
      { label: "Bosses beaten", total: null },
    ],
    start: { ...ZERO, part: 4, c1: 37, c2: 2 },
  },
  retro: {
    name: "PES 6",
    short: "PES 6",
    unit: "Special",
    goals: ["PES 6 vs FC 27: which is better?", "Win on Top Player", "Master League, season 1"],
    counters: [],
    start: { ...ZERO, part: 1, w: 1, d: 0, l: 1, gf: 4, ga: 5 },
  },
};

/** Who "follows" when someone taps the alert button. */
export const DEMO_FANS = [
  "@you",
  "@your_bestie",
  "@the_lurker",
  "@chat_legend",
  "@death_bettor",
  "@rage_witness",
  "@pidgin_teacher",
  "@founder_vibes",
] as const;

export type DemoState = {
  mood: Mood;
  scene: DemoScene;
  vertical: boolean;
  values: Record<Mood, DemoValues>;
  /** Index into the mood's goals. */
  goal: number;
  founders: number;
  alerts: Alert[];
  /** When the current scene was picked (countdown / BRB timers start then). */
  sceneAt: number;
};

export function initialDemo(now: number): DemoState {
  return {
    mood: "action",
    scene: "gaming",
    vertical: false,
    values: Object.fromEntries(DEMO_MOODS.map((m) => [m, { ...PRESETS[m].start }])) as Record<
      Mood,
      DemoValues
    >,
    goal: 0,
    founders: 3,
    alerts: [],
    sceneAt: now,
  };
}

export type DemoField = keyof DemoValues;

/** +1 / −1 on one number of the current game (never below 0, parts from 1). */
export function bump(state: DemoState, field: DemoField, by: number): DemoState {
  const current = state.values[state.mood];
  const min = field === "part" ? 1 : 0;
  const next = { ...current, [field]: Math.max(min, current[field] + by) };
  if (field === "w" && by > 0) next.gf = current.gf + 2;
  if (field === "l" && by > 0) next.ga = current.ga + 2;
  if (field === "d" && by > 0) {
    next.gf = current.gf + 1;
    next.ga = current.ga + 1;
  }
  return { ...state, values: { ...state.values, [state.mood]: next } };
}

/** A new follower: founder number up, alert queued (the overlay plays it). */
export function follow(state: DemoState, now: number): DemoState {
  const n = Math.min(50, state.founders + 1);
  const alert: Alert = {
    id: `demo-${now}`,
    kind: "follow",
    name: DEMO_FANS[(n - 1) % DEMO_FANS.length],
    platform: "tiktok",
    n,
    at: now,
  };
  return { ...state, founders: n, alerts: [...state.alerts, alert].slice(-5) };
}

function demoPlay(state: DemoState): PublicPlay {
  const preset = PRESETS[state.mood];
  const v = state.values[state.mood];
  const football = preset.counters.length === 0;
  return {
    id: `demo-${state.mood}`,
    name: preset.name,
    short: preset.short,
    mood: state.mood,
    unit: preset.unit,
    part: v.part,
    goal: preset.goals[state.goal % preset.goals.length],
    previously: "",
    widget: football ? "football" : "counters",
    counters: preset.counters.map((c, i) => ({
      label: c.label,
      value: i === 0 ? v.c1 : v.c2,
      total: c.total,
    })),
    football: { w: v.w, d: v.d, l: v.l, gf: v.gf, ga: v.ga, record: true, goals: true },
    title: true,
    cardPos: "bl",
    poll: null,
    ticker: [],
    finalPart: false,
    completed: false,
    hours: 6,
    art: null,
  };
}

/** The status the overlays draw for the demo. */
export function demoStatus(state: DemoState, now: number): PublicStatus {
  const play = demoPlay(state);
  const founders = Array.from({ length: state.founders }, (_, i) => ({
    name: DEMO_FANS[i % DEMO_FANS.length],
    platform: "tiktok" as const,
  }));
  return {
    ...OFFLINE_STATUS,
    live: true,
    source: "manual",
    game: play.name,
    topic: "",
    countdown:
      state.scene === "starting-soon" ? { from: state.sceneAt, to: state.sceneAt + 5 * 60_000 } : null,
    next:
      state.scene === "ending"
        ? { at: nextSaturday(now), plan: `${play.name} · ${play.unit} ${state.values[state.mood].part + 1}` }
        : null,
    brb:
      state.scene === "brb"
        ? { message: "Getting water. Nobody touch my death counter.", until: state.sceneAt + 4 * 60_000 }
        : { message: "", until: null },
    ticker: { items: [], scenes: [] },
    quest: {
      ...OFFLINE_STATUS.quest,
      followers: state.founders,
      goal: 50,
      done: state.founders >= 50,
      onBrb: true,
      onStarting: true,
    },
    play,
    channels: {
      landscape: { guest: false, host: "", url: "" },
      vertical: { guest: false, host: "", url: "" },
      guestLine: "",
      homeCard: false,
    },
    co: { name: "", roster: [] },
    fans: { founders, goal: 50, alerts: state.alerts },
  };
}

/** Next Saturday 20:00 local time (for "Next stream" on Ending). */
function nextSaturday(now: number): number {
  const d = new Date(now);
  d.setHours(20, 0, 0, 0);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.getTime();
}
