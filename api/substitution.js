import { put } from "@vercel/blob";
import { isAuthed, json, readDoc, STAGE_PREFIX } from "./_lib.js";

// Daily teacher arrangement (substitution) data, kept apart from the site content.
// Shape: { timetable, history, savedDays, published: { "YYYY-MM-DD": { day, absent, present, plan, publishedAt } } }
const DOC = "substitution.json";
const MAX_BYTES = 2 * 1024 * 1024;

export async function GET(request) {
  const text = await readDoc(DOC);
  const data = text ? JSON.parse(text) : {};
  // Teachers (not logged in) only see what the admin has published.
  const body = isAuthed(request) ? data : { published: data.published || {} };
  return json(body, 200, { "cache-control": isAuthed(request) ? "no-store" : "public, s-maxage=5" });
}

export async function PUT(request) {
  if (!isAuthed(request)) return json({ error: "Not logged in" }, 401);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "Data too large" }, 413);
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!data || typeof data !== "object" || Array.isArray(data) || !data.timetable) {
    return json({ error: "Timetable is missing" }, 400);
  }
  const body = JSON.stringify(data);
  const opts = { access: "public", contentType: "application/json", cacheControlMaxAge: 60 };
  await put(`${STAGE_PREFIX}${DOC}`, body, { ...opts, addRandomSuffix: false, allowOverwrite: true });
  await put(`${STAGE_PREFIX}backups/substitution-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, body, opts);
  return json({ ok: true });
}
