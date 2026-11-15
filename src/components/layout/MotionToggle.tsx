"use client";

import { useSyncExternalStore } from "react";
import { isPaused, setPaused, subscribePaused } from "@/lib/motion/pause";

/**
 * The footer's "Pause animations" button (see lib/motion/pause.ts). Its label
 * says what it will do: "Pause animations" while things move, "Play
 * animations" once they're paused.
 */
export function MotionToggle({ pause, play }: { pause: string; play: string }) {
  const paused = useSyncExternalStore(subscribePaused, isPaused, () => false);
  return (
    <button
      type="button"
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
      className="cursor-pointer border-0 bg-transparent p-0 text-left label-mono text-xs text-muted underline underline-offset-2 hover:text-tq"
    >
      {paused ? play : pause}
    </button>
  );
}
