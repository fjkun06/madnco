"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { en } from "@/locales/en";
import { ClockIcon } from "./icons";
import {
  ERROR_LINE,
  FIELD_SUB,
  LABEL,
  POPOVER,
  POPOVER_INNER,
  fieldClass,
} from "./fields";
import { usePopover } from "./usePopover";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad = (n: number) => String(n).padStart(2, "0");

const SLOT =
  "focus-inset flex h-10 w-24 flex-none items-center justify-center font-mono text-[17px] font-extrabold transition-colors duration-150";

/** A scrolling column with a thin turquoise scrollbar (no white OS bar). */
const COLUMN =
  "picker-column relative flex max-h-[236px] flex-col gap-1.5 overflow-x-hidden overflow-y-auto overscroll-contain pr-1.5";

function slotClass(selected: boolean, past: boolean): string {
  if (selected) return `${SLOT} bg-tq text-ink`;
  if (past) return `${SLOT} bg-transparent text-line line-through hover:bg-ink-3`;
  return `${SLOT} bg-ink-3 text-paper hover:bg-bordeaux`;
}

/**
 * A time field that opens an hour and a minute column (5-minute steps).
 * Picking a minute first uses the suggested hour, so one tap is enough.
 * `pastBefore` crosses out times before it (same day); they stay pickable
 * unless `disablePast`, so the caller decides what a past time means.
 */
export function TimePicker({
  id,
  label,
  value,
  onPick,
  sub,
  issue,
  pastBefore,
  disablePast = false,
}: {
  id: string;
  label: string;
  value: string;
  onPick: (value: string) => void;
  sub?: ReactNode;
  issue?: string;
  pastBefore?: { h: number; m: number } | null;
  disablePast?: boolean;
}) {
  const t = en.admin.picker;
  const { open, closing, setOpen, toggle, ref } = usePopover();
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const [hh, mm] = value ? value.split(":").map(Number) : [null, null];
  // Without a value, the lists open at a sensible hour: the next one from
  // now when past times matter, otherwise 20:00 (usual stream time).
  const suggested = pastBefore ? Math.min(pastBefore.h + 1, 23) : 20;
  const hour = hh ?? suggested;

  // Scroll the picked (or the current) hour into the middle when opening.
  useEffect(() => {
    if (!open) return;
    for (const list of [hoursRef.current, minutesRef.current]) {
      const target =
        list?.querySelector<HTMLElement>("[aria-pressed='true']") ??
        list?.querySelector<HTMLElement>("[data-now]");
      if (list && target) {
        list.scrollTop = target.offsetTop - list.clientHeight / 2 + target.clientHeight / 2;
      }
    }
  }, [open]);

  const hourPast = (h: number) => Boolean(pastBefore && h < pastBefore.h);
  const minutePast = (m: number) =>
    Boolean(
      pastBefore &&
      (hour < pastBefore.h || (hour === pastBefore.h && m <= pastBefore.m)),
    );

  return (
    <div ref={ref} className="relative flex flex-col gap-2">
      <span id={`${id}-label`} className={LABEL}>
        {label}
      </span>
      <button
        type="button"
        data-trigger
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-invalid={issue ? true : undefined}
        aria-describedby={issue ? `${id}-issue` : undefined}
        onClick={toggle}
        className={fieldClass(open, Boolean(issue))}
      >
        <ClockIcon />
        <span id={`${id}-value`} className={value ? "" : "text-muted/70"}>
          {value || t.pickTime}
        </span>
        {sub ? <span className={`${FIELD_SUB} text-muted`}>{sub}</span> : null}
      </button>
      {issue ? (
        <p id={`${id}-issue`} className={ERROR_LINE}>
          <span aria-hidden="true">✕</span>
          {issue}
        </p>
      ) : null}

      {open ? (
        <div className={POPOVER} data-closing={closing ? "" : undefined}>
          <div role="dialog" aria-label={label} className={`${POPOVER_INNER} flex gap-3`}>
            <div className="flex flex-col gap-2">
              <span className={LABEL}>{t.hour}</span>
              <div
                ref={hoursRef}
                className={COLUMN}
              >
                {HOURS.map((h) => {
                  const past = hourPast(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={hh === h}
                      data-now={h === suggested ? "" : undefined}
                      disabled={disablePast && past}
                      onClick={() => onPick(`${pad(h)}:${pad(mm ?? 0)}`)}
                      className={`${slotClass(hh === h, past)} disabled:cursor-not-allowed ${
                        hh === null && h === suggested
                          ? "shadow-[inset_0_0_0_2px_var(--color-tq)]"
                          : ""
                      }`}
                    >
                      {pad(h)}
                    </button>
                  );
                })}
              </div>
            </div>
            <span
              aria-hidden="true"
              className="self-center pt-6 font-display text-4xl text-tq"
            >
              :
            </span>
            <div className="flex flex-col gap-2">
              <span className={LABEL}>{t.minute}</span>
              <div
                ref={minutesRef}
                className={COLUMN}
              >
                {MINUTES.map((m) => {
                  const past = minutePast(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={mm === m}
                      disabled={disablePast && past}
                      onClick={() => {
                        onPick(`${pad(hour)}:${pad(m)}`);
                        setOpen(false);
                      }}
                      className={`${slotClass(mm === m, past)} disabled:cursor-not-allowed`}
                    >
                      {pad(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
