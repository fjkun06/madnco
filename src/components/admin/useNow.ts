"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time for texts like "in 1 h 12 min", refreshed every 15 s.
 * 0 on the server and during hydration, so callers hide relative texts
 * until the browser has a clock (no hydration mismatch, no Date.now() in
 * render).
 */

const TICK_MS = 15_000;

let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  now = Date.now();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

function getSnapshot() {
  if (now === 0) now = Date.now();
  return now;
}

const getServerSnapshot = () => 0;

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Read the clock right now (event handlers), keeping the shared value fresh. */
export function readNow(): number {
  now = Date.now();
  return now;
}
