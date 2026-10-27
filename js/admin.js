// Admin panel: edits the same content document the public pages render from.
// Forms are generated from SECTIONS, so adding a field here is enough to make it editable.
// NAV arranges those sections in the sidebar to mirror the website; a section may appear in more than one place.

const SECTIONS = [
  { key: "site", label: "School Details", fields: [
    ["address", "Full address"], ["email", "Email"], ["phone", "Phone"],
    ["hoursWeekday", "Timings – weekdays"], ["hoursSaturday", "Timings – Saturday"],
    ["instagram", "Instagram page link (leave empty to hide icon)", "url"], ["facebook", "Facebook page link (leave empty to hide icon)", "url"], ["whatsapp", "WhatsApp number (leave empty to hide icon)"], ["footerAbout", "Footer 'About the School' text", "textarea"],
  ] },

  { key: "home", label: "Home Page Headings", hint: "Small label = the coloured text above each heading. Empty sections hide automatically.", fields: [
    ["noticeKicker", "Notice Board – small label"], ["noticeTitle", "Notice Board – heading"],
    ["noticesHeading", "Notices box title"], ["newsHeading", "News box title"], ["eventsHeading", "Events box title"],
    ["principalKicker", "Principal – small label"], ["principalTitle", "Principal – heading"],
    ["levelsKicker", "Education cards – small label"], ["levelsTitle", "Education cards – heading"],
    ["facultyKicker", "Faculty – small label"], ["facultyTitle", "Faculty – heading"],
    ["starsKicker", "Star Performers – small label"], ["starsTitle", "Star Performers – heading"],
    ["galleryKicker", "Gallery – small label"], ["galleryTitle", "Gallery – heading"], ["galleryCount", "How many photos to show on home page", "number"],
    ["partnersKicker", "Partners – small label"], ["partnersTitle", "Partners – heading"],
  ] },
  { key: "ticker", label: "Scrolling Top Notices (top bar)", list: true, title: "text", fields: [["text", "Notice text"]] },
  { key: "slides", label: "Banner Slider", list: true, title: "title", fields: [
    ["image", "Background photo", "image", 16 / 9], ["title", "Heading"], ["text", "Sub-text", "textarea"], ["buttonText", "Button text"], ["buttonLink", "Button link"],
  ] },
  { key: "features", label: "Feature Boxes", list: true, title: "title", fields: [["icon", "Icon (emoji)"], ["title", "Title"], ["text", "Text", "textarea"]] },
  { key: "intro", label: "Introduction", fields: [["title", "Heading"], ["text", "Text (blank line = new paragraph)", "textarea"], ["image", "Photo", "image", 4 / 3]] },
  { key: "notices", label: "Important Notices", list: true, title: "text", hint: "Shown newest first automatically.", fields: [["date", "Date", "date"], ["text", "Notice", "textarea"]] },
  { key: "news", label: "Latest News", list: true, title: "text", hint: "Shown newest first automatically.", fields: [["date", "Date", "date"], ["text", "News", "textarea"]] },
  { key: "events", label: "Upcoming Events", list: true, title: "text", hint: "Shown in date order. Delete events once they are over.", fields: [["date", "Date", "date"], ["text", "Event", "textarea"]] },
  { key: "principal", label: "Principal & Message", fields: [
    ["photo", "Principal's photo", "image", 4 / 5], ["name", "Name"], ["qualification", "Qualification"], ["experience", "Experience"],
    ["quote", "Quote"], ["message", "Message (blank line = new paragraph)", "textarea"],
  ] },
  { key: "stats", label: "Numbers (Students, Staff…)", list: true, title: "label", hint: "Choose “Automatic” to count the principal, faculty and administrative staff for you.", fields: [
    ["auto", "How is the number set?", "select", [["", "I type the number"], ["staff", "Automatic: principal + faculty + administrative staff"]]],
    ["value", "Number (ignored when automatic)", "number"], ["suffix", "After number (e.g. +, ignored when automatic)"], ["label", "Label"],
  ] },
  { key: "levels", label: "Education System Cards", list: true, title: "title", fields: [["image", "Photo", "image", 3 / 2], ["title", "Title"], ["text", "Text", "textarea"]] },
  { key: "faculty", label: "Faculty / Teachers", list: true, title: "name", fields: [["photo", "Photo", "image", 1], ["name", "Name"], ["designation", "Designation / Subject"]] },
  { key: "stars", label: "Star Performers", list: true, title: "name", fields: [["photo", "Photo", "image", 1], ["name", "Name"], ["className", "Class"], ["score", "Score / Award"]] },
  { key: "gallery", label: "Photo Gallery", list: true, title: "caption", bulk: "image", hint: "The first 4 photos also appear on the home page.", fields: [["image", "Photo", "image", 4 / 3], ["caption", "Caption"]] },
  { key: "partners", label: "Partners", list: true, title: "name", fields: [["icon", "Icon (emoji)"], ["name", "Name"], ["link", "Website link", "url"]] },
  { key: "cta", label: "Admission Banner (bottom)", fields: [["text", "Banner text"], ["buttonText", "Button text"], ["buttonLink", "Button link"]] },

  { key: "smc", label: "Management Committee", list: true, title: "name", fields: [["name", "Name"], ["designation", "Designation"]] },
  { key: "staff", label: "Administrative Staff", list: true, title: "name", fields: [["photo", "Photo", "image", 1], ["name", "Name"], ["designation", "Designation"]] },
  { key: "pta", label: "Parent Teacher Association", fields: [["text", "Text", "textarea"]] },

  { key: "about", label: "About Us", fields: [
    ["text", "About the school (blank line = new paragraph)", "textarea"], ["image", "Photo", "image", 4 / 3], ["vision", "Vision", "textarea"],
    ["mission", "Mission (one point per line)", "textarea"], ["atmanand", "About Swami Atmanand", "textarea"],
  ] },
  { key: "admission", label: "Admission Details", fields: [["note", "Important note", "textarea"], ["eligibility", "Eligibility (one point per line)", "textarea"], ["documents", "Documents required (one per line)", "textarea"]] },
  { key: "admissionForm", store: "admission", label: "Admission Form (PDF)", hint: "Shown as the “Download Admission Form” button on the Admission page. Remove the file to hide the button.", fields: [["formPdf", "Admission form PDF (max 4 MB)", "pdf"]] },
  { key: "admissionSteps", label: "Admission Steps", list: true, title: "title", fields: [["title", "Step title"], ["text", "Description", "textarea"]] },
  { key: "curriculum", label: "Classes & Curriculum", list: true, title: "level", fields: [["level", "Level"], ["classes", "Classes"], ["subjects", "Subjects", "textarea"]] },
  { key: "results", label: "Board Results", list: true, title: "year", fields: [["year", "Year"], ["className", "Class"], ["appeared", "Appeared"], ["passed", "Passed"], ["percent", "Pass %"]] },
  { key: "achievements", label: "Student Achievements", list: true, title: "title", fields: [["icon", "Icon (emoji)"], ["title", "Title"], ["text", "Description", "textarea"]] },
  { key: "calendar", label: "School Calendar", list: true, title: "month", fields: [["month", "Month"], ["event", "Events"]] },
  { key: "classrooms", label: "Smart Classrooms", fields: [["text", "Text", "textarea"], ["image", "Photo", "image", 4 / 3]] },
  { key: "labs", label: "Laboratories", list: true, title: "title", fields: [["image", "Photo", "image", 3 / 2], ["title", "Lab name"], ["text", "Description", "textarea"]] },
  { key: "library", label: "Library", fields: [["text", "Text", "textarea"], ["image", "Photo", "image", 4 / 3]] },
  { key: "campus", label: "Campus Facilities", list: true, title: "title", fields: [["icon", "Icon (emoji)"], ["title", "Title"], ["text", "Description", "textarea"]] },
  { key: "activities", label: "Co-curricular Activities", list: true, title: "title", fields: [["image", "Photo", "image", 4 / 3], ["title", "Title"], ["text", "Description", "textarea"], ["anchor", "Menu link id (sports, cultural, technical, scout)"]] },
];

// Leaf: "key", or [key, label], or [key, label, anchor] to edit the one list item with that anchor.
// Menu: { menu: label, items: [...leaves] } renders as a dropdown.
const NAV = [
  { group: "General", items: ["site"] },
  { group: "Pages", items: [
    { menu: "Home Page", items: [
      "home", "ticker", "slides", "features", "intro", "notices", "news", "events", "principal",
      "stats", "levels", "faculty", "stars", "gallery", "partners", "cta",
    ] },
    ["about", "About Us"],
    { menu: "Administration", items: [["principal", "Principal's Profile"], ["smc", "School Management Committee"], ["faculty", "Faculty"], ["staff", "Administrative Staff"], ["pta", "Parent Teacher Association"]] },
    { menu: "Admission", items: [["admissionSteps", "Admission Process"], ["admission", "Eligibility & Documents"], ["admissionForm", "Admission Form (PDF)"]] },
    { menu: "Academic", items: [["curriculum", "Classes & Curriculum"], ["results", "Results"], ["achievements", "Student Achievements"], ["calendar", "School Calendar"]] },
    { menu: "Infrastructure", items: [["classrooms", "Smart Classrooms"], ["labs", "Laboratories"], ["library", "Library"], ["campus", "School Campus"]] },
    { menu: "Activities", items: [["activities", "Sports Events", "sports"], ["activities", "Cultural Events", "cultural"], ["activities", "Technical Events", "technical"], ["activities", "Scout Guide / NSS", "scout"]] },
    { menu: "News & Events", items: [["notices", "Notices"], ["news", "News"], ["events", "Upcoming Events"]] },
    ["gallery", "Gallery"],
    ["site", "Contact Us"],
  ] },
];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sectionOf = key => SECTIONS.find(s => s.key === key);

// Every sidebar entry gets a unique id so the same section can be listed twice and still highlight correctly.
const LEAVES = {};
function leaf(raw, id, menu) {
  const [key, label, anchor] = typeof raw === "string" ? [raw] : raw;
  LEAVES[id] = { id, key, label: label || sectionOf(key).label, anchor, menu };
  return LEAVES[id];
}
NAV.forEach((g, gi) => g.items.forEach((it, ii) => {
  if (it.menu) it.items.forEach((sub, si) => leaf(sub, `${gi}.${ii}.${si}`, it.menu));
  else leaf(it, `${gi}.${ii}`);
}));

let content = null;
let current = "0.0";
let dirty = false;
// Each page opens locked so nothing changes by accident; saving or switching pages locks it again.
let locked = true;
const openMenus = new Set();
const currentSection = () => sectionOf(LEAVES[current].key);

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
// Icon and accent colour for each top-level sidebar entry; submenu items take their parent's colour.
const NAV_STYLE = {
  "School Details": ["🏫", "#0b3d91"], "Home Page": ["🏠", "#e65100"], "About Us": ["ℹ️", "#26a69a"],
  "Administration": ["👥", "#6a1b9a"], "Admission": ["📝", "#c62828"], "Academic": ["🎓", "#1565c0"],
  "Infrastructure": ["🏛️", "#6d4c41"], "Activities": ["⚽", "#2e7d32"], "News & Events": ["📰", "#ad1457"],
  "Gallery": ["🖼️", "#ef6c00"], "Contact Us": ["📞", "#00838f"],
};

function renderNav() {
  const style = label => NAV_STYLE[label] || ["•", "#0b3d91"];
  const icon = label => `<span class="nav-icon">${style(label)[0]}</span>`;
  const link = l => `<button data-action="section" data-id="${l.id}" class="nav-item${l.id === current ? " active" : ""}" style="--c:${style(l.label)[1]}">${icon(l.label)}<span class="nav-label">${esc(l.label)}</span></button>`;
  const sub = l => `<button data-action="section" data-id="${l.id}" class="sub${l.id === current ? " active" : ""}">${esc(l.label)}</button>`;
  $("#sections").innerHTML = NAV.map((g, gi) => `<div class="group">${esc(g.group)}</div>` + g.items.map((it, ii) => {
    if (!it.menu) return link(LEAVES[`${gi}.${ii}`]);
    const open = openMenus.has(it.menu);
    const inside = LEAVES[current].menu === it.menu;
    return `<div class="nav-menu" style="--c:${style(it.menu)[1]}">
      <button class="nav-item menu-toggle${open ? " open" : ""}${inside ? " has-active" : ""}" data-action="toggle" data-menu="${esc(it.menu)}">${icon(it.menu)}<span class="nav-label">${esc(it.menu)}</span><span class="caret">▾</span></button>
      <div class="submenu"${open ? "" : " hidden"}>${it.items.map((_, si) => sub(LEAVES[`${gi}.${ii}.${si}`])).join("")}</div>
    </div>`;
  }).join("")).join("");
}

function fieldHtml([name, label, type = "text", option], path) {
  const value = get(path) ?? "";
  if (type === "textarea") {
    return `<label class="field"><span>${esc(label)}</span><textarea data-path="${path}" rows="${String(value).length > 200 ? 8 : 3}">${esc(value)}</textarea></label>`;
  }
  if (type === "pdf") {
    const preview = value ? `<a href="${esc(value)}" target="_blank" rel="noopener">📄 Open PDF</a>` : `<div class="noimg">No file</div>`;
    return `<div class="field media"><span>${esc(label)}</span>
      <div class="media-row">
        <div class="preview">${preview}</div>
        <div class="media-actions">
          <label class="btn-sm primary">Upload PDF
            <input type="file" hidden accept="application/pdf" data-upload="${path}"></label>
          ${value ? `<button class="btn-sm danger" data-action="clear" data-path="${path}">Remove</button>` : ""}
        </div>
      </div></div>`;
  }
  if (type === "image") {
    // option = the aspect ratio the website shows this photo at; uploads are cropped to it.
    const ratio = option || 0;
    const preview = value ? `<img src="${esc(value)}" alt="">` : `<div class="noimg">No photo</div>`;
    return `<div class="field media"><span>${esc(label)}${ratio ? ` <em class="shape">${ratioName(ratio)}</em>` : ""}</span>
      <div class="media-row">
        <div class="preview" style="${ratio ? `aspect-ratio:${ratio}` : ""}">${preview}</div>
        <div class="media-actions">
          <label class="btn-sm primary">Upload photo
            <input type="file" hidden accept="image/*" data-upload="${path}" data-ratio="${ratio}"></label>
          ${value && ratio ? `<button class="btn-sm" data-action="recrop" data-path="${path}" data-ratio="${ratio}">✂ Adjust crop</button>` : ""}
          ${value ? `<button class="btn-sm danger" data-action="clear" data-path="${path}">Remove</button>` : ""}
          <input type="url" data-path="${path}" value="${esc(value)}" placeholder="…or paste a link">
        </div>
      </div></div>`;
  }
  if (type === "select") {
    const options = option.map(([v, l]) => `<option value="${esc(v)}"${String(value) === v ? " selected" : ""}>${esc(l)}</option>`).join("");
    return `<label class="field"><span>${esc(label)}</span><select data-path="${path}">${options}</select></label>`;
  }
  const inputType = { number: "number", date: "date", url: "url" }[type] || "text";
  return `<label class="field"><span>${esc(label)}</span><input type="${inputType}" data-path="${path}" value="${esc(value)}"></label>`;
}

function itemTitle(sec, item, i) {
  const raw = String(item?.[sec.title] || "").trim();
  return raw ? (raw.length > 70 ? raw.slice(0, 70) + "…" : raw) : `Item ${i + 1}`;
}

function renderEditor() {
  const sec = currentSection();
  const { label, anchor } = LEAVES[current];
  let body;
  if (anchor) {
    // Edit just the one list item behind this menu link (e.g. Activities › Sports Events).
    if (!Array.isArray(content[sec.key])) content[sec.key] = [];
    let i = content[sec.key].findIndex(it => it.anchor === anchor);
    if (i < 0) i = content[sec.key].push({ anchor }) - 1;
    const fields = sec.fields.filter(f => f[0] !== "anchor");
    body = `<div class="item"><div class="item-body">${fields.map(f => fieldHtml(f, `${sec.key}.${i}.${f[0]}`)).join("")}</div></div>`;
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
    const dataKey = sec.store || sec.key; // "store" lets a section edit part of another content object
    if (!content[dataKey]) content[dataKey] = {};
    body = `<div class="item"><div class="item-body">${sec.fields.map(f => fieldHtml(f, `${dataKey}.${f[0]}`)).join("")}</div></div>`;
  }
  const lockBtn = locked
    ? `<button class="lock-btn locked" data-action="lock" title="Unlock this page to make changes">🔒 Locked <span>Unlock to edit</span></button>`
    : `<button class="lock-btn" data-action="lock" title="Lock this page again">🔓 Editing <span>Lock</span></button>`;
  // A disabled fieldset disables every input and button inside it in one go.
  $("#editor").innerHTML = `<div class="editor-head"><h2>${esc(label)}</h2>${lockBtn}</div>
    ${sec.hint && !anchor ? `<p class="hint">${esc(sec.hint)}</p>` : ""}
    ${locked ? `<p class="lock-note">This page is locked to prevent accidental changes. Click <strong>Unlock to edit</strong> to make changes; it locks again when you save.</p>` : ""}
    <fieldset class="edit-area"${locked ? " disabled" : ""}>${body}</fieldset>`;
}

// ---------- cropping ----------
const ratioName = r => ({ 1: "square", [16 / 9]: "wide 16:9", [4 / 3]: "4:3", [3 / 2]: "3:2", [4 / 5]: "portrait 4:5" })[r] || "";

// Opens the crop window locked to the website's shape. Resolves to a JPEG blob, or null if cancelled.
function openCropper(src, ratio) {
  return new Promise((resolve, reject) => {
    const modal = $("#crop-modal"), img = $("#crop-img");
    let cropper;
    const close = result => {
      cropper?.destroy();
      modal.hidden = true;
      $("#crop-ok").onclick = $("#crop-cancel").onclick = null;
      resolve(result);
    };
    $("#crop-shape").textContent = ratioName(ratio);
    img.crossOrigin = "anonymous"; // lets existing online photos be re-cropped
    img.onerror = () => { modal.hidden = true; reject(new Error("Could not load this photo for cropping")); };
    img.onload = () => {
      cropper = new Cropper(img, { aspectRatio: ratio, viewMode: 1, autoCropArea: 1, dragMode: "move", background: false });
    };
    img.src = src;
    modal.hidden = false;
    $("#crop-cancel").onclick = () => close(null);
    $("#crop-ok").onclick = () => {
      const canvas = cropper.getCroppedCanvas({ maxWidth: 1600, maxHeight: 1600, fillColor: "#fff", imageSmoothingQuality: "high" });
      canvas.toBlob(blob => close(blob), "image/jpeg", 0.88);
    };
  });
}

// Bulk uploads skip the crop window: each photo is centre-cropped to the shape automatically.
async function autoCrop(file, ratio) {
  const bitmap = await createImageBitmap(file);
  let w = bitmap.width, h = bitmap.height;
  if (w / h > ratio) w = Math.round(h * ratio); else h = Math.round(w / ratio);
  const scale = Math.min(1, 1600 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(bitmap, (bitmap.width - w) / 2, (bitmap.height - h) / 2, w, h, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(res, "image/jpeg", 0.88));
}

const asJpegFile = (blob, name) => new File([blob], name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });

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
  const sec = currentSection();
  set(path, e.target.value);
  markDirty();
  if (sec.list && !LEAVES[current].anchor && path.endsWith(`.${sec.title}`)) {
    const i = +path.split(".")[1];
    e.target.closest(".item").querySelector(".item-title").textContent = itemTitle(sec, content[sec.key][i], i);
  }
});

// Re-render image previews when a pasted link is finished.
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.dataset.path && t.type === "url") renderEditor();

  if (t.dataset.upload) {
    let file = t.files[0];
    t.value = ""; // allow choosing the same file again
    if (!file) return;
    const ratio = Number(t.dataset.ratio);
    const label = t.closest("label");
    try {
      if (ratio && file.type.startsWith("image/") && file.type !== "image/gif") {
        const url = URL.createObjectURL(file);
        const blob = await openCropper(url, ratio);
        URL.revokeObjectURL(url);
        if (!blob) return;
        file = asJpegFile(blob, file.name);
      }
      label.classList.add("busy");
      set(t.dataset.upload, await upload(file));
      markDirty();
      renderEditor();
      toast("Uploaded. Click “Save changes” to publish.");
    } catch (err) { toast(err.message, true); label.classList.remove("busy"); }
  }

  if (t.dataset.bulk) {
    const sec = currentSection();
    const files = [...t.files];
    let done = 0;
    for (const file of files) {
      toast(`Uploading ${done + 1} of ${files.length}…`);
      try {
        const ratio = sec.fields.find(f => f[0] === sec.bulk)?.[3];
        const url = await upload(ratio ? asJpegFile(await autoCrop(file, ratio), file.name) : file);
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
  const sec = currentSection();
  const items = sec && content?.[sec.key];
  const i = +btn.dataset.index;

  if (action === "lock") { locked = !locked; renderEditor(); return; }
  if (action === "section") {
    current = btn.dataset.id;
    locked = true;
    // Open the dropdown holding the chosen page; after that the admin can close it freely.
    if (LEAVES[current].menu) openMenus.add(LEAVES[current].menu);
    renderNav(); renderEditor(); window.scrollTo(0, 0); return;
  }
  if (action === "toggle") {
    const m = btn.dataset.menu;
    openMenus.has(m) ? openMenus.delete(m) : openMenus.add(m);
    renderNav();
    return;
  }
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
  if (action === "recrop") {
    try {
      const blob = await openCropper(get(btn.dataset.path), Number(btn.dataset.ratio));
      if (!blob) return;
      btn.classList.add("busy");
      set(btn.dataset.path, await upload(asJpegFile(blob, "photo.jpg")));
      markDirty();
      renderEditor();
      toast("Crop saved. Click “Save changes” to publish.");
    } catch (err) { toast(err.message, true); }
    return;
  }
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
    locked = true;
    renderEditor();
    toast("Saved! The website is updated. Page locked again.");
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
  const defaults = await (await fetch("/data/content.json", { cache: "no-store" })).json();
  // Unique query skips the short edge cache, so the editor always starts from the latest save.
  const res = await fetch(`/api/content?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return defaults;
  const saved = await res.json();
  // Sections added to the site after the last save start from their defaults;
  // sections the site no longer has are dropped on the next save.
  for (const key of Object.keys(saved)) if (!(key in defaults)) delete saved[key];
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
