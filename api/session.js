import { isAuthed, json } from "./_lib.js";

export function GET(request) {
  return json({ authed: isAuthed(request) });
}
