// Full school timetable, built from the arrangement data (timetable[day][teacher][period] = ["Class 9 (Science)"]).
// Shared by the admin (Timetable / Arrangements → Full timetable tab) and the public page /pages/timetable.html.
// Three views, each one compact table for the whole week (a cell lists days only where a period changes):
//   Composite — periods down, Classes 1–5 / 6–8 / 9–12 across;  By class / By teacher — one row each, P-1..P-7 across.
// Full subject and teacher names throughout.
// Usage: TimetableView.mount(el, { timetable, teachers, periodTimes })

window.TimetableView = (function () {
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
  const PERIODS = [1, 2, 3, 4, 5, 6, 7];
  const SCHOOL = "Swami Atmanand Govt. English Medium School, Sonhat";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Short subject names in the timetable → full names
  const FULL = {
    "Maths": "Mathematics", "Maths Basic": "Mathematics (Basics)", "Social": "Social Science", "EVS": "Environmental Studies",
    "Accounts": "Accountancy", "Business": "Business Studies", "Commerce/Business": "Commerce / Business Studies",
    "Bio Lab": "Biology Lab", "Chem Lab": "Chemistry Lab", "Physics Lab": "Physics Lab",
    "Hindi/Eng Basic": "Hindi / English (Basics)", "Homework Assign": "Homework Assignment",
    "Khel Yatra/ICT/Art": "Khel Yatra / Computer (ICT) / Art", "Activity/Sub": "Activity", "Revision/Remedial": "Revision / Remedial Class",
  };
  // "Class 11 (Chem Lab)" → { cls: "Class 11", n: 11, subject: "Chemistry Lab" }
  function parse(entry) {
    const m = String(entry).match(/^\s*(Class\s*(\d+))\s*\((.*)\)\s*$/i);
    if (!m) return { cls: "Other", n: 99, subject: entry.trim() };
    const sub = m[3].trim();
    return { cls: `Class ${m[2]}`, n: Number(m[2]), subject: FULL[sub] || sub };
  }

  let root, data, view = "composite", pick = "", who = "", paper = "A4";

  const time = p => (data.periodTimes || {})[p] || "";
  const teachers = () => [...(data.teachers || Object.keys(data.timetable.MON || {}))].sort((a, b) => a.localeCompare(b));
  const slot = (dy, t, p) => ((data.timetable[dy] || {})[t] || {})[p] || [];

  // Class-wise: [{ name: "Class 9", grid: { MON: { 1: [{ top: subject, sub: teacher }] } } }], Class 1 → 12.
  // With `only`, keeps just that teacher's periods (and only the classes they teach).
  function byClass(only = "") {
    const g = {}, order = {};
    teachers().filter(t => !only || t === only).forEach(t => DAYS.forEach(dy => PERIODS.forEach(p => slot(dy, t, p).forEach(e => {
      const i = parse(e); order[i.cls] = i.n;
      const day = ((g[i.cls] = g[i.cls] || {})[dy] = g[i.cls][dy] || {});
      (day[p] = day[p] || []).push({ top: i.subject, sub: t });
    }))));
    return Object.keys(g).sort((a, b) => order[a] - order[b] || a.localeCompare(b)).map(c => ({ name: c, grid: g[c] }));
  }
  // Teacher-wise: same shape, cell shows class and subject
  function byTeacher() {
    return teachers().map(t => {
      const grid = {};
      DAYS.forEach(dy => { grid[dy] = {}; PERIODS.forEach(p => { grid[dy][p] = slot(dy, t, p).map(e => { const i = parse(e); return { top: i.cls, sub: i.subject }; }); }); });
      return { name: t, grid };
    });
  }
  // Composite: three sheets — Classes 1–5, 6–8 and 9–12 (anything that isn't "Class N" goes on the last one)
  const GROUPS = [["Classes 1 – 5", 1, 5], ["Classes 6 – 8", 6, 8], ["Classes 9 – 12", 9, 12]];
  function byGroup() {
    const classes = byClass();
    const num = c => Number((c.name.match(/\d+/) || [99])[0]);
    return GROUPS.map(([name, lo, hi], k) => ({ name, classes: classes.filter(c => (num(c) >= lo && num(c) <= hi) || (k === GROUPS.length - 1 && !/^Class \d+$/.test(c.name))) }));
  }
  const items = () => (view === "composite" ? byGroup() : view === "class" ? byClass(who) : byTeacher());
  const shown = () => {
    const all = items();
    if (view === "composite") return all.filter(x => x.name === (pick || GROUPS[0][0]));
    return pick ? all.filter(x => x.name === pick) : all;
  };

  // "MON,TUE,WED,FRI" → "Mon–Wed, Fri"
  function dayLabel(days) {
    const idx = days.map(d => DAYS.indexOf(d)).sort((x, y) => x - y), runs = [];
    idx.forEach(i => { const r = runs.at(-1); r && r[1] === i - 1 ? (r[1] = i) : runs.push([i, i]); });
    const short = i => DAY_NAMES[DAYS[i]].slice(0, 3);
    return runs.map(([x, y]) => (x === y ? short(x) : y === x + 1 ? `${short(x)}, ${short(y)}` : `${short(x)}–${short(y)}`)).join(", ");
  }

  // One cell for a whole week: shown once when every day is the same; otherwise each version with its days.
  function weekCell(grid, p) {
    const variants = new Map(); // same content → days
    DAYS.forEach(dy => {
      const list = (grid[dy] || {})[p] || [];
      const key = JSON.stringify(list);
      (variants.get(key) || variants.set(key, { list, days: [] }).get(key)).days.push(dy);
    });
    const vs = [...variants.values()];
    const line = list => (list.length ? list.map(i => `<b>${esc(i.top)}</b><span>${esc(i.sub)}</span>`).join("<hr>") : `<i class="free">Free</i>`);
    if (vs.length === 1) return vs[0].list.length ? `<td>${line(vs[0].list)}</td>` : `<td class="free">—</td>`;
    return `<td>${vs.map(v => `<div class="tt-var"><em>${dayLabel(v.days)}</em>${line(v.list)}</div>`).join("")}</td>`;
  }
  const periodHead = p => `P-${p}<small>${esc(time(p))}</small>`;

  // Composite: periods down the left, the group's classes across the top
  function composite(group) {
    const cols = group.classes;
    const rows = PERIODS.map(p => `<tr><th scope="row" class="tt-per">${periodHead(p)}</th>${cols.map(c => weekCell(c.grid, p)).join("")}</tr>`).join("");
    return `<table class="tt-grid tt-composite"><thead><tr><th class="tt-per">Period</th>${cols.map(c => `<th>${esc(c.name)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  // By class / by teacher: one row per class or teacher, P-1..P-7 across the top
  function list(rowsData) {
    const rows = rowsData.map(it => `<tr><th scope="row" class="tt-name">${esc(it.name)}</th>${PERIODS.map(p => weekCell(it.grid, p)).join("")}</tr>`).join("");
    return `<table class="tt-grid tt-composite tt-list"><thead><tr><th class="tt-name">${view === "class" ? "Class" : "Teacher"}</th>${PERIODS.map(p => `<th>${periodHead(p)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  // The sheet(s) for the current choice: [{ title, html }]
  function sheets() {
    const note = "Monday to Saturday in one table · days are shown only where a period changes";
    if (view === "composite") return shown().map(g => ({ title: `${g.name} — Composite weekly timetable`, note, html: composite(g) }));
    const rows = shown();
    const title = view === "class"
      ? `${pick || "All classes"}${who ? ` — ${who}'s periods only` : ""} — Weekly timetable`
      : `${pick || "All teachers"} — Weekly timetable`;
    return rows.length ? [{ title, note, html: list(rows) }] : [{ title, note: "", html: `<p class="tt-none">${esc(who)} has no periods in the timetable.</p>` }];
  }

  function render() {
    const all = items();
    if (pick && !all.some(x => x.name === pick)) pick = "";
    const pickSelect = view === "composite" ? `<div class="tt-seg" role="group" aria-label="Classes">${GROUPS.map(([g]) =>
        `<button type="button" data-tt="group" data-v="${g}" class="${(pick || GROUPS[0][0]) === g ? "on" : ""}">${g}</button>`).join("")}</div>`
      : `<select class="tt-pick" data-tt-pick aria-label="${view === "class" ? "Class" : "Teacher"}">
          <option value="">${view === "class" ? `All classes (${all.length})` : `All teachers (${all.length})`}</option>
          ${all.map(x => `<option${x.name === pick ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>`;
    const whoSelect = view === "class" ? `<select class="tt-pick" data-tt-who aria-label="Teacher">
          <option value="">All teachers</option>${teachers().map(t => `<option${t === who ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>` : "";
    root.innerHTML = `
      <div class="tt-controls">
        <div class="tt-seg" role="group" aria-label="View">
          <button type="button" data-tt="view" data-v="composite" class="${view === "composite" ? "on" : ""}">🗂 Composite</button>
          <button type="button" data-tt="view" data-v="class" class="${view === "class" ? "on" : ""}">🏫 By class</button>
          <button type="button" data-tt="view" data-v="teacher" class="${view === "teacher" ? "on" : ""}">👩‍🏫 By teacher</button>
        </div>
        ${pickSelect}${whoSelect}
        <select class="tt-paper" data-tt-paper aria-label="Paper size">${["A4", "A3"].map(x => `<option value="${x}"${x === paper ? " selected" : ""}>${x} paper</option>`).join("")}</select>
        <button type="button" class="tt-print" data-tt="print">🖨 Print</button>
      </div>
      ${sheets().map(sh => `<section class="tt-day"><h3>${esc(sh.title)} <span>${esc(sh.note)}</span></h3><div class="tt-scroll">${sh.html}</div></section>`).join("")}`;
  }

  // Opens a clean printable page — one sheet, school name on top, A4 or A3 landscape, shrunk to fit one page if needed.
  function print() {
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow pop-ups to print the timetable.");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Timetable — ${esc(SCHOOL)}</title><style>
      @page { size: ${paper} landscape; margin: 8mm; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; }
      section { page-break-after: always; } section:last-child { page-break-after: auto; }
      h1 { font-size: 13px; margin: 0 0 2px; text-align: center; } h2 { font-size: 11px; margin: 0 0 4px; text-align: center; font-weight: normal; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; line-height: 1.25; }
      th, td { border: 1px solid #555; padding: 4px 5px; vertical-align: top; text-align: left; word-wrap: break-word; }
      thead th { background: #e6e6e6; text-align: center; } th small { display: block; font-weight: normal; font-size: 9px; }
      tbody th { background: #f4f4f4; vertical-align: middle; } th.tt-per { width: 8%; white-space: nowrap; } th.tt-name { width: 13%; }
      td b::after { content: " – "; font-weight: normal; } td span { color: #333; }
      td.free { color: #999; text-align: center; vertical-align: middle; } i.free { color: #999; } hr { border: 0; border-top: 1px dashed #999; margin: 2px 0; }
      .tt-var + .tt-var { border-top: 1.5px solid #333; margin-top: 3px; padding-top: 3px; } .tt-var em { font-style: normal; font-weight: bold; text-decoration: underline; margin-right: 4px; }
    </style></head><body>
      ${sheets().map(sh => `<section><h1>${esc(SCHOOL)}</h1><h2>${esc(sh.title)}</h2>${sh.html}</section>`).join("")}
      <script>
        // Shrink any sheet larger than the printable area so it stays on one page, keeping the full page width.
        window.onload = () => {
          const mm = 96 / 25.4, [W, H] = ${paper === "A3" ? "[420, 297]" : "[297, 210]"};
          const pageW = (W - 16) * mm, pageH = ((H - 16) * mm - 6) * 0.92;
          document.querySelectorAll("section").forEach(s => {
            // Largest zoom z where the sheet, laid out (pageW / z) wide, is no taller than pageH / z
            const fits = z => { s.style.width = pageW / z + "px"; return s.scrollHeight * z <= pageH; };
            let lo = 0.1, hi = 1;
            if (fits(1)) lo = 1; else for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; fits(m) ? (lo = m) : (hi = m); }
            s.style.width = pageW / lo + "px";
            s.style.zoom = lo;
          });
          window.print();
        };
      <\/script></body></html>`);
    w.document.close();
  }

  function onClick(e) {
    const b = e.target.closest("[data-tt]");
    if (!b) return;
    if (b.dataset.tt === "view") { view = b.dataset.v; pick = ""; who = ""; }
    if (b.dataset.tt === "group") pick = b.dataset.v;
    if (b.dataset.tt === "print") return print();
    render();
  }

  function mount(el, d) {
    root = el; data = d;
    render();
    if (!el.dataset.ttBound) {
      el.dataset.ttBound = "1";
      el.addEventListener("click", onClick);
      el.addEventListener("change", e => {
        if (e.target.matches("[data-tt-pick]")) { pick = e.target.value; render(); }
        if (e.target.matches("[data-tt-who]")) { who = e.target.value; pick = ""; render(); }
        if (e.target.matches("[data-tt-paper]")) paper = e.target.value;
      });
    }
  }

  return { mount, parse };
})();
