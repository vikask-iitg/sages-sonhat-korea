import { put } from "@vercel/blob";
import { isAuthed, json, readDoc, STAGE_PREFIX } from "./_lib.js";

const MAX_BYTES = 1024 * 1024;

export async function GET() {
  const text = await readDoc("content.json");
  if (text === null) return json({ error: "No saved content yet" }, 404);
  return new Response(text, {
    headers: { "content-type": "application/json", "cache-control": "public, s-maxage=5" },
  });
}

export async function PUT(request) {
  if (!isAuthed(request)) return json({ error: "Not logged in" }, 401);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "Content too large" }, 413);
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!data || typeof data !== "object" || Array.isArray(data) || !data.site) {
    return json({ error: "Content is missing required sections" }, 400);
  }
  const body = JSON.stringify(data);
  const opts = { access: "public", contentType: "application/json", cacheControlMaxAge: 60 };
  await put(`${STAGE_PREFIX}content.json`, body, { ...opts, addRandomSuffix: false, allowOverwrite: true });
  // Keep a dated copy of every save so a bad edit can be rolled back.
  await put(`${STAGE_PREFIX}backups/content-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, body, opts);
  return json({ ok: true });
}
