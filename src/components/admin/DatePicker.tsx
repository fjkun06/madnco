"use client";

import { useState, type ReactNode } from "react";
import { en } from "@/locales/en";
import { CalendarIcon } from "./icons";
import {
  CHIP_SM,
  CHIP_OFF,
  ERROR_LINE,
  FIELD_SUB,
  LABEL,
  POPOVER,
  POPOVER_INNER,
  fieldClass,
} from "./fields";
import { dateValue, formatDay, monthGrid, nextWeekday, toDateValue } from "./time";
import { usePopover } from "./usePopover";

const DAY =
  "focus-inset flex size-10 items-center justify-center text-base font-bold transition-colors duration-150 sm:size-11";

/**
 * A date field with a month calendar. Days before today are crossed out and
 * can't be picked; shortcuts for today, tomorrow and the weekend.
 */
export function DatePicker({
  id,
  label,
  value,
  onPick,
  now,
  sub,
  issue,
}: {
  id: string;
  label: string;
  value: string;
  onPick: (value: string) => void;
  /** Epoch ms; 0 before the browser clock is known. */
  now: number;
  sub?: ReactNode;
  issue?: string;
}) {
  const t = en.admin.picker;
  const w = en.admin.when;
  const { open, closing, setOpen, toggle, ref } = usePopover();
  const [view, setView] = useState({ year: 2026, month: 0 });

  const today = now ? toDateValue(now) : "";
  const [ty, tm] = today ? today.split("-").map(Number) : [0, 0];
  const atFirstMonth = view.year < ty || (view.year === ty && view.month <= tm - 1);

  function onField() {
    if (!open || closing) {
      const [y, m] = (value || today || "2026-01-01").split("-").map(Number);
      setView({ year: y, month: m - 1 });
    }
    toggle();
  }

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  function pick(day: string) {
    onPick(day);
    setOpen(false);
  }

  const d = today ? new Date(ty, tm - 1, Number(today.slice(8))) : null;
  const shortcuts: [string, string][] = d
    ? [
        [t.today, today],
        [t.tomorrow, dateValue(d.getFullYear(), d.getMonth(), d.getDate() + 1)],
        [t.sat, nextWeekday(6, now)],
        [t.sun, nextWeekday(0, now)],
      ]
    : [];

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
        onClick={onField}
        className={fieldClass(open, Boolean(issue))}
      >
        <CalendarIcon />
        <span id={`${id}-value`} className={value ? "" : "text-muted/70"}>
          {value ? formatDay(value) : t.pickDate}
        </span>
        {sub ? (
          <span className={`${FIELD_SUB} ${issue ? "text-live" : "text-muted"}`}>
            {sub}
          </span>
        ) : null}
      </button>
      {issue ? (
        <p id={`${id}-issue`} className={ERROR_LINE}>
          <span aria-hidden="true">✕</span>
          {issue}
        </p>
      ) : null}

      {open ? (
        <div className={POPOVER} data-closing={closing ? "" : undefined}>
          <div role="dialog" aria-label={label} className={POPOVER_INNER}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label={t.prevMonth}
                disabled={atFirstMonth}
                onClick={() => shift(-1)}
                className={`${CHIP_SM} ${CHIP_OFF} min-w-10 text-base`}
              >
                ‹
              </button>
              <span aria-live="polite" className="font-display text-2xl leading-none">
                {w.months[view.month]} {view.year}
              </span>
              <button
                type="button"
                aria-label={t.nextMonth}
                onClick={() => shift(1)}
                className={`${CHIP_SM} ${CHIP_OFF} min-w-10 text-base`}
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {w.weekdaysShort.map((day) => (
                <span
                  key={day}
                  aria-hidden="true"
                  className="flex h-6 items-center justify-center label-mono text-[11px] font-extrabold text-muted"
                >
                  {day}
                </span>
              ))}
              {monthGrid(view.year, view.month).map((cell) => {
                const past = Boolean(today) && cell.value < today;
                const selected = cell.value === value;
                const isToday = cell.value === today;
                let tone = "bg-ink-3 text-paper hover:bg-bordeaux";
                if (!cell.inMonth) tone = "bg-transparent text-muted hover:bg-ink-3";
                if (past) tone = "bg-transparent text-line line-through";
                if (selected) tone = "bg-tq text-ink";
                return (
                  <button
                    key={cell.value}
                    type="button"
                    disabled={past}
                    aria-pressed={selected}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={formatDay(cell.value)}
                    onClick={() => pick(cell.value)}
                    className={`${DAY} ${tone} disabled:cursor-not-allowed ${
                      isToday && !selected
                        ? "shadow-[inset_0_0_0_2px_var(--color-bordeaux-hi)]"
                        : ""
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {shortcuts.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {shortcuts.map(([name, day]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => pick(day)}
                    className={`${CHIP_SM} ${day === value ? "bg-tq text-ink" : CHIP_OFF}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
