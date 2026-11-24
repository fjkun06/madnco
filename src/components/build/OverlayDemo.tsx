"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { DEMO_SCENES, type DemoScene } from "@/lib/build/demoOverlay";
import {
  DEMO_MOODS,
  PRESETS,
  bump,
  demoStatus,
  follow,
  initialDemo,
  type DemoField,
  type DemoState,
} from "@/lib/build/demoStatus";
import { en } from "@/locales/en";
import { interpolate } from "@/utils/interpolate";

const t = en.build.demo;

const CHIP =
  "focus-inset label-mono inline-flex min-h-11 items-center px-3.5 text-[11px] font-extrabold cut-s transition-colors duration-200 ease-smooth sm:text-[12px]";
const CHIP_OFF = "bg-ink-3 text-paper hover:bg-bordeaux";
const CHIP_ON = "bg-tq text-ink";
const BIG =
  "focus-inset font-display inline-flex min-h-20 items-center justify-center px-3 text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] leading-none cut-s transition-[transform,background-color] duration-150 ease-smooth active:scale-95 motion-reduce:active:scale-100";
const GROUP = "label-mono mt-5 mb-2 block text-[11px] font-bold text-muted";

/**
 * The page lends the overlay its own fonts (served by next/font from this
 * site): the demo HTML has no Google Fonts links, so the iframe gets the
 * site's @font-face rules under the names the overlay CSS asks for.
 */
function lendFonts(doc: Document) {
  if (doc.getElementById("madnco-lent-fonts")) return;
  const names: [RegExp, string][] = [
    [/lilita/i, "Lilita One"],
    [/rubik/i, "Rubik"],
    [/jetbrains/i, "JetBrains Mono"],
  ];
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(list)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue("font-family");
      if (/fallback/i.test(family)) continue;
      const match = names.find(([re]) => re.test(family));
      if (match) rules.push(rule.cssText.replace(/font-family:[^;]+;/, `font-family: "${match[1]}";`));
    }
  }
  const style = doc.createElement("style");
  style.id = "madnco-lent-fonts";
  style.textContent = rules.join("\n");
  doc.head.appendChild(style);
}

function frameSrc(scene: DemoScene, vertical: boolean) {
  return `/build/overlay/${vertical ? "v-" : ""}${scene}${!vertical && scene === "gaming" ? "?cam=tr" : ""}`;
}

/** The demo remote next to the real overlay (in demo mode, see live.js). */
export function OverlayDemo() {
  // Scene timers start from the tap that picks the scene (event time), so
  // the first render needs no clock and matches the server's.
  const [state, setState] = useState<DemoState>(() => initialDemo(0));
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  const send = useEffectEvent(() => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    win.postMessage({ madncoDemo: demoStatus(state, Date.now()) }, location.origin);
  });

  useEffect(() => {
    send();
  }, [state]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (!(event.data && event.data.madncoDemoReady)) return;
      try {
        const doc = frame.current?.contentDocument;
        if (doc) lendFonts(doc);
      } catch {
        // Fonts are a nicety; the overlay still works with its fallbacks.
      }
      setLoaded(true);
      send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const update = (next: (s: DemoState) => DemoState) => setState(next);
  const tap = (field: DemoField, by: number) => update((s) => bump(s, field, by));
  const pickScene = (scene: DemoScene) => {
    if (state.scene !== scene) setLoaded(false);
    update((s) => ({ ...s, scene, sceneAt: Date.now() }));
  };
  const pickFormat = (vertical: boolean) => {
    if (state.vertical !== vertical) setLoaded(false);
    update((s) => ({ ...s, vertical }));
  };

  const s = state;
  const preset = PRESETS[s.mood];
  const v = s.values[s.mood];
  const football = preset.counters.length === 0;
  const { scene, vertical } = s;
  const headline = football
    ? interpolate(t.record, { w: v.w, d: v.d, l: v.l })
    : `${preset.counters[0].label} ${v.c1}${preset.counters[0].total ? ` / ${preset.counters[0].total}` : ""}`;

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:gap-5">
      {/* The screen: first on phones, so a tap and its effect are both in view. */}
      <div className="flex flex-col gap-3 bg-ink-2 p-3 sm:p-4 lg:order-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="label-mono text-[11px] font-bold text-muted">{t.screen}</span>
          <div role="group" aria-label={t.format} className="ml-auto flex bg-ink p-0.5">
            {[false, true].map((vert) => (
              <button
                key={String(vert)}
                type="button"
                aria-pressed={vertical === vert}
                onClick={() => pickFormat(vert)}
                className={`focus-inset label-mono min-h-10 px-3 text-[10px] font-extrabold sm:text-[11px] ${
                  vertical === vert ? "bg-ink-3 text-paper" : "text-muted hover:text-paper"
                }`}
              >
                {vert ? t.vertical : t.landscape}
              </button>
            ))}
          </div>
        </div>
        <div
          className={`relative mx-auto w-full overflow-clip border-2 border-ink-3 bg-ink ${
            vertical ? "aspect-[9/16] max-w-[min(100%,calc(70svh*9/16))]" : "aspect-video"
          }`}
        >
          <Backdrop scene={scene} vertical={vertical} />
          <iframe
            ref={frame}
            key={frameSrc(scene, vertical)}
            src={frameSrc(scene, vertical)}
            title={t.frame}
            tabIndex={-1}
            className={`pointer-events-none absolute inset-0 size-full border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          {!loaded ? (
            <p className="absolute inset-0 m-0 flex items-center justify-center label-mono text-[11px] font-bold text-muted">
              {t.loading}
            </p>
          ) : null}
        </div>
        <p className="m-0 label-mono text-[10px] font-bold text-tq sm:text-[11px]">{t.speed}</p>
      </div>

      {/* The remote */}
      <div className="bg-ink-2 p-5 cut lg:order-1">
        <span className="label-mono text-[11px] font-bold text-tq">{t.remote}</span>
        <h3 className="mt-1.5 mb-4 font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-none">
          {t.remoteTitle}
        </h3>
        <p aria-live="polite" className="m-0 mb-3 flex flex-col gap-1.5">
          <span className="label-mono text-[11px] font-bold text-muted">{preset.name}</span>
          <span className="font-display text-[clamp(1.75rem,1.3rem+1.2vw,2.5rem)] leading-none text-tq">
            {headline}
          </span>
        </p>
        {football ? (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => tap("w", 1)} className={`${BIG} bg-bordeaux-hi text-ink`}>
              {t.win}
            </button>
            <button type="button" onClick={() => tap("d", 1)} className={`${BIG} bg-ink-3 text-paper`}>
              {t.draw}
            </button>
            <button type="button" onClick={() => tap("l", 1)} className={`${BIG} bg-ink-3 text-paper`}>
              {t.loss}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1.5fr] gap-2">
            <button
              type="button"
              aria-label={`${t.minus} ${preset.counters[0].label}`}
              onClick={() => tap("c1", -1)}
              className={`${BIG} bg-ink-3 text-paper`}
            >
              {t.minus}
            </button>
            <button type="button" onClick={() => tap("c1", 1)} className={`${BIG} bg-bordeaux-hi text-ink`}>
              {t.plus} <span className="ml-2 text-[0.55em]">{preset.counters[0].label}</span>
            </button>
            {preset.counters[1] ? (
              <button
                type="button"
                onClick={() => tap("c2", 1)}
                className={`${CHIP} ${CHIP_OFF} col-span-2 justify-center`}
              >
                {t.plus} {preset.counters[1].label} · {v.c2}
              </button>
            ) : null}
          </div>
        )}

        <span className={GROUP}>{t.mode}</span>
        <div role="group" aria-label={t.mode} className="flex flex-wrap gap-2">
          {DEMO_MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              aria-pressed={s.mood === mood}
              onClick={() => update((x) => ({ ...x, mood, goal: 0 }))}
              className={`${CHIP} ${s.mood === mood ? CHIP_ON : CHIP_OFF}`}
            >
              {t.moods[mood]}
            </button>
          ))}
        </div>

        <span className={GROUP}>{t.scene}</span>
        <div role="group" aria-label={t.scene} className="flex flex-wrap gap-2">
          {DEMO_SCENES.map((sc) => (
            <button
              key={sc}
              type="button"
              aria-pressed={scene === sc}
              onClick={() => pickScene(sc)}
              className={`${CHIP} ${scene === sc ? CHIP_ON : CHIP_OFF}`}
            >
              {t.scenes[sc]}
            </button>
          ))}
        </div>

        <span className={GROUP}>{t.extras}</span>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => tap("part", 1)} className={`${CHIP} ${CHIP_OFF}`}>
            {t.nextPart}
          </button>
          <button
            type="button"
            onClick={() => update((x) => follow(x, Date.now()))}
            className={`${CHIP} ${CHIP_OFF}`}
          >
            {t.follow}
          </button>
          <button
            type="button"
            onClick={() => update((x) => ({ ...x, goal: x.goal + 1 }))}
            className={`${CHIP} ${CHIP_OFF}`}
          >
            {t.goal}
          </button>
        </div>

        <p className="mt-5 mb-0 border border-dashed border-line p-3 text-sm leading-normal text-muted">
          {t.note}
        </p>
      </div>
    </div>
  );
}

/**
 * Behind the overlay: a stand-in for the game and the cam, so the holes the
 * overlay leaves for them read as "game" and "cam" (no game art).
 */
function Backdrop({ scene, vertical }: { scene: DemoScene; vertical: boolean }) {
  if (scene !== "gaming") return <div aria-hidden="true" className="absolute inset-0 bg-ink" />;
  const cam = vertical
    ? "left-0 top-[10.94%] h-[31.67%] w-full"
    : "left-[73.33%] top-[2.96%] h-[25%] w-[25%]";
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div
        className={`absolute flex items-center justify-center bg-[radial-gradient(ellipse_at_55%_40%,var(--color-ink-3),var(--color-ink)_70%)] ${
          vertical ? "inset-x-0 top-[46.98%] h-[31.67%]" : "inset-0"
        }`}
      >
        <span className="label-mono text-[10px] font-bold text-line sm:text-xs">{t.game}</span>
      </div>
      <div className={`absolute flex flex-col items-center justify-center gap-1 bg-bordeaux/60 ${cam}`}>
        <Image src="/madnco-logo.svg" alt="" width={320} height={178} unoptimized className="h-1/3 w-auto opacity-80" />
        <span className="label-mono text-[8px] font-bold text-paper/80 sm:text-[10px]">{t.cam}</span>
      </div>
    </div>
  );
}
