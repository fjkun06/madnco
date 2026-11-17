"use client";

import { useSyncExternalStore } from "react";
import type { PublicStatus } from "./state";

/**
 * The live status on the website, shared by every component that shows it.
 * The page renders offline first (static HTML, good for SEO and speed);
 * after hydration one shared poller asks /api/stream every minute and
 * whenever the tab becomes visible again.
 */

export type StreamSnapshot = { status: PublicStatus; at: number } | null;

const POLL_MS = 60_000;

let snapshot: StreamSnapshot = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function emit() {
  for (const listener of listeners) listener();
}

function refresh() {
  if (typeof fetch !== "function") return;
  fetch("/api/stream")
    .then((res) => (res.ok ? (res.json() as Promise<PublicStatus>) : null))
    .then((status) => {
      if (!status) return;
      snapshot = { status, at: Date.now() };
      emit();
    })
    .catch(() => undefined);
}

function onVisible() {
  if (document.visibilityState === "visible") refresh();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refresh();
    timer = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

/** The latest status with the time it was fetched, or `null` before the first answer. */
export function useStreamStatus(): StreamSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => null,
  );
}

/** Tests only: set the shared snapshot and notify components. */
export function setStreamSnapshotForTests(next: StreamSnapshot) {
  snapshot = next;
  emit();
}
