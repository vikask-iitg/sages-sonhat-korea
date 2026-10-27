import { put } from "@vercel/blob";
import { isAuthed, json } from "./_lib.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const MAX_PDF_BYTES = 4 * 1024 * 1024; // Vercel function request limit is 4.5 MB
const MAX_IMAGE_BYTES = 500 * 1024; // keeps the site fast; the admin panel compresses photos below this

export async function POST(request) {
  if (!isAuthed(request)) return json({ error: "Not logged in" }, 401);
  const type = (request.headers.get("content-type") || "").split(";")[0];
  if (!ALLOWED.includes(type)) return json({ error: "Only images and PDF files are allowed" }, 415);
  const buf = Buffer.from(await request.arrayBuffer());
  if (!buf.length) return json({ error: "Empty file" }, 400);
  const isPdf = type === "application/pdf";
  if (buf.length > (isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES)) {
    return json({ error: isPdf ? "PDF is larger than 4 MB" : "Photo is larger than 500 KB" }, 413);
  }
  const raw = new URL(request.url).searchParams.get("name") || "file";
  const name = raw.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  const blob = await put(`uploads/${name}`, buf, { access: "public", contentType: type, addRandomSuffix: true });
  return json({ url: blob.url });
}
