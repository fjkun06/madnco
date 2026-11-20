"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { FAN_NAME_MAX, FOUNDERS_MAX, PLATFORMS, type Founder, type Platform } from "@/lib/stream/fans";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";
import { Card, StatusLine } from "../Card";
import { errorText } from "../errors";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, INPUT, LABEL } from "../fields";
import { Toggle } from "../Toggle";
import type { TabProps } from "./shared";

const t = en.admin.fans;

export type FansOverview = {
  founders: Founder[];
  twitch: { ready: boolean; connection: { login: string; status: string } | null };
};

/** Talk to /api/admin/fans; `null` while loading. */
export function useFans(onError: (msg: string) => void) {
  const [data, setData] = useState<FansOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const fail = useEffectEvent(onError);

  useEffect(() => {
    let stop = false;
    fetch("/api/admin/fans", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as FansOverview & { error?: string };
        if (stop) return;
        if (!res.ok) fail(errorText(body.error));
        else setData(body);
      })
      .catch(() => {
        if (!stop) fail(errorText());
      });
    return () => {
      stop = true;
    };
  }, []);

  async function send(body: Record<string, unknown>): Promise<FansOverview | null> {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/fans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as FansOverview & { error?: string };
      if (!res.ok) {
        onError(errorText(json.error));
        return null;
      }
      setData(json);
      return json;
    } catch {
      onError(errorText());
      return null;
    } finally {
      setBusy(false);
    }
  }

  return { data, busy, send };
}

/** A name + platform form; `alert` decides whether it plays on stream. */
export function FounderForm({
  busy,
  onAdd,
  alertByDefault,
  showAlertToggle = true,
}: {
  busy: boolean;
  onAdd: (name: string, platform: Platform, alert: boolean) => Promise<boolean>;
  alertByDefault: boolean;
  showAlertToggle?: boolean;
}) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [alert, setAlert] = useState(alertByDefault);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (await onAdd(name, platform, alert)) setName("");
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input
          aria-label={t.nameLabel}
          placeholder={t.namePlaceholder}
          value={name}
          maxLength={FAN_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          className={`${INPUT} min-w-0 flex-1`}
        />
        <button type="submit" disabled={busy || !name.trim()} className={`${CHIP} ${CHIP_ON}`}>
          {alert ? t.shoutOut : t.addQuietly}
        </button>
      </div>
      <div role="group" aria-label={t.platform} className="flex flex-wrap items-center gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={platform === p}
            onClick={() => setPlatform(p)}
            className={`${CHIP_SM} ${platform === p ? CHIP_ON : CHIP_OFF}`}
          >
            {t.platforms[p]}
          </button>
        ))}
        {showAlertToggle ? (
          <span className="ml-auto">
            <Toggle checked={alert} onChange={setAlert}>
              {t.playAlert}
            </Toggle>
          </span>
        ) : null}
      </div>
    </form>
  );
}

/** The "Fans" tab: connections, the Founders Wall, tests. All changes are instant. */
export function FansTab({ push }: TabProps) {
  const { data, busy, send } = useFans((msg) => push("error", en.admin.toasts.errorTitle, msg));
  const [confirm, setConfirm] = useState<string | null>(null);
  const notice = useSearchParams().get("connect");

  const founders = data?.founders ?? [];
  const tw = data?.twitch;

  return (
    <div className="flex flex-col gap-7">
      {notice ? (
        <StatusLine tone={notice.endsWith("-ok") ? "on" : "warn"}>
          {t.notices[notice as keyof typeof t.notices] ?? notice}
        </StatusLine>
      ) : null}

      <Card title={t.connections} hint={t.connectionsHint}>
        <ConnectionRow
          name="Twitch"
          ready={tw?.ready ?? false}
          detail={
            tw?.connection
              ? interpolate(t.twitchOn, {
                  login: tw.connection.login,
                  status: t.twitchStatus[tw.connection.status as keyof typeof t.twitchStatus] ?? tw.connection.status,
                })
              : null
          }
          what={t.twitchWhat}
          setup={t.twitchSetup}
          href="/api/admin/twitch/connect"
          connected={!!tw?.connection && tw.connection.status !== "revoked"}
        />
        <div className="flex flex-col gap-1 border-l-4 border-ink-3 pl-4">
          <span className={LABEL}>TikTok · YouTube</span>
          <p className="m-0 text-[15px] leading-relaxed text-muted">{t.othersWhat}</p>
        </div>
      </Card>

      <Card
        title={t.wall}
        hint={interpolate(t.wallHint, { n: founders.length, max: FOUNDERS_MAX })}
      >
        <p className="m-0 text-[15px] leading-relaxed text-muted">{t.wallHelp}</p>
        <FounderForm
          busy={busy}
          alertByDefault={false}
          onAdd={async (name, platform, alert) => {
            const res = await send({ op: "add", name, platform, alert });
            if (res) push("ok", t.added, interpolate(t.addedText, { name }));
            return !!res;
          }}
        />
        {data === null ? (
          <p className="m-0 label-mono text-xs text-muted">{t.loading}</p>
        ) : founders.length === 0 ? (
          <p className="m-0 text-muted">{t.empty}</p>
        ) : (
          <ol className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {founders.map((f, i) => (
              <li key={f.name} className="flex items-center gap-3 bg-ink px-3 py-2 cut-s">
                <span className="label-mono text-xs font-extrabold text-tq">
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="label-mono text-[10px] font-extrabold text-muted">
                  {t.platforms[f.platform]}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={interpolate(t.remove, { name: f.name })}
                  onClick={() => {
                    if (confirm !== f.name) return setConfirm(f.name);
                    setConfirm(null);
                    void send({ op: "remove", name: f.name });
                  }}
                  onBlur={() => setConfirm(null)}
                  className={`${CHIP_SM} ${confirm === f.name ? "bg-live text-paper" : CHIP_OFF}`}
                >
                  {confirm === f.name ? t.removeConfirm : "✕"}
                </button>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title={t.test} hint={t.testHint}>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => send({ op: "test", kind: "follow" })} className={`${CHIP} ${CHIP_OFF}`}>
            {t.testFollow}
          </button>
          <button type="button" disabled={busy} onClick={() => send({ op: "test", kind: "welcome" })} className={`${CHIP} ${CHIP_OFF}`}>
            {t.testWelcome}
          </button>
        </div>
      </Card>
    </div>
  );
}

function ConnectionRow({
  name,
  ready,
  detail,
  what,
  setup,
  href,
  connected,
}: {
  name: string;
  ready: boolean;
  detail: string | null;
  what: string;
  setup: string;
  href: string;
  connected: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-l-4 border-ink-3 pl-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={LABEL}>{name}</span>
        <span className={`label-mono text-[11px] font-extrabold ${connected ? "text-tq" : "text-muted"}`}>
          {detail ?? t.notConnected}
        </span>
        <span className="ml-auto flex gap-2">
          {ready ? (
            // A full page load: the login happens on Twitch.
            <a href={href} className={`${CHIP_SM} ${connected ? CHIP_OFF : CHIP_ON} no-underline`}>
              {connected ? t.reconnect : t.connect}
            </a>
          ) : null}
        </span>
      </div>
      <p className="m-0 text-[15px] leading-relaxed text-muted">{ready ? what : setup}</p>
    </div>
  );
}
