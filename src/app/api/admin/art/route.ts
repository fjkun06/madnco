import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/admin";
import { isBlobUrl, SHARE_ART_KEYS, type ShareArt } from "@/lib/stream/games";

/** WhatsApp drops preview images over ~600 KB; the browser aims for ~300 KB. */
const SHARE_ART_MAX_BYTES = 600_000;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

const isJpeg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

/**
 * POST /api/admin/art (multipart) — store the four share images of one game.
 *   gameId   the game's id
 *   tiktok, twitch, youtube, off   JPEG files, 1200×630, made in the browser
 *   old      optional JSON list of the game's previous image URLs (deleted)
 * Answers { art } — the Games tab puts it on the profile; Save & push keeps it.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) return json({ error: "unauthorized" }, 401);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ error: "blob-not-configured" }, 503);
  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "bad-request" }, 400);
  const gameId = form.get("gameId");
  if (typeof gameId !== "string" || !/^[a-z0-9-]{1,56}$/.test(gameId)) {
    return json({ error: "bad-request" }, 400);
  }

  const files: { key: (typeof SHARE_ART_KEYS)[number]; file: File }[] = [];
  for (const key of SHARE_ART_KEYS) {
    const file = form.get(key);
    if (!(file instanceof File) || file.size === 0 || file.size > SHARE_ART_MAX_BYTES) {
      return json({ error: "bad-image" }, 400);
    }
    if (!isJpeg(new Uint8Array(await file.slice(0, 3).arrayBuffer()))) {
      return json({ error: "bad-image" }, 400);
    }
    files.push({ key, file });
  }

  try {
    const stamp = Date.now().toString(36);
    const uploaded = await Promise.all(
      files.map(({ key, file }) =>
        put(`share/${gameId}/${stamp}-${key}.jpg`, file, {
          access: "public",
          contentType: "image/jpeg",
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        }),
      ),
    );
    const art = Object.fromEntries(uploaded.map((blob, i) => [files[i].key, blob.url])) as ShareArt;

    // Best effort: the replaced images are no longer needed.
    await deleteOld(form.get("old"));
    return json({ art });
  } catch {
    return json({ error: "upload-failed" }, 502);
  }
}

async function deleteOld(old: FormDataEntryValue | null) {
  if (typeof old !== "string") return;
  try {
    const list: unknown = JSON.parse(old);
    const urls = Array.isArray(list) ? list.filter(isBlobUrl) : [];
    if (urls.length) await del(urls);
  } catch {
    // Old images stay in the Blob store; harmless.
  }
}
