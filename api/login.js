import { checkCredentials, newSession, json } from "./_lib.js";

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!checkCredentials(email, password)) {
    // Slow down password guessing.
    await new Promise(r => setTimeout(r, 1000));
    return json({ error: "Wrong email or password" }, 401);
  }
  const { exp, cookie } = newSession();
  return json({ ok: true, exp }, 200, { "set-cookie": cookie });
}
