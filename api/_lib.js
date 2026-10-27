// Shared helpers for the admin API. Files starting with "_" are not routes.
import crypto from "node:crypto";

const COOKIE = "sages_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function hmac(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SECRET).update(value).digest("hex");
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkPassword(password) {
  return Boolean(process.env.ADMIN_PASSWORD) && safeEqual(password || "", process.env.ADMIN_PASSWORD);
}

export function sessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const token = `${exp}.${hmac(String(exp))}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAuthed(request) {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!match || !process.env.ADMIN_SECRET) return false;
  const [exp, sig] = match[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, hmac(exp));
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
