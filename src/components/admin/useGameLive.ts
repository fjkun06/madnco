"use client";

import { useEffect, useRef, useState } from "react";
import { EMPTY_LIVE, type GameLive, type LiveField } from "@/lib/stream/games";

/**
 * Live numbers of one game (part, counters, W/D/L, hours), loaded from and
 * saved to /api/admin/game. Shared by the Games tab and the Remote, so both
 * behave the same: a tap saves, then shows the server's number.
 *
 * `refreshMs` re-reads the numbers now and then (the Remote, to follow the
 * Stream Deck and other devices). A re-read never overwrites a tap: if a tap
 * happened while it was on the way, its answer is thrown away.
 */
export function useGameLive(id: string | null, onError: () => void, refreshMs?: number) {
  const [values, setValues] = useState<{ id: string; live: GameLive } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const taps = useRef(0);

  useEffect(() => {
    if (!id) return;
    let stop = false;
    const load = (first: boolean) => {
      if (!first && busyRef.current) return;
      const seen = taps.current;
      fetch(`/api/admin/game?ids=${encodeURIComponent(id)}`, { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<Record<string, GameLive>>) : null))
        .then((body) => {
          if (stop || busyRef.current || taps.current !== seen) return;
          if (body || first) setValues({ id, live: body?.[id] ?? EMPTY_LIVE });
        })
        .catch(() => {
          if (!stop && first) setValues({ id, live: EMPTY_LIVE });
        });
    };
    load(true);
    const timer = refreshMs ? setInterval(() => load(false), refreshMs) : null;
    const onVisible = () => {
      if (refreshMs && document.visibilityState === "visible") load(false);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id, refreshMs]);

  async function send(body: Record<string, unknown>): Promise<boolean> {
    if (!id || busyRef.current) return false;
    busyRef.current = true;
    taps.current += 1;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setValues({ id, live: (await res.json()) as GameLive });
      return true;
    } catch {
      onError();
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return {
    live: values && values.id === id ? values.live : null,
    busy,
    change: (field: LiveField, by: number) => send({ field, by }),
    reset: () => send({ reset: true }),
  };
}
