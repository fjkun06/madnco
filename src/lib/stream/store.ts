import "server-only";
import { getJSON, redisConfigured, setJSON } from "./redis";
import {
  DEFAULT_STATE,
  prepareSave,
  pruneState,
  publicStatus,
  sanitizeState,
  saveError,
  type PublicStatus,
  type SaveError,
  type StreamState,
} from "./state";
import { completedProfiles } from "./games";
import { loadGameLive } from "./gameStore";
import { twitchStatus } from "./twitch";

const STATE_KEY = "madnco:stream:state";

/**
 * The saved state without anything long over, or the defaults when nothing
 * is saved or Redis is down.
 */
export async function loadState(): Promise<StreamState> {
  if (!redisConfigured()) return DEFAULT_STATE;
  try {
    const raw = await getJSON<unknown>(STATE_KEY);
    const now = Date.now();
    return raw ? pruneState(sanitizeState(raw, now), now) : DEFAULT_STATE;
  } catch (error) {
    console.error("[stream] load failed", error);
    return DEFAULT_STATE;
  }
}

/**
 * Validate and save. Returns what was stored, or why it was refused (a new
 * date that is already over). Throws if Redis fails.
 */
export async function saveState(
  input: unknown,
): Promise<{ state: StreamState } | { error: SaveError }> {
  const now = Date.now();
  const saved = await loadState();
  const state = sanitizeState(input, now);
  const error = saveError(state, saved, now);
  if (error) return { error };
  const stored = prepareSave(state, saved, now);
  await setJSON(STATE_KEY, stored);
  return { state: stored };
}

/** The public status for the website and the overlays. Never throws. */
export async function loadPublicStatus(): Promise<PublicStatus> {
  const state = await loadState();
  const ids = [
    ...(state.games.current ? [state.games.current] : []),
    ...completedProfiles(state.games).map((g) => g.id),
  ];
  const [twitch, live] = await Promise.all([
    state.mode === "auto" ? twitchStatus() : Promise.resolve(null),
    loadGameLive(ids),
  ]);
  return publicStatus(state, twitch?.live ?? null, Date.now(), twitch?.game, live);
}
