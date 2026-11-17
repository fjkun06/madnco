import type { ReactNode } from "react";
import { interpolate, interpolateParts } from "@/utils/interpolate";
import { dayOffset, formatDuration, relativeDay, toTimeValue } from "../time";

/**
 * The text under a timer: "Live at 20:00 today · in 1 h 12 min" while it
 * runs (the time in pink when it means tomorrow), `ended` once it hit zero,
 * `none` without a timer.
 */
export function timerLine(
  to: number | null,
  now: number,
  text: { running: string; ended: string; none: string },
): { line: ReactNode; tone: "on" | "warn" | "off"; tomorrow: boolean } {
  if (!to) return { line: text.none, tone: "off", tomorrow: false };
  if (!now) return { line: toTimeValue(to), tone: "on", tomorrow: false };
  if (to <= now) {
    return {
      line: interpolate(text.ended, { time: toTimeValue(to) }),
      tone: "on",
      tomorrow: false,
    };
  }
  const tomorrow = dayOffset(to, now) >= 1;
  const line = interpolateParts(text.running, {
    when: `${toTimeValue(to)} ${relativeDay(to, now)}`,
    left: formatDuration(to - now),
  }).map((part, i) =>
    part.slot === "when" ? (
      <b key={i} className={tomorrow ? "text-bordeaux-hi" : "text-tq"}>
        {part.text}
      </b>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  );
  return { line, tone: tomorrow ? "warn" : "on", tomorrow };
}
