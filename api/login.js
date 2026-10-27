import { checkPassword, sessionCookie, json } from "./_lib.js";

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  if (!checkPassword(password)) {
    // Slow down password guessing.
    await new Promise(r => setTimeout(r, 1000));
    return json({ error: "Wrong password" }, 401);
  }
  return json({ ok: true }, 200, { "set-cookie": sessionCookie() });
}
