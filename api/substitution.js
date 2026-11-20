import { put, list, del } from "@vercel/blob";
import { isAuthed, json, readDoc, STAGE_PREFIX } from "./_lib.js";

// Daily teacher arrangement (substitution) data, kept apart from the site content.
// Shape: { timetable, teachers, periodTimes (Mon–Fri), periodTimesSat (optional), history, savedDays, published: { "YYYY-MM-DD": { day, absent, present, plan, publishedAt } } }
//
// Every save writes a NEW file (substitution/v-<time>.json) instead of overwriting one. Blob's CDN can serve an
// overwritten file stale for up to a minute, but a new file name is always fresh, and the listing API is not
// cached. So the newest file in the listing is always the latest data, and its name is the version (`rev`)
// that lets a save from an out-of-date tab be refused instead of wiping newer changes.
const DIR = "substitution/";
const LEGACY = "substitution.json";
const KEEP = 5; // versions kept; older ones are deleted (backups/ keeps a copy of every save)
const MAX_BYTES = 2 * 1024 * 1024;

async function versions(prefix) {
  const { blobs } = await list({ prefix: prefix + DIR + "v-", limit: 1000 });
  return blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
}

// Latest version: this environment's own, else (outside production) the live site's, else the old single file.
async function latest() {
  for (const prefix of STAGE_PREFIX ? [STAGE_PREFIX, ""] : [""]) {
    const [newest] = await versions(prefix);
    if (newest) return { rev: newest.pathname, read: async () => (await fetch(newest.url, { cache: "no-store" })).text() };
  }
  return { rev: "", read: () => readDoc(LEGACY) };
}

export async function GET(request) {
  const doc = await latest();
  const text = await doc.read();
  const data = text ? JSON.parse(text) : {};
  data.rev = doc.rev;
  // Teachers (not logged in) only see what the admin has published, plus the timetable for the full timetable view.
  const authed = isAuthed(request);
  const body = authed ? data : { published: data.published || {}, timetable: data.timetable, teachers: data.teachers, periodTimes: data.periodTimes, periodTimesSat: data.periodTimesSat,
    periodBreaks: data.periodBreaks, periodBreaksSat: data.periodBreaksSat, timetableNote: data.timetableNote };
  return json(body, 200, { "cache-control": authed ? "no-store" : "public, s-maxage=5" });
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
  if ((await latest()).rev !== (data.rev || "")) return json({ error: "Changed elsewhere" }, 409);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const rev = `${STAGE_PREFIX}${DIR}v-${stamp}.json`;
  delete data.rev;
  const body = JSON.stringify(data);
  const opts = { access: "public", contentType: "application/json", addRandomSuffix: false };
  await put(rev, body, opts);
  await put(`${STAGE_PREFIX}backups/substitution-${stamp}.json`, body, opts);
  const old = (await versions(STAGE_PREFIX)).slice(KEEP).map(b => b.url);
  if (old.length) await del(old).catch(() => {});
  return json({ ok: true, rev });
}
