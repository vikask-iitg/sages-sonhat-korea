import { isAuthed, json } from "./_lib.js";

export function GET(request) {
  const exp = isAuthed(request);
  return json({ authed: Boolean(exp), exp: exp || null });
}
