// Full school timetable, built from the arrangement data (timetable[day][teacher][period] = ["Class 9 (Science)"]).
// Shared by the admin (Timetable / Arrangements → Full timetable tab) and the public page /pages/timetable.html.
// Two dropdowns: Class (all, a composite group 1–5 / 6–8 / 9–12, or one class) and Teacher (all, or one teacher's periods only).
// Every view is one compact table for the whole week — periods down, classes across (a cell lists days only where a
// period changes) — and prints on one sheet.
// Full subject and teacher names throughout.
// Usage: TimetableView.mount(el, { timetable, teachers, periodTimes, periodTimesSat? })

window.TimetableView = (function () {
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
  const WEEKDAYS = DAYS.slice(0, 5);
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

  let root, data, cls = "", who = ""; // cls: "" (all), a group like "Classes 1 – 5", or "Class 9"

  // Period timings decide each day's periods: Mon–Fri use periodTimes, Saturday periodTimesSat when it has its own.
  const timesOf = dy => (dy === "SAT" && data.periodTimesSat) || data.periodTimes || {};
  const breaksOf = dy => (dy === "SAT" && data.periodTimesSat ? data.periodBreaksSat : data.periodBreaks) || {};
  const periodsOf = dy => Object.keys(timesOf(dy)).map(Number).sort((a, b) => a - b);
  const teachers = () => [...(data.teachers || Object.keys(data.timetable.MON || {}))].sort((a, b) => a.localeCompare(b));
  const slot = (dy, t, p) => ((data.timetable[dy] || {})[t] || {})[p] || [];

  // Class-wise: [{ name: "Class 9", grid: { MON: { 1: [{ top: subject, sub: teacher }] } } }], Class 1 → 12.
  // With `only`, keeps just that teacher's periods (and only the classes they teach).
  function byClass(only = "") {
    const g = {}, order = {};
    teachers().filter(t => !only || t === only).forEach(t => DAYS.forEach(dy => periodsOf(dy).forEach(p => slot(dy, t, p).forEach(e => {
      const i = parse(e); order[i.cls] = i.n;
      const day = ((g[i.cls] = g[i.cls] || {})[dy] = g[i.cls][dy] || {});
      (day[p] = day[p] || []).push({ top: i.subject, sub: t });
    }))));
    return Object.keys(g).sort((a, b) => order[a] - order[b] || a.localeCompare(b)).map(c => ({ name: c, grid: g[c] }));
  }
  // Class groups for the composite sheets (anything that isn't "Class N" goes with the last group)
  const GROUPS = [["Classes 1 – 5", 1, 5], ["Classes 6 – 8", 6, 8], ["Classes 9 – 12", 9, 12]];
  const inGroup = (name, k) => { const [, lo, hi] = GROUPS[k], n = Number((name.match(/^Class (\d+)$/) || [])[1]);
    return n ? n >= lo && n <= hi : k === GROUPS.length - 1; };

  // "MON,TUE,WED,FRI" → "Mon–Wed, Fri"
  function dayLabel(days) {
    const idx = days.map(d => DAYS.indexOf(d)).sort((x, y) => x - y), runs = [];
    idx.forEach(i => { const r = runs.at(-1); r && r[1] === i - 1 ? (r[1] = i) : runs.push([i, i]); });
    const short = i => DAY_NAMES[DAYS[i]].slice(0, 3);
    return runs.map(([x, y]) => (x === y ? short(x) : y === x + 1 ? `${short(x)}, ${short(y)}` : `${short(x)}–${short(y)}`)).join(", ");
  }

  // One cell for a whole week: shown once when every day is the same; otherwise each version with its days.
  function weekCell(grid, p, days) {
    const variants = new Map(); // same content → days
    days.forEach(dy => {
      const list = (grid[dy] || {})[p] || [];
      const key = JSON.stringify(list);
      (variants.get(key) || variants.set(key, { list, days: [] }).get(key)).days.push(dy);
    });
    const vs = [...variants.values()];
    const line = list => (list.length ? list.map(i => `<b>${esc(i.top)}</b><span>${esc(i.sub)}</span>`).join("<hr>") : `<i class="free">Free</i>`);
    if (vs.length === 1) return vs[0].list.length ? `<td>${line(vs[0].list)}</td>` : `<td class="free">—</td>`;
    return `<td>${vs.map(v => `<div class="tt-var"><em>${dayLabel(v.days)}</em>${line(v.list)}</div>`).join("")}</td>`;
  }
  // Line at the top of every timetable, e.g. "W.E.F. 16-06-2026 - Prayer Time: 10:00 AM - 10:15 AM"
  const note = () => (typeof data.timetableNote === "string" ? data.timetableNote : (typeof TIMETABLE_NOTE !== "undefined" ? TIMETABLE_NOTE : "")).trim();
  const periodHead = (p, dy) => `P-${p}<small>${esc(timesOf(dy)[p] || "")}</small>`;

  // Periods down the first column, the chosen classes across the top row, for the given days
  function composite(cols, days) {
    const brk = breaksOf(days[0]);
    const rows = periodsOf(days[0]).map(p => `<tr><th scope="row" class="tt-per">${periodHead(p, days[0])}</th>${cols.map(c => weekCell(c.grid, p, days)).join("")}</tr>${brk[p]
      ? `<tr class="tt-break"><th scope="row" class="tt-per">${esc(brk[p].label)}<small>${esc(brk[p].time)}</small></th><td colspan="${cols.length}">${esc(brk[p].label)} · ${esc(brk[p].time)}</td></tr>` : ""}`).join("");
    // Each class column at least 125px so full names stay whole; more columns than fit scroll sideways (Period column frozen)
    return `<div class="tt-scroll"><table class="tt-grid tt-composite" style="min-width: ${92 + cols.length * 125}px"><thead><tr><th class="tt-per">Period</th>${cols.map(c => `<th>${esc(c.name)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  // Saturday gets its own table when it doesn't fit the Monday–Friday one: different periods or timings,
  // or a timetable that differs from Friday's in more than a quarter of its periods.
  function saturdaySeparate(cols) {
    const week = data.periodTimes || {}, sat = data.periodTimesSat;
    if (sat && JSON.stringify(Object.entries(sat).sort()) !== JSON.stringify(Object.entries(week).sort())) return true;
    if (sat && JSON.stringify(breaksOf("SAT")) !== JSON.stringify(breaksOf("MON"))) return true;
    let cells = 0, differ = 0;
    cols.forEach(c => periodsOf("MON").forEach(p => {
      const f = JSON.stringify((c.grid.FRI || {})[p] || []), s2 = JSON.stringify((c.grid.SAT || {})[p] || []);
      if (f !== "[]" || s2 !== "[]") { cells++; if (f !== s2) differ++; }
    }));
    return cells > 0 && differ / cells > 0.25;
  }

  // The sheet for the current Class + Teacher choice: { title, note, html }
  function sheet() {
    const rows = byClass(who), g = GROUPS.findIndex(([name]) => name === cls);
    const title = `${cls || "All classes"}${who ? ` — ${who}'s periods` : ""} — Weekly timetable`;
    const shown = g >= 0 ? rows.filter(r => inGroup(r.name, g)) : cls ? rows.filter(r => r.name === cls) : rows;
    if (!shown.length) return { title, note: "", html: `<p class="tt-none">${who ? `${esc(who)} has no periods in ${esc(cls || "any class")}.` : "Nothing in the timetable yet."}</p>` };
    if (!saturdaySeparate(shown)) return { title, note: "Monday to Saturday in one table · days are shown only where a period changes", html: composite(shown, DAYS) };
    const satCols = shown.filter(c => periodsOf("SAT").some(p => ((c.grid.SAT || {})[p] || []).length));
    return { title, note: "Monday to Friday, with Saturday in its own table",
      html: `<h4 class="tt-sub">Monday – Friday</h4>${composite(shown, WEEKDAYS)}
        <h4 class="tt-sub">Saturday</h4>${satCols.length ? composite(satCols, ["SAT"]) : `<p class="tt-none">No classes on Saturday.</p>`}` };
  }

  function render() {
    const classes = byClass().map(c => c.name);
    if (cls && !GROUPS.some(([n]) => n === cls) && !classes.includes(cls)) cls = "";
    const sh = sheet();
    root.innerHTML = `
      <div class="tt-controls">
        <label class="tt-field"><span>Class</span><select class="tt-pick" data-tt-cls>
          <option value="">All classes</option>
          <optgroup label="Composite (one sheet each)">${GROUPS.map(([n]) => `<option${n === cls ? " selected" : ""}>${n}</option>`).join("")}</optgroup>
          <optgroup label="Single class">${classes.map(c => `<option${c === cls ? " selected" : ""}>${esc(c)}</option>`).join("")}</optgroup>
        </select></label>
        <label class="tt-field"><span>Teacher</span><select class="tt-pick" data-tt-who>
          <option value="">All teachers</option>${teachers().map(t => `<option${t === who ? " selected" : ""}>${esc(t)}</option>`).join("")}
        </select></label>
        <button type="button" class="tt-print" data-tt="print">🖨 ${who ? "Print your timetable" : "Print"}</button>
      </div>
      <section class="tt-day">${note() ? `<p class="tt-headnote">${esc(note())}</p>` : ""}<h3>${esc(sh.title)} <span>${esc(sh.note)}</span></h3>${sh.html}</section>`;
  }

  // Opens a clean printable page — one sheet, school name on top, A4 landscape, shrunk to fit one page if needed.
  function print() {
    const w = window.open("", "_blank");
    if (!w) return alert("Please allow pop-ups to print the timetable.");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Timetable — ${esc(SCHOOL)}</title><style>
      @page { size: A4 landscape; margin: 8mm; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #000; }
      section { page-break-after: always; } section:last-child { page-break-after: auto; }
      h1 { font-size: 13px; margin: 0 0 2px; text-align: center; } h2 { font-size: 11px; margin: 0 0 4px; text-align: center; font-weight: normal; }
      tr.tt-break td { text-align: center; font-weight: bold; letter-spacing: 1px; background: #eee; vertical-align: middle; } tr.tt-break th { background: #eee; white-space: normal; }
      p.headnote { margin: 0 0 3px; text-align: center; font-size: 11px; font-weight: bold; letter-spacing: .3px; }
      h4.tt-sub { font-size: 12px; margin: 8px 0 3px; } h4.tt-sub:first-of-type { margin-top: 0; } p.tt-none { font-size: 11px; color: #666; }
      table { width: 100%; min-width: 0 !important; border-collapse: collapse; table-layout: fixed; font-size: 11px; line-height: 1.25; }
      th, td { border: 1px solid #555; padding: 4px 5px; vertical-align: top; text-align: left; word-wrap: break-word; }
      thead th { background: #e6e6e6; text-align: center; } th small { display: block; font-weight: normal; font-size: 9px; }
      tbody th { background: #f4f4f4; vertical-align: middle; } th.tt-per { width: 8%; white-space: nowrap; } th.tt-name { white-space: nowrap; }
      td b::after { content: " – "; font-weight: normal; } td span { color: #333; }
      td.free { color: #999; text-align: center; vertical-align: middle; } i.free { color: #999; } hr { border: 0; border-top: 1px dashed #999; margin: 2px 0; }
      .tt-var + .tt-var { border-top: 1.5px solid #333; margin-top: 3px; padding-top: 3px; } .tt-var em { font-style: normal; font-weight: bold; text-decoration: underline; margin-right: 4px; }
    </style></head><body>
      ${(sh => `<section><h1>${esc(SCHOOL)}</h1>${note() ? `<p class="headnote">${esc(note())}</p>` : ""}<h2>${esc(sh.title)}</h2>${sh.html}</section>`)(sheet())}
      <script>
        // Shrink any sheet larger than the printable area so it stays on one page, keeping the full page width.
        window.onload = () => {
          const mm = 96 / 25.4, [W, H] = [297, 210];
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
    if (e.target.closest('[data-tt="print"]')) print();
  }

  function mount(el, d) {
    root = el; data = d;
    render();
    if (!el.dataset.ttBound) {
      el.dataset.ttBound = "1";
      el.addEventListener("click", onClick);
      el.addEventListener("change", e => {
        if (e.target.matches("[data-tt-cls]")) { cls = e.target.value; render(); }
        if (e.target.matches("[data-tt-who]")) { who = e.target.value; render(); }
      });
    }
  }

  return { mount, parse };
})();
