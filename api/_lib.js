// Shared helpers for the admin API. Files starting with "_" are not routes.
import crypto from "node:crypto";

const COOKIE = "sages_admin";
const SESSION_SECONDS = 60 * 60; // admins are logged out automatically after 1 hour

function hmac(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SECRET).update(value).digest("hex");
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Both values live only in Vercel env vars (ADMIN_EMAIL, ADMIN_PASSWORD); email matching ignores case and spaces.
export function checkCredentials(email, password) {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;
  const emailOk = safeEqual(String(email || "").trim().toLowerCase(), ADMIN_EMAIL.trim().toLowerCase());
  const passwordOk = safeEqual(password || "", ADMIN_PASSWORD);
  return emailOk && passwordOk;
}

export function newSession() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${exp}.${hmac(String(exp))}`;
  return { exp, cookie: `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}` };
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

// Returns the session expiry (unix seconds) when logged in, otherwise false.
export function isAuthed(request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match || !process.env.ADMIN_SECRET) return false;
  const [exp, sig] = match[1].split(".");
  const now = Date.now() / 1000;
  // Also reject sessions issued for longer than an hour (e.g. under an older, longer limit).
  if (!exp || !sig || Number(exp) < now || Number(exp) > now + SESSION_SECONDS + 60) return false;
  return safeEqual(sig, hmac(exp)) ? Number(exp) : false;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

// Token format: vercel_blob_rw_<storeId>_<secret>; public files live under the store's own host.
export function blobBase() {
  const storeId = (process.env.BLOB_READ_WRITE_TOKEN || "").split("_")[3] || "";
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}
