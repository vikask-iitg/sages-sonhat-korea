// Admin panel: edits the same content document the public pages render from.
// Forms are generated from SECTIONS, so adding a field here is enough to make it editable.

const SECTIONS = [
  { group: "General" },
  { key: "site", label: "School Details", fields: [
    ["address", "Full address"], ["email", "Email"], ["phone", "Phone"],
    ["hoursWeekday", "Timings – weekdays"], ["hoursSaturday", "Timings – Saturday"], ["footerAbout", "Footer 'About the School' text", "textarea"],
  ] },
  { key: "ticker", label: "Scrolling Top Notices", list: true, title: "text", fields: [["text", "Notice text"]] },
  { key: "cta", label: "Admission Banner", fields: [["text", "Banner text"], ["buttonText", "Button text"], ["buttonLink", "Button link"]] },

  { group: "Home Page" },
  { key: "home", label: "Home Page Headings", hint: "Small label = the coloured text above each heading. Empty sections hide automatically.", fields: [
    ["noticeKicker", "Notice Board – small label"], ["noticeTitle", "Notice Board – heading"],
    ["noticesHeading", "Notices box title"], ["newsHeading", "News box title"], ["eventsHeading", "Events box title"],
    ["principalKicker", "Principal – small label"], ["principalTitle", "Principal – heading"],
    ["levelsKicker", "Education cards – small label"], ["levelsTitle", "Education cards – heading"],
    ["facultyKicker", "Faculty – small label"], ["facultyTitle", "Faculty – heading"], ["facultyCount", "How many people to show on home page (incl. principal)", "number"],
    ["starsKicker", "Star Performers – small label"], ["starsTitle", "Star Performers – heading"],
    ["galleryKicker", "Gallery – small label"], ["galleryTitle", "Gallery – heading"], ["galleryCount", "How many photos to show on home page", "number"],
    ["partnersKicker", "Partners – small label"], ["partnersTitle", "Partners – heading"],
  ] },
  { key: "slides", label: "Banner Slider", list: true, title: "title", fields: [
    ["image", "Background photo", "image"], ["title", "Heading"], ["text", "Sub-text", "textarea"], ["buttonText", "Button text"], ["buttonLink", "Button link"],
  ] },
  { key: "features", label: "Feature Boxes", list: true, title: "title", fields: [["icon", "Icon (emoji)"], ["title", "Title"], ["text", "Text", "textarea"]] },
  { key: "intro", label: "Introduction", fields: [["title", "Heading"], ["text", "Text (blank line = new paragraph)", "textarea"], ["image", "Photo", "image"]] },
  { key: "stats", label: "Numbers (Students, Staff…)", list: true, title: "label", fields: [["value", "Number", "number"], ["suffix", "After number (e.g. +)"], ["label", "Label"]] },
  { key: "levels", label: "Education System Cards", list: true, title: "title", fields: [["image", "Photo", "image"], ["title", "Title"], ["text", "Text", "textarea"]] },
  { key: "partners", label: "Partners", list: true, title: "name", fields: [["icon", "Icon (emoji)"], ["name", "Name"], ["link", "Website link", "url"]] },

  { group: "Notices & Events" },
  { key: "notices", label: "Important Notices", list: true, title: "text", hint: "Shown newest first automatically.", fields: [["date", "Date", "date"], ["text", "Notice", "textarea"]] },
  { key: "news", label: "Latest News", list: true, title: "text", hint: "Shown newest first automatically.", fields: [["date", "Date", "date"], ["text", "News", "textarea"]] },
  { key: "events", label: "Upcoming Events", list: true, title: "text", hint: "Shown in date order. Delete events once they are over.", fields: [["date", "Date", "date"], ["text", "Event", "textarea"]] },

  { group: "People" },
  { key: "principal", label: "Principal & Message", fields: [
    ["photo", "Principal's photo", "image"], ["name", "Name"], ["qualification", "Qualification"], ["experience", "Experience"],
    ["quote", "Quote"], ["message", "Message (blank line = new paragraph)", "textarea"],
  ] },
  { key: "faculty", label: "Faculty / Teachers", list: true, title: "name", fields: [["photo", "Photo", "image"], ["name", "Name"], ["designation", "Designation / Subject"]] },
  { key: "stars", label: "Star Performers", list: true, title: "name", fields: [["photo", "Photo", "image"], ["name", "Name"], ["className", "Class"], ["score", "Score / Award"]] },
  { key: "smc", label: "Management Committee", list: true, title: "name", fields: [["name", "Name"], ["designation", "Designation"]] },
  { key: "staff", label: "Administrative Staff", list: true, title: "name", fields: [["name", "Name"], ["designation", "Designation"]] },
  { key: "pta", label: "Parent Teacher Association", fields: [["text", "Text", "textarea"]] },

  { group: "Gallery" },
  { key: "gallery", label: "Photo Gallery", list: true, title: "caption", bulk: "image", hint: "The first 4 photos also appear on the home page.", fields: [["image", "Photo", "image"], ["caption", "Caption"]] },

  { group: "Pages" },
  { key: "homeHub", label: "Home", hub: [
    ["home", "Headings & counts"], ["slides", "Banner slider"], ["features", "Feature boxes"], ["intro", "Introduction"],
    ["notices", "Important notices"], ["news", "Latest news"], ["events", "Upcoming events"], ["principal", "Principal's message"],
    ["stats", "Numbers (students, staff…)"], ["levels", "Education system cards"], ["faculty", "Faculty"], ["stars", "Star performers"],
    ["gallery", "Photo gallery"], ["partners", "Partners"], ["cta", "Admission banner"], ["ticker", "Scrolling top notices"],
  ] },
  { key: "about", label: "About Us", fields: [
    ["text", "About the school (blank line = new paragraph)", "textarea"], ["image", "Photo", "image"], ["vision", "Vision", "textarea"],
    ["mission", "Mission (one point per line)", "textarea"], ["atmanand", "About Swami Atmanand", "textarea"],
  ] },
  { key: "admission", label: "Admission Details", fields: [["note", "Important note", "textarea"], ["eligibility", "Eligibility (one point per line)", "textarea"], ["documents", "Documents required (one per line)", "textarea"]] },
  { key: "admissionSteps", label: "Admission Steps", list: true, title: "title", fields: [["title", "Step title"], ["text", "Description", "textarea"]] },
  { key: "curriculum", label: "Classes & Curriculum", list: true, title: "level", fields: [["level", "Level"], ["classes", "Classes"], ["subjects", "Subjects", "textarea"]] },
  { key: "results", label: "Board Results", list: true, title: "year", fields: [["year", "Year"], ["className", "Class"], ["appeared", "Appeared"], ["passed", "Passed"], ["percent", "Pass %"]] },
  { key: "achievements", label: "Student Achievements", list: true, title: "title", fields: [["icon", "Icon (emoji)"], ["title", "Title"], ["text", "Description", "textarea"]] },
  { key: "calendar", label: "School Calendar", list: true, title: "month", fields: [["month", "Month"], ["event", "Events"]] },
  { key: "classrooms", label: "Smart Classrooms", fields: [["text", "Text", "textarea"], ["image", "Photo", "image"]] },
  { key: "labs", label: "Laboratories", list: true, title: "title", fields: [["image", "Photo", "image"], ["title", "Lab name"], ["text", "Description", "textarea"]] },
  { key: "library", label: "Library", fields: [["text", "Text", "textarea"], ["image", "Photo", "image"]] },
  { key: "campus", label: "Campus Facilities", list: true, title: "title", fields: [["icon", "Icon (emoji)"], ["title", "Title"], ["text", "Description", "textarea"]] },
  { key: "activities", label: "Co-curricular Activities", list: true, title: "title", fields: [["image", "Photo", "image"], ["title", "Title"], ["text", "Description", "textarea"], ["anchor", "Menu link id (sports, cultural, technical, scout)"]] },
  { key: "disclosure", label: "Public Disclosure PDFs", list: true, title: "title", fields: [["title", "Document name"], ["file", "PDF file", "file"]] },
];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sectionOf = key => SECTIONS.find(s => s.key === key);

let content = null;
let current = "site";
let dirty = false;

const get = path => path.split(".").reduce((o, k) => o?.[k], content);
function set(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const obj = keys.reduce((o, k) => (o[k] ??= {}), content);
  obj[last] = value;
}

function markDirty(on = true) {
  dirty = on;
  $("#save").disabled = !on;
  $("#save-state").textContent = on ? "Unsaved changes" : "All changes saved";
  $("#save-state").className = on ? "state warn" : "state ok";
}

function toast(msg, isError = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.className = "toast"), 3500);
}

// ---------- rendering ----------
function renderNav() {
  $("#sections").innerHTML = SECTIONS.map(s => s.group
    ? `<div class="group">${esc(s.group)}</div>`
    : `<button data-action="section" data-key="${s.key}" class="${s.key === current ? "active" : ""}">${esc(s.label)}</button>`).join("");
}

function fieldHtml([name, label, type = "text"], path) {
  const value = get(path) ?? "";
  if (type === "textarea") {
    return `<label class="field"><span>${esc(label)}</span><textarea data-path="${path}" rows="${String(value).length > 200 ? 8 : 3}">${esc(value)}</textarea></label>`;
  }
  if (type === "image" || type === "file") {
    const isImg = type === "image";
    const preview = isImg
      ? (value ? `<img src="${esc(value)}" alt="">` : `<div class="noimg">No photo</div>`)
      : (value ? `<a href="${esc(value)}" target="_blank" rel="noopener">📄 Open PDF</a>` : `<div class="noimg">No file</div>`);
    return `<div class="field media"><span>${esc(label)}</span>
      <div class="media-row">
        <div class="preview">${preview}</div>
        <div class="media-actions">
          <label class="btn-sm primary">${isImg ? "Upload photo" : "Upload PDF"}
            <input type="file" hidden accept="${isImg ? "image/*" : "application/pdf"}" data-upload="${path}"></label>
          ${value ? `<button class="btn-sm danger" data-action="clear" data-path="${path}">Remove</button>` : ""}
          <input type="url" data-path="${path}" value="${esc(value)}" placeholder="…or paste a link">
        </div>
      </div></div>`;
  }
  const inputType = { number: "number", date: "date", url: "url" }[type] || "text";
  return `<label class="field"><span>${esc(label)}</span><input type="${inputType}" data-path="${path}" value="${esc(value)}"></label>`;
}

function itemTitle(sec, item, i) {
  const raw = String(item?.[sec.title] || "").trim();
  return raw ? (raw.length > 70 ? raw.slice(0, 70) + "…" : raw) : `Item ${i + 1}`;
}

function renderEditor() {
  const sec = sectionOf(current);
  let body;
  if (sec.hub) {
    // A hub only links to other sections, in the order they appear on the page.
    body = `<p class="hint">Everything shown on the home page, top to bottom. Click a part to edit it.</p>
      <div class="hub">${sec.hub.map(([key, label], i) =>
        `<button data-action="section" data-key="${key}"><span>${i + 1}</span>${esc(label)}</button>`).join("")}</div>`;
  } else if (sec.list) {
    if (!Array.isArray(content[sec.key])) content[sec.key] = [];
    const items = content[sec.key];
    body = `
      <div class="list-tools">
        <button class="btn-sm primary" data-action="add">+ Add new</button>
        ${sec.bulk ? `<label class="btn-sm">⬆ Upload many photos<input type="file" hidden multiple accept="image/*" data-bulk="1"></label>` : ""}
        <span class="count">${items.length} item${items.length === 1 ? "" : "s"}</span>
      </div>
      ${items.map((item, i) => `
        <div class="item" data-index="${i}">
          <div class="item-head">
            <strong class="item-title">${esc(itemTitle(sec, item, i))}</strong>
            <div>
              <button class="icon" title="Move up" data-action="up" data-index="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
              <button class="icon" title="Move down" data-action="down" data-index="${i}" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
              <button class="icon danger" title="Delete" data-action="delete" data-index="${i}">🗑</button>
            </div>
          </div>
          <div class="item-body">${sec.fields.map(f => fieldHtml(f, `${sec.key}.${i}.${f[0]}`)).join("")}</div>
        </div>`).join("") || `<p class="empty">Nothing here yet. Click “+ Add new”.</p>`}`;
  } else {
    if (!content[sec.key]) content[sec.key] = {};
    body = `<div class="item"><div class="item-body">${sec.fields.map(f => fieldHtml(f, `${sec.key}.${f[0]}`)).join("")}</div></div>`;
  }
  $("#editor").innerHTML = `<h2>${esc(sec.label)}</h2>${sec.hint ? `<p class="hint">${esc(sec.hint)}</p>` : ""}${body}`;
}

// ---------- uploads ----------
// Photos are shrunk in the browser so uploads stay fast and under the 4 MB API limit.
async function shrinkImage(file) {
  if (file.type === "image/gif" || (file.type === "image/png" && file.size < 1.5e6)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(res, "image/jpeg", 0.85));
}

async function upload(file) {
  const isPdf = file.type === "application/pdf";
  const body = isPdf ? file : await shrinkImage(file);
  if (body.size > 4 * 1024 * 1024) throw new Error("File is larger than 4 MB");
  const base = file.name.replace(/\.[^.]+$/, "");
  const ext = isPdf ? "pdf" : body.type === "image/png" ? "png" : body.type === "image/gif" ? "gif" : "jpg";
  const res = await fetch(`/api/upload?name=${encodeURIComponent(`${base}.${ext}`)}`, {
    method: "POST", headers: { "content-type": body.type }, body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { showLogin(); throw new Error("Session expired — please log in again"); }
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

// ---------- events ----------
document.addEventListener("input", e => {
  const path = e.target.dataset.path;
  if (!path || !content) return;
  const sec = sectionOf(current);
  set(path, e.target.value);
  markDirty();
  if (sec.list && path.endsWith(`.${sec.title}`)) {
    const i = +path.split(".")[1];
    e.target.closest(".item").querySelector(".item-title").textContent = itemTitle(sec, content[sec.key][i], i);
  }
});

// Re-render image previews when a pasted link is finished.
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.dataset.path && t.type === "url") renderEditor();

  if (t.dataset.upload) {
    const file = t.files[0];
    if (!file) return;
    const label = t.closest("label");
    label.classList.add("busy");
    try {
      set(t.dataset.upload, await upload(file));
      markDirty();
      renderEditor();
      toast("Uploaded. Click “Save changes” to publish.");
    } catch (err) { toast(err.message, true); label.classList.remove("busy"); }
  }

  if (t.dataset.bulk) {
    const sec = sectionOf(current);
    const files = [...t.files];
    let done = 0;
    for (const file of files) {
      toast(`Uploading ${done + 1} of ${files.length}…`);
      try {
        const url = await upload(file);
        content[sec.key].unshift({ [sec.bulk]: url, caption: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") });
        done++;
      } catch (err) { toast(`${file.name}: ${err.message}`, true); }
    }
    if (done) { markDirty(); renderEditor(); toast(`${done} photo(s) added. Click “Save changes” to publish.`); }
  }
});

document.addEventListener("click", async e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const sec = sectionOf(current);
  const items = sec && content?.[sec.key];
  const i = +btn.dataset.index;

  if (action === "section") { current = btn.dataset.key; renderNav(); renderEditor(); window.scrollTo(0, 0); return; }
  if (action === "add") {
    const blank = Object.fromEntries(sec.fields.map(([n, , type]) => [n, type === "date" ? new Date().toISOString().slice(0, 10) : ""]));
    items.unshift(blank);
  }
  if (action === "up" && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
  if (action === "down" && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
  if (action === "delete") {
    if (!confirm(`Delete “${itemTitle(sec, items[i], i)}”?`)) return;
    items.splice(i, 1);
  }
  if (action === "clear") set(btn.dataset.path, "");
  if (["add", "up", "down", "delete", "clear"].includes(action)) { markDirty(); renderEditor(); }

  if (action === "save") save();
  if (action === "logout") {
    if (dirty && !confirm("You have unsaved changes. Log out anyway?")) return;
    await fetch("/api/logout", { method: "POST" });
    dirty = false;
    showLogin();
  }
});

async function save() {
  const btn = $("#save");
  btn.disabled = true;
  btn.textContent = "Saving…";
  try {
    const res = await fetch("/api/content", {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(content),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { toast("Session expired — log in again. Your edits are kept on this page.", true); showLogin(true); return; }
    if (!res.ok) throw new Error(data.error || "Save failed");
    markDirty(false);
    toast("Saved! The website is updated.");
  } catch (err) {
    toast(err.message, true);
    btn.disabled = false;
  } finally {
    btn.textContent = "💾 Save changes";
  }
}

window.addEventListener("beforeunload", e => { if (dirty) e.preventDefault(); });
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); if (dirty) save(); }
});

// ---------- login ----------
function showLogin(keepContent = false) {
  if (!keepContent) content = null;
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#password").focus();
}

async function loadContent() {
  const defaults = await (await fetch("data/content.json", { cache: "no-store" })).json();
  // Unique query skips the short edge cache, so the editor always starts from the latest save.
  const res = await fetch(`/api/content?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return defaults;
  const saved = await res.json();
  // Sections added to the site after the last save start from their defaults.
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in saved)) saved[key] = value;
    else if (value && typeof value === "object" && !Array.isArray(value)) saved[key] = { ...value, ...saved[key] };
  }
  return saved;
}

async function showApp() {
  if (!content) content = await loadContent();
  $("#login").hidden = true;
  $("#app").hidden = false;
  renderNav();
  renderEditor();
  markDirty(dirty);
}

$("#login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  $("#login-error").textContent = "";
  const res = await fetch("/api/login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: $("#password").value }),
  }).catch(() => null);
  btn.disabled = false;
  if (!res?.ok) { $("#login-error").textContent = res?.status === 401 ? "Wrong password." : "Could not reach the server."; return; }
  $("#password").value = "";
  showApp();
});

(async () => {
  const res = await fetch("/api/session").catch(() => null);
  const data = res?.ok ? await res.json() : {};
  data.authed ? showApp() : showLogin();
})();
