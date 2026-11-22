"use client";

import { useState } from "react";
import { MOOD_COLORS, SHARE_ART_KEYS, type GameProfile, type ShareArt, type ShareArtKey } from "@/lib/stream/games";
import { PLATFORM_LABEL, shareUrl, type ShareChoice } from "@/lib/stream/share";
import { en } from "@/locales/en";
import { Card } from "../Card";
import { CHIP, CHIP_OFF, CHIP_ON, CHIP_SM, LABEL } from "../fields";
import type { Push } from "./shared";

const t = en.admin.share;

const W = 1200;
const H = 630;
/** WhatsApp drops preview images over ~600 KB; stay well under. */
const TARGET_BYTES = 420_000;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });

function fontVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** A cut-corner chip; returns its width. */
function chip(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg: string) {
  const padX = 22;
  const h = 62;
  const w = ctx.measureText(text).width + padX * 2;
  const c = 12;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + c);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  return w;
}

type Fonts = { display: string; mono: string };

/** One 1200×630 card: the screenshot full-bleed, chips, play button, name, logo. */
function drawCard(
  ctx: CanvasRenderingContext2D,
  shot: HTMLImageElement,
  logo: HTMLImageElement | null,
  fonts: Fonts,
  profile: Pick<GameProfile, "name" | "mood">,
  key: ShareArtKey,
) {
  const accent = MOOD_COLORS[profile.mood].a;
  // Cover crop, centred.
  const scale = Math.max(W / shot.naturalWidth, H / shot.naturalHeight);
  const dw = shot.naturalWidth * scale;
  const dh = shot.naturalHeight * scale;
  ctx.drawImage(shot, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // Shade the bottom and left so the text reads on any scene.
  let g = ctx.createLinearGradient(0, H, 0, H * 0.48);
  g.addColorStop(0, "rgba(17,10,12,0.92)");
  g.addColorStop(1, "rgba(17,10,12,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  g = ctx.createLinearGradient(0, 0, W * 0.42, 0);
  g.addColorStop(0, "rgba(17,10,12,0.5)");
  g.addColorStop(1, "rgba(17,10,12,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Chips: ● LIVE + platform, or MADNCO. when offline.
  ctx.font = `800 30px ${fonts.mono}`;
  if (key === "off") {
    chip(ctx, 40, 36, "MADNCO.", "#F4EFE6", "#110A0C");
  } else {
    const w = chip(ctx, 40, 36, "● LIVE", "#FF4D4D", "#110A0C");
    chip(ctx, 40 + w + 12, 36, PLATFORM_LABEL[key].toUpperCase(), "#F4EFE6", "#110A0C");
  }

  // Play button: the image itself says "tap".
  const cx = W / 2;
  const cy = H * 0.44;
  ctx.beginPath();
  ctx.arc(cx, cy, 98, 0, Math.PI * 2);
  ctx.fillStyle = key === "off" ? "rgba(244,239,230,0.35)" : "rgba(255,77,77,0.55)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 84, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(17,10,12,0.6)";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#F4EFE6";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy - 40);
  ctx.lineTo(cx + 44, cy);
  ctx.lineTo(cx - 24, cy + 40);
  ctx.closePath();
  ctx.fillStyle = "#F4EFE6";
  ctx.fill();

  // Game name, shrunk to fit; one line under it.
  const name = profile.name.toUpperCase();
  let size = 76;
  ctx.font = `${size}px ${fonts.display}`;
  while (ctx.measureText(name).width > 860 && size > 36) {
    size -= 4;
    ctx.font = `${size}px ${fonts.display}`;
  }
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#800020";
  ctx.fillText(name, 45, H - 86 + 5);
  ctx.fillStyle = "#F4EFE6";
  ctx.fillText(name, 40, H - 86);
  ctx.font = `800 26px ${fonts.mono}`;
  ctx.fillStyle = accent;
  ctx.fillText(key === "off" ? t.lineOff : t.lineLive.replace("{platform}", PLATFORM_LABEL[key].toUpperCase()), 40, H - 40);

  if (logo) {
    const lw = 170;
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw || 80;
    ctx.drawImage(logo, W - lw - 40, H - lh - 36, lw, lh);
  }
}

const toJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("jpeg"))), "image/jpeg", quality),
  );

/** All four cards as JPEGs, each under the WhatsApp limit. */
export async function makeShareCards(file: File, profile: Pick<GameProfile, "name" | "mood">) {
  const url = URL.createObjectURL(file);
  try {
    const shot = await loadImage(url);
    const logo = await loadImage("/madnco-logo.svg").catch(() => null);
    const fonts = {
      display: fontVar("--font-display", "sans-serif"),
      mono: fontVar("--font-mono", "monospace"),
    };
    await Promise.all([
      document.fonts.load(`76px ${fonts.display}`),
      document.fonts.load(`800 30px ${fonts.mono}`),
    ]).catch(() => undefined);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    const out = {} as Record<ShareArtKey, Blob>;
    for (const key of SHARE_ART_KEYS) {
      ctx.clearRect(0, 0, W, H);
      drawCard(ctx, shot, logo, fonts, profile, key);
      let blob = await toJpeg(canvas, 0.86);
      for (const q of [0.78, 0.7, 0.6, 0.5]) {
        if (blob.size <= TARGET_BYTES) break;
        blob = await toJpeg(canvas, q);
      }
      out[key] = blob;
    }
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Games tab card: turn one gameplay screenshot into the share-link preview
 * images, and copy the share links.
 */
export function ShareArtCard({
  profile,
  set,
  push,
}: {
  profile: GameProfile;
  set: (patch: Partial<GameProfile>) => void;
  push: Push;
}) {
  const [cards, setCards] = useState<Record<ShareArtKey, Blob> | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showPreview = (next: Record<ShareArtKey, Blob> | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next.tiktok) : null);
    setCards(next);
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      showPreview(await makeShareCards(file, profile));
    } catch {
      push("error", t.errorTitle, t.badImage);
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (!cards) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.set("gameId", profile.id);
      for (const key of SHARE_ART_KEYS) body.set(key, cards[key], `${key}.jpg`);
      if (profile.art) body.set("old", JSON.stringify(Object.values(profile.art)));
      const res = await fetch("/api/admin/art", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { art?: ShareArt; error?: string };
      if (!res.ok || !data.art) {
        push("error", t.errorTitle, data.error === "blob-not-configured" ? t.noBlob : t.uploadFailed);
        return;
      }
      set({ art: data.art });
      showPreview(null);
      push("ok", t.uploadedTitle, t.uploaded);
    } catch {
      push("error", t.errorTitle, t.uploadFailed);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (choice: ShareChoice) => {
    const link = shareUrl(choice, Date.now());
    try {
      await navigator.clipboard.writeText(link);
      push("ok", t.copiedTitle, link);
    } catch {
      push("error", t.errorTitle, link);
    }
  };

  const shown = preview ?? profile.art?.tiktok ?? null;

  return (
    <Card title={t.title} hint={t.hint}>
      <p className="m-0 max-w-[60ch] text-base text-muted">{t.intro}</p>

      <div className="flex flex-col gap-3">
        <span className={LABEL}>{t.imageLabel}</span>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- a blob: preview or a Blob URL, not a page image
          <img src={shown} alt={t.previewAlt} width={W} height={H} className="h-auto w-full max-w-[600px] cut-s" />
        ) : (
          <p className="m-0 label-mono text-xs font-extrabold text-muted">{t.none}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <label className={`${CHIP} ${CHIP_OFF} inline-flex cursor-pointer items-center`}>
            {profile.art || cards ? t.replace : t.choose}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {cards ? (
            <button type="button" disabled={busy} onClick={() => void upload()} className={`${CHIP} ${CHIP_ON}`}>
              {busy ? t.working : t.upload}
            </button>
          ) : null}
          {profile.art && !cards ? (
            <button type="button" disabled={busy} onClick={() => set({ art: null })} className={`${CHIP_SM} ${CHIP_OFF}`}>
              {t.remove}
            </button>
          ) : null}
        </div>
        <p className="m-0 label-mono text-[11px] font-extrabold text-muted">{t.tip}</p>
      </div>

      <div className="flex flex-col gap-3 border-l-4 border-ink-3 pl-4">
        <span className={LABEL}>{t.linksLabel}</span>
        <div className="flex flex-wrap gap-2">
          {(["tiktok", "twitch", "youtube", "auto"] as const).map((choice) => (
            <button key={choice} type="button" onClick={() => void copy(choice)} className={`${CHIP} ${CHIP_OFF}`}>
              {choice === "auto" ? t.copyAuto : t.copy.replace("{platform}", PLATFORM_LABEL[choice])}
            </button>
          ))}
        </div>
        <p className="m-0 label-mono text-[11px] font-extrabold text-muted">{t.linksTip}</p>
      </div>
    </Card>
  );
}
