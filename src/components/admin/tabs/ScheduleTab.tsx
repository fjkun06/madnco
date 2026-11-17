"use client";

import { PLAN_MAX } from "@/lib/stream/state";
import { en } from "@/locales/en";
import { Card } from "../Card";
import { DatePicker } from "../DatePicker";
import { CHIP, CHIP_OFF, INPUT, LABEL } from "../fields";
import { fromDateTime, relativeDay, toDateValue } from "../time";
import { TimePicker } from "../TimePicker";
import { Toggle } from "../Toggle";
import type { TabProps } from "./shared";

export function ScheduleTab({ form, update, now, issueFor }: TabProps) {
  const t = en.admin.next;
  const clock = now
    ? { h: new Date(now).getHours(), m: new Date(now).getMinutes() }
    : null;
  const today = now ? toDateValue(now) : "";
  const nextAt = fromDateTime(form.nextDate, "12:00");
  const hasNext = Boolean(form.nextDate || form.nextTime || form.nextPlan);

  return (
    <div className="flex flex-col gap-7">
      <Card title={t.title} hint={t.hint}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            id="next-date"
            label={t.date}
            value={form.nextDate}
            now={now}
            sub={nextAt && now ? relativeDay(nextAt, now) : undefined}
            issue={issueFor("nextDate")}
            onPick={(nextDate) => update({ nextDate })}
          />
          <TimePicker
            id="next-time"
            label={t.time}
            value={form.nextTime}
            issue={issueFor("nextTime")}
            pastBefore={form.nextDate && form.nextDate === today ? clock : null}
            disablePast
            onPick={(nextTime) => update({ nextTime })}
          />
        </div>
        <label className="flex flex-col gap-2">
          <span className={LABEL}>{t.plan}</span>
          <input
            type="text"
            maxLength={PLAN_MAX}
            value={form.nextPlan}
            placeholder={t.planPlaceholder}
            onChange={(event) => update({ nextPlan: event.target.value })}
            className={INPUT}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Toggle checked={form.nextShow} onChange={(nextShow) => update({ nextShow })}>
            {t.show}
          </Toggle>
          {hasNext ? (
            <button
              type="button"
              onClick={() =>
                update({ nextDate: "", nextTime: "", nextPlan: "", nextShow: true })
              }
              className={`${CHIP} ${CHIP_OFF}`}
            >
              {t.clear}
            </button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
