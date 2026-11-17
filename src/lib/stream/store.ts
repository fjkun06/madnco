import "server-only";
import { getJSON, redisConfigured, setJSON } from "./redis";
import {
  DEFAULT_STATE,
  publicStatus,
  sanitizeState,
  type PublicStatus,
  type StreamState,
} from "./state";
import { twitchStatus } from "./twitch";

const STATE_KEY = "madnco:stream:state";

/** The saved state, or the defaults when nothing is saved or Redis is down. */
export async function loadState(): Promise<StreamState> {
  if (!redisConfigured()) return DEFAULT_STATE;
  try {
    const raw = await getJSON<unknown>(STATE_KEY);
    return raw ? sanitizeState(raw, Date.now()) : DEFAULT_STATE;
  } catch (error) {
    console.error("[stream] load failed", error);
    return DEFAULT_STATE;
  }
}

/** Validate and save; returns what was stored. Throws if Redis fails. */
export async function saveState(input: unknown): Promise<StreamState> {
  const now = Date.now();
  const state = { ...sanitizeState(input, now), updatedAt: now };
  await setJSON(STATE_KEY, state);
  return state;
}

/** The public status for the website and the overlays. Never throws. */
export async function loadPublicStatus(): Promise<PublicStatus> {
  const state = await loadState();
  const twitch = state.mode === "auto" ? await twitchStatus() : null;
  return publicStatus(state, twitch?.live ?? null, Date.now(), twitch?.game);
}
