// Full school timetable, built from the arrangement data (timetable[day][teacher][period] = ["Class 9 (Science)"]).
// Shared by the admin (Arrangement → Full timetable tab) and the public page /pages/timetable.html.
// One weekly table per class or per teacher: Monday–Saturday down the left, P-1 to P-7 across the top.
// Class tables show subject + teacher in each cell; teacher tables show class + subject. Full names throughout.
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

  let root, data, view = "composite", pick = "", paper = "A4";

  const time = p => (data.periodTimes || {})[p] || "";
  const teachers = () => [...(data.teachers || Object.keys(data.timetable.MON || {}))].sort((a, b) => a.localeCompare(b));
  const slot = (dy, t, p) => ((data.timetable[dy] || {})[t] || {})[p] || [];

  // Class-wise: { "Class 9": { MON: { 1: [{subject, teacher}] } } }, ordered Class 1 → 12
  function byClass() {
    const g = {}, order = {};
    teachers().forEach(t => DAYS.forEach(dy => PERIODS.forEach(p => slot(dy, t, p).forEach(e => {
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
  // Composite: every class on one sheet
  const byGroup = () => { const classes = byClass(); return classes.length ? [{ name: "All classes", classes }] : []; };
  const items = () => (view === "composite" ? byGroup() : view === "class" ? byClass() : byTeacher());
  const shown = () => { const all = items(); return pick ? all.filter(x => x.name === pick) : all; };

  // Composite: days (each split into P-1..P-7) down the left, classes across the top
  function composite(group) {
    const cols = group.classes;
    const rows = DAYS.map(dy => PERIODS.map((p, k) => `<tr class="${k === 0 ? "daystart" : ""}">${k === 0 ? `<th scope="rowgroup" rowspan="${PERIODS.length}" class="tt-dayname"><span>${DAY_NAMES[dy]}</span></th>` : ""}
      <th scope="row" class="tt-per">P-${p}<small>${esc(time(p))}</small></th>${cols.map(c => {
        const items = (c.grid[dy] || {})[p] || [];
        return items.length ? `<td>${items.map(i => `<b>${esc(i.top)}</b><span>${esc(i.sub)}</span>`).join("<hr>")}</td>` : `<td class="free">—</td>`;
      }).join("")}</tr>`).join("")).join("");
    return { html: `<table class="tt-grid tt-composite"><thead><tr><th class="tt-dayname">Day</th><th class="tt-per">Period</th>${cols.map(c => `<th>${esc(c.name)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`,
      summary: `${cols.length} classes · Monday to Saturday` };
  }

  // Days down the left, periods 1–7 across the top
  function table(item) {
    if (view === "composite") return composite(item);
    let count = 0;
    const rows = DAYS.map(dy => `<tr><th scope="row">${DAY_NAMES[dy]}</th>${PERIODS.map(p => {
      const c = (item.grid[dy] || {})[p] || []; if (c.length) count++;
      return c.length ? `<td>${c.map(i => `<b>${esc(i.top)}</b><span>${esc(i.sub)}</span>`).join("<hr>")}</td>` : `<td class="free">${view === "teacher" ? "Free" : "—"}</td>`;
    }).join("")}</tr>`).join("");
    return { html: `<table class="tt-grid"><thead><tr><th>Day</th>${PERIODS.map(p => `<th>P-${p}<small>${esc(time(p))}</small></th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`,
      summary: `${count} periods a week` };
  }
  const heading = item => (view === "composite" ? `${item.name} — Composite weekly timetable` : `${item.name} — Weekly timetable`);
  const allLabel = n => (view === "class" ? `All classes (${n})` : `All teachers (${n})`);

  function render() {
    const all = items();
    if (pick && !all.some(x => x.name === pick)) pick = "";
    root.innerHTML = `
      <div class="tt-controls">
        <div class="tt-seg" role="group" aria-label="View">
          <button type="button" data-tt="view" data-v="composite" class="${view === "composite" ? "on" : ""}">🗂 Composite</button>
          <button type="button" data-tt="view" data-v="class" class="${view === "class" ? "on" : ""}">🏫 By class</button>
          <button type="button" data-tt="view" data-v="teacher" class="${view === "teacher" ? "on" : ""}">👩‍🏫 By teacher</button>
        </div>
        ${view === "composite" ? "" : `<select class="tt-pick" data-tt-pick aria-label="Show">
          <option value="">${allLabel(all.length)}</option>
          ${all.map(x => `<option${x.name === pick ? " selected" : ""}>${esc(x.name)}</option>`).join("")}
        </select>`}
        <select class="tt-paper" data-tt-paper aria-label="Paper size">${["A4", "A3"].map(x => `<option value="${x}"${x === paper ? " selected" : ""}>${x} paper</option>`).join("")}</select>
        <button type="button" class="tt-print" data-tt="print">🖨 Print ${view === "composite" ? "on one sheet" : pick ? esc(pick) : view === "class" ? "all classes" : "all teachers"}</button>
      </div>
      ${shown().map(item => { const t = table(item);
        return `<section class="tt-day"><h3>${esc(heading(item))} <span>${esc(t.summary)}</span></h3><div class="tt-scroll">${t.html}</div></section>`; }).join("")}`;
  }

  // Opens a clean printable page, one sheet per class / teacher / class group, school name on top.
  // Landscape, A4 or A3; each sheet is shrunk to fit its page if needed (the composite fits all classes on one).
  function print() {
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow pop-ups to print the timetable.");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Timetable — ${esc(SCHOOL)}</title><style>
      @page { size: ${paper} landscape; margin: 8mm; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; }
      section { page-break-after: always; } section:last-child { page-break-after: auto; }
      h1 { font-size: 15px; margin: 0 0 2px; text-align: center; } h2 { font-size: 13px; margin: 0 0 6px; text-align: center; font-weight: normal; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
      ${view === "composite" ? `table { font-size: 10px; line-height: 1.15; } table.tt-composite td, table.tt-composite th { padding: 1px 2px; } table.tt-composite th.tt-dayname { width: 2.6%; text-align: center; font-size: 11px; }
        .tt-dayname span { writing-mode: vertical-rl; transform: rotate(180deg); display: inline-block; }
        table.tt-composite th.tt-per { width: 4.6%; white-space: nowrap; } tr.daystart > * { border-top: 2px solid #000; } tbody th small, thead th small { display: block; font-weight: normal; font-size: 8px; }
        .tt-composite td b, .tt-composite td span { display: inline; } .tt-composite td b::after { content: " – "; font-weight: normal; } h1 { font-size: 13px; } h2 { font-size: 11px; margin-bottom: 3px; }`
        : `tbody td { height: 22mm; }`}
      th, td { border: 1px solid #555; padding: 3px 4px; vertical-align: top; text-align: left; word-wrap: break-word; }
      thead th { background: #e6e6e6; text-align: center; } thead th small { display: block; font-weight: normal; }
      tbody th { background: #f4f4f4; vertical-align: middle; } thead th:first-child { width: 11%; } td b, td span { display: block; } td span { color: #333; }
      td.free { color: #999; text-align: center; vertical-align: middle; } hr { border: 0; border-top: 1px dashed #999; margin: 2px 0; }
    </style></head><body>
      ${shown().map(item => `<section><h1>${esc(SCHOOL)}</h1><h2>${esc(heading(item))}</h2>${table(item).html}</section>`).join("")}
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
            const z = lo; s.style.width = pageW / z + "px";
            s.style.zoom = z;
          });
          window.print();
        };
      <\/script></body></html>`);
    w.document.close();
  }

  function onClick(e) {
    const b = e.target.closest("[data-tt]");
    if (!b) return;
    if (b.dataset.tt === "view") { view = b.dataset.v; pick = ""; }
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
        if (e.target.matches("[data-tt-paper]")) paper = e.target.value;
      });
    }
  }

  return { mount, parse };
})();
