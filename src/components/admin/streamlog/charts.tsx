"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { LOG_PLATFORMS, type LogPlatform } from "@/lib/stream/streamLog";
import { en } from "@/locales/en";

/**
 * Hand-drawn SVG charts for the stream log (no chart library). Platform
 * colours were checked with the dataviz palette validator against the panel
 * colour (#1b1014): all pairs pass, incl. colour-blind separation.
 */
export const PLATFORM_COLOR: Record<LogPlatform, string> = {
  twitch: "#9085e9",
  youtube: "#d95926",
  tiktok: "#199e70",
};
const GRID = "#2e1f25";
const AXIS = "#4a3940";
const MUTED = "#bbaab1";
const SURFACE = "#1b1014";
const ACCENT = "#30d5c8";

const t = en.admin.log;

/** Width of a box, kept up to date (charts redraw to fit). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0].contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 1, 2, 5 × 10^n at or above `value` (at least 4, so small counts still read). */
export function niceMax(value: number): number {
  const v = Math.max(4, value);
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Which x labels fit: all when there is room, else every 5th day (1, 5, 10…)
 * for day columns, else every n-th so labels keep ~44px apart.
 */
const showLabel = (i: number, count: number, spacing: number) => {
  const gap = 44;
  if (spacing >= gap) return true;
  if (count > 12 && spacing * 5 >= gap) return i === 0 || (i + 1) % 5 === 0;
  const every = Math.max(2, Math.ceil(gap / Math.max(1, spacing)));
  return i % every === 0;
};

export function Legend({ items }: { items: { key: string; label: string; color: string; value?: string }[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm text-muted">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: item.color }} />
          {item.label}
          {item.value ? <span className="text-paper">{item.value}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export const platformLegend = (values?: Partial<Record<LogPlatform, string>>) =>
  LOG_PLATFORMS.map((p) => ({ key: p, label: t.platforms[p], color: PLATFORM_COLOR[p], value: values?.[p] }));

/** Tooltip box; flips to the left of the pointer near the right edge. */
function Tip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const right = x > width - 230;
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-2 z-10 w-max max-w-[220px] bg-ink-3 px-3 py-2 text-sm text-paper shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
      style={right ? { right: width - x + 12 } : { left: x + 12 }}
    >
      {children}
    </div>
  );
}

function YGrid({ max, top, height, left, right }: { max: number; top: number; height: number; left: number; right: number }) {
  return (
    <>
      {[0, max / 2, max].map((v) => {
        const y = top + height - (height * v) / max;
        return (
          <g key={v}>
            <line x1={left} x2={right} y1={y} y2={y} stroke={v === 0 ? AXIS : GRID} strokeWidth={1} />
            <text x={left - 8} y={y + 4} fill={MUTED} fontSize={11} textAnchor="end">
              {fmt(v)}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** A bar with only its top corners rounded (4px), anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number, round: boolean) {
  if (h <= 0) return "";
  const r = round ? Math.min(4, w / 2, h) : 0;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export type StackRow = { label: string; title: string; values: Record<LogPlatform, number> };

/** New followers: stacked columns, Twitch / YouTube / TikTok. */
export function StackedBars({ rows, height = 220, ariaLabel }: { rows: StackRow[]; height?: number; ariaLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const L = 34;
  const B = 22;
  const T = 8;
  const ph = height - B - T;
  const total = (r: StackRow) => LOG_PLATFORMS.reduce((a, p) => a + r.values[p], 0);
  const max = niceMax(Math.max(0, ...rows.map(total)));
  const slot = rows.length ? (width - L) / rows.length : 0;
  const bw = Math.max(2, Math.min(28, slot * 0.62));
  const hovered = hover !== null ? rows[hover] : null;
  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          <YGrid max={max} top={T} height={ph} left={L} right={width} />
          {rows.map((row, i) => {
            const x = L + i * slot + (slot - bw) / 2;
            let base = T + ph;
            const stacked = LOG_PLATFORMS.filter((p) => row.values[p] > 0);
            return (
              <g key={row.title}>
                {stacked.map((p, k) => {
                  const h = (ph * row.values[p]) / max;
                  const y = base - h;
                  base = y;
                  // 2px surface gap between segments.
                  const gap = k === 0 ? 0 : 2;
                  return (
                    <path
                      key={p}
                      d={barPath(x, y, bw, Math.max(0, h - gap), k === stacked.length - 1)}
                      fill={PLATFORM_COLOR[p]}
                      opacity={hover === null || hover === i ? 1 : 0.45}
                    />
                  );
                })}
                {showLabel(i, rows.length, slot) ? (
                  <text x={x + bw / 2} y={height - 6} fill={MUTED} fontSize={11} textAnchor="middle">
                    {row.label}
                  </text>
                ) : null}
                <rect
                  x={L + i * slot}
                  y={T}
                  width={slot}
                  height={ph}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onClick={() => setHover(i)}
                />
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ height }} />
      )}
      {hovered && hover !== null ? (
        <Tip x={L + hover * slot + slot / 2} width={width}>
          <p className="m-0 font-bold">{hovered.title}</p>
          {total(hovered) === 0 ? <p className="m-0 text-muted">{t.noStream}</p> : null}
          {total(hovered) === 0 ? null : LOG_PLATFORMS.map((p) => (
            <p key={p} className="m-0 text-muted">
              {t.platforms[p]} <span className="text-paper">{hovered.values[p]}</span>
            </p>
          ))}
          {total(hovered) === 0 ? null : (
            <p className="m-0 text-muted">
              {t.total} <span className="text-paper">{total(hovered)}</span>
            </p>
          )}
        </Tip>
      ) : null}
    </div>
  );
}

/** Hours live: one series, value printed on each bar (≤ 12 bars). */
export function Bars({
  rows,
  height = 150,
  unit,
  ariaLabel,
}: {
  rows: { label: string; title: string; value: number }[];
  height?: number;
  unit: string;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const L = 34;
  const B = 22;
  const T = 16;
  const ph = height - B - T;
  const max = niceMax(Math.max(0, ...rows.map((r) => r.value)));
  const slot = rows.length ? (width - L) / rows.length : 0;
  const bw = Math.max(2, Math.min(56, slot * 0.6));
  return (
    <div ref={ref} className="w-full">
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          <YGrid max={max} top={T} height={ph} left={L} right={width} />
          {rows.map((row, i) => {
            const h = (ph * row.value) / max;
            const x = L + i * slot + (slot - bw) / 2;
            return (
              <g key={row.title}>
                <title>{`${row.title}: ${fmt(row.value)} ${unit}`}</title>
                <path d={barPath(x, T + ph - h, bw, h, true)} fill={ACCENT} />
                {row.value > 0 && rows.length <= 12 ? (
                  <text x={x + bw / 2} y={T + ph - h - 5} fill="#f4efe6" fontSize={11} textAnchor="middle">
                    {fmt(row.value)}
                  </text>
                ) : null}
                {showLabel(i, rows.length, slot) ? (
                  <text x={x + bw / 2} y={height - 6} fill={MUTED} fontSize={11} textAnchor="middle">
                    {row.label}
                  </text>
                ) : null}
                <rect x={L + i * slot} y={T} width={slot} height={ph} fill="transparent" />
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ height }} />
      )}
    </div>
  );
}

export type LinePoint = {
  label: string;
  values: Record<LogPlatform, number | null>;
  details: ReactNode;
};

/** Average viewers per stream: one line per platform, a dot per stream. */
export function Lines({ points, height = 220, ariaLabel }: { points: LinePoint[]; height?: number; ariaLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const L = 34;
  const B = 22;
  const T = 10;
  const R = 16;
  const ph = height - B - T;
  const max = niceMax(
    Math.max(0, ...points.flatMap((p) => LOG_PLATFORMS.map((k) => p.values[k] ?? 0))),
  );
  const inner = width - L - R - 20;
  const xAt = (i: number) => L + 10 + (points.length > 1 ? (inner * i) / (points.length - 1) : inner / 2);
  const yAt = (v: number) => T + ph - (ph * v) / max;

  function onMove(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left + L;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(xAt(i) - x) < Math.abs(xAt(best) - x)) best = i;
    setHover(best);
  }

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          <YGrid max={max} top={T} height={ph} left={L} right={width} />
          {points.map((p, i) =>
            showLabel(i, points.length, points.length > 1 ? inner / (points.length - 1) : inner) ? (
              <text key={i} x={xAt(i)} y={height - 6} fill={MUTED} fontSize={11} textAnchor="middle">
                {p.label}
              </text>
            ) : null,
          )}
          {hover !== null ? (
            <line x1={xAt(hover)} x2={xAt(hover)} y1={T} y2={T + ph} stroke="#6e5a62" strokeDasharray="3 3" />
          ) : null}
          {LOG_PLATFORMS.map((k) => {
            // Lines only join streams that both have a value.
            const segments: string[] = [];
            let run: string[] = [];
            points.forEach((p, i) => {
              const v = p.values[k];
              if (v === null) {
                if (run.length > 1) segments.push(run.join(" "));
                run = [];
              } else run.push(`${xAt(i)},${yAt(v)}`);
            });
            if (run.length > 1) segments.push(run.join(" "));
            return (
              <g key={k}>
                {segments.map((s) => (
                  <polyline key={s} points={s} fill="none" stroke={PLATFORM_COLOR[k]} strokeWidth={2} strokeLinejoin="round" />
                ))}
                {points.map((p, i) =>
                  p.values[k] === null ? null : (
                    <circle
                      key={i}
                      cx={xAt(i)}
                      cy={yAt(p.values[k]!)}
                      r={hover === i ? 5.5 : 4.5}
                      fill={PLATFORM_COLOR[k]}
                      stroke={SURFACE}
                      strokeWidth={2}
                    />
                  ),
                )}
              </g>
            );
          })}
          <rect
            x={L}
            y={T}
            width={Math.max(0, width - L)}
            height={ph}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
          />
        </svg>
      ) : (
        <div style={{ height }} />
      )}
      {hover !== null && points[hover] ? (
        <Tip x={xAt(hover)} width={width}>
          {points[hover].details}
        </Tip>
      ) : null}
    </div>
  );
}

/** One whole split by platform (≤ 3 parts): blocks with their share printed inside. */
export function SplitBar({ values }: { values: Record<LogPlatform, number> }) {
  const total = LOG_PLATFORMS.reduce((a, p) => a + values[p], 0);
  if (!total) return null;
  const parts = LOG_PLATFORMS.filter((p) => values[p] > 0).sort((a, b) => values[b] - values[a]);
  return (
    <div className="flex h-9 w-full gap-0.5" role="img" aria-label={parts.map((p) => `${t.platforms[p]} ${values[p]}`).join(", ")}>
      {parts.map((p) => {
        const share = Math.round((values[p] / total) * 100);
        return (
          <div
            key={p}
            className="flex min-w-1 items-center overflow-hidden rounded px-2 text-sm font-extrabold whitespace-nowrap text-white"
            style={{ flex: values[p], background: PLATFORM_COLOR[p] }}
          >
            {share >= 12 ? `${share >= 25 ? `${t.platforms[p]} ` : ""}${share}%` : ""}
          </div>
        );
      })}
    </div>
  );
}
