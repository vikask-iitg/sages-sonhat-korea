// Arrangement / Substitution tool for the admin panel.
// Ported from the school's Smart Substitution Manager (index-v12.html): same generation rules,
// but data is saved to the website (/api/substitution) and each day's list can be published for teachers.
// Needs js/substitution-defaults.js (PERIOD_TIMES, TEACHERS, buildDefaultTimetable) and admin.js's toast().

window.SubstitutionAdmin = (() => {
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
  const ALL_PERIODS = [1, 2, 3, 4, 5, 6, 7]; // the default timetable's periods
  const ANY_PERIOD = Array.from({ length: 30 }, (_, i) => i + 1); // "every period" (days can have more than 7)
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const jsArg = s => esc(JSON.stringify(s)); // safe inside an HTML attribute
  // The school's teacher list is saved with the arrangement data (admin can add/remove teachers);
  // it starts from the default TEACHERS. sorted() gives A–Z order for every list on screen.
  let teachers = [...TEACHERS];
  const sorted = () => [...teachers].sort((a, b) => a.localeCompare(b));

  let root = null;
  let data = null;          // { timetable, history, savedDays, published }
  let tab = "daily";
  // Daily screen state (not saved until "Save & Publish")
  let date = "", day = "MON";
  let absentSet = new Set(), availSet = new Set(teachers);
  let absentPeriods = {}, blockedPeriods = {};
  let plan = [];
  let carriedFrom = "";     // date whose absent list was carried over into this one
  let ttDay = "MON", ttTeacher = "";
  let timesSet = "WEEK", timesDraft = null, breaksDraft = null; // while editing: periods [[start, end]], breaks { after: [start, end, label] } ("HH:MM")    // which period timings the Timetable tab is editing: "WEEK" (Mon–Fri) or "SAT"

  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const niceDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  const dayOf = iso => ["MON", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date(iso + "T00:00:00").getDay()];
  // Previous working day (Mon -> Sat, others -> yesterday)
  function previousWorkingDate(iso) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() - (d.getDay() === 1 ? 2 : 1));
    return isoDate(d);
  }

  // Rename teachers saved under the phone app's short names to their full names.
  function migrateNames(d) {
    const full = n => LEGACY_NAMES[n] || n;
    const renameKeys = obj => {
      if (!obj || typeof obj !== "object") return obj;
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [full(k), v]));
    };
    if (d.timetable) DAYS.forEach(dy => { d.timetable[dy] = renameKeys(d.timetable[dy]); });
    d.history = renameKeys(d.history);
    if (d.savedDays) Object.keys(d.savedDays).forEach(k => { d.savedDays[k] = renameKeys(d.savedDays[k]); });
    if (d.published) Object.values(d.published).forEach(x => {
      x.absent?.forEach(a => { a.teacher = full(a.teacher); });
      if (Array.isArray(x.present)) x.present = x.present.map(full);
      x.plan?.forEach(i => { i.absentTeacher = full(i.absentTeacher); if (i.assignedTeacher) i.assignedTeacher = full(i.assignedTeacher); });
    });
  }

  // Make sure every day / teacher / period exists, so older saved data keeps working when teachers are added.
  function normalize(raw) {
    const d = raw && typeof raw === "object" ? raw : {};
    migrateNames(d);
    d.teachers = Array.isArray(d.teachers) && d.teachers.length ? d.teachers.map(n => LEGACY_NAMES[n] || n) : [...TEACHERS];
    teachers = d.teachers;
    const fresh = buildDefaultTimetable();
    if (!d.timetable || typeof d.timetable !== "object") {
      d.timetable = fresh;
      d.periodTimesSat = d.periodTimesSat || { ...PERIOD_TIMES_SAT };
      d.periodBreaksSat = d.periodBreaksSat || { ...PERIOD_BREAKS_SAT };
    }
    if (!d.periodBreaks || typeof d.periodBreaks !== "object") d.periodBreaks = { ...PERIOD_BREAKS };
    if (typeof d.timetableNote !== "string") d.timetableNote = TIMETABLE_NOTE;
    // Wing of each teacher (Primary / Middle / Higher / Multipurpose) and their 10-digit WhatsApp number
    d.wings = d.wings && typeof d.wings === "object" ? d.wings : {};
    teachers.forEach(t => { if (!WINGS[d.wings[t]]) d.wings[t] = TEACHER_WINGS[t] || "multi"; });
    d.mobiles = d.mobiles && typeof d.mobiles === "object" ? d.mobiles : {};
    DAYS.forEach(dy => {
      d.timetable[dy] = d.timetable[dy] || {};
      teachers.forEach(t => {
        d.timetable[dy][t] = d.timetable[dy][t] || fresh[dy][t] || {};
        ALL_PERIODS.forEach(p => { if (!Array.isArray(d.timetable[dy][t][p])) d.timetable[dy][t][p] = []; });
      });
    });
    d.history = d.history && typeof d.history === "object" ? d.history : {};
    teachers.forEach(t => {
      const h = d.history[t] = d.history[t] || {};
      if (typeof h.count !== "number") h.count = 0;
      if (typeof h.lastDate !== "string") h.lastDate = "";
      if (!Array.isArray(h.lastPeriods)) h.lastPeriods = [];
    });
    d.savedDays = d.savedDays && typeof d.savedDays === "object" ? d.savedDays : {};
    d.published = d.published && typeof d.published === "object" ? d.published : {};
    // Period timings decide how many periods a day has (periods can be added or removed), so no merging with defaults.
    d.periodTimes = d.periodTimes && typeof d.periodTimes === "object" && Object.keys(d.periodTimes).length ? d.periodTimes : { ...PERIOD_TIMES };
    if (d.periodTimesSat && (typeof d.periodTimesSat !== "object" || !Object.keys(d.periodTimesSat).length)) delete d.periodTimesSat;
    return d;
  }

  async function save(message) {
    const res = await fetch("/api/substitution", {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => null);
    if (res?.status === 401) { toast("Session expired — log in again, then save.", true); return false; }
    if (res?.status === 409) { toast("Not saved: the arrangement was changed in another tab or device. Reload this page to get the latest, then make your change again.", true); return false; }
    if (!res?.ok) { toast("Could not save. Please try again.", true); return false; }
    data.rev = (await res.json().catch(() => ({}))).rev ?? data.rev;
    toast(message);
    return true;
  }

  // Period timings are saved data ("10:15 - 11:05", 12-hour clock without am/pm, as on the school timetable).
  // Saturday has its own timings once saved (data.periodTimesSat); until then it uses the Monday–Friday ones.
  const timesOf = dy => (dy === "SAT" && data.periodTimesSat) || data.periodTimes;
  // Breaks after a period ({ 4: { time, label } }); Saturday's go with its own timings
  const breaksOf = dy => (dy === "SAT" && data.periodTimesSat ? data.periodBreaksSat : data.periodBreaks) || {};
  const ptime = (p, dy) => timesOf(dy)[p] || "";
  // The periods a day has: P-1..P-n from its timings (Mon–Fri and Saturday can differ)
  const periodsFor = dy => Object.keys(timesOf(dy)).map(Number).sort((a, b) => a - b);
  // "01:25" (afternoon) <-> "13:25" for <input type="time">. School hours run from about 7 am to 6 pm.
  const toInput = hm => { const [h, m] = (hm || "").trim().split(":").map(Number); if (isNaN(h) || isNaN(m)) return "";
    return `${String(h < 7 ? h + 12 : h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
  const fromInput = v => { const [h, m] = v.split(":").map(Number); return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
  const tt = (dy, t, p) => data.timetable[dy][t][p] || [];
  const scheduled = (dy, t) => periodsFor(dy).filter(p => tt(dy, t, p).length);
  const freePeriods = (dy, t) => periodsFor(dy).filter(p => !tt(dy, t, p).length);

  function resetDaily() {
    absentSet = new Set(); availSet = new Set(teachers); absentPeriods = {}; blockedPeriods = {}; plan = []; carriedFrom = "";
  }

  // Fill the Daily screen for a date: its published arrangement if there is one,
  // otherwise carry over the absent teachers of the latest earlier published day.
  function loadDate(d) {
    resetDaily();
    date = d; day = data.published[d]?.day || dayOf(d);
    const pub = data.published[d];
    const prev = pub ? null : Object.keys(data.published).filter(x => x < d).sort().at(-1);
    const src = pub || (prev && data.published[prev]);
    if (!src) return;
    src.absent.filter(a => teachers.includes(a.teacher)).forEach(a => {
      absentSet.add(a.teacher); availSet.delete(a.teacher);
      absentPeriods[a.teacher] = pub ? new Set(a.periods) : new Set(ANY_PERIOD);
    });
    if (pub) { plan = pub.plan.map(i => ({ period: i.period, classDesc: i.classDesc, absentTeacher: i.absentTeacher, assignedTeacher: i.assignedTeacher || "",
      note: i.note || "", sports: i.sports || "", group: "", manual: true })); applyRules(); }
    else { carriedFrom = prev; syncPlan(); }
  }

  // ---------- rules of the Smart Substitution & Arrangement System (session 2026-27) ----------
  function createsFourConsecutive(busy, candidate) {
    const s = new Set(busy); s.add(candidate);
    let streak = 0;
    for (const p of periodsFor(day)) { streak = s.has(p) ? streak + 1 : 0; if (streak >= 4) return true; }
    return false;
  }

  // Wings: Primary (Classes 1–5), Middle (6–8), Higher (9–12); Multipurpose teachers adjust anywhere
  const wingOf = t => data.wings[t] || "multi";
  const classNo = cls => Number((String(cls).match(/^\s*Class\s*(\d+)/i) || [])[1]) || 0;
  const classWing = cls => { const n = classNo(cls); return !n ? "" : n <= 5 ? "primary" : n <= 8 ? "middle" : "higher"; };
  const subjectOf = entry => (String(entry).match(/\((.*)\)\s*$/) || [, entry])[1];
  const absentIn = wing => [...absentSet].filter(t => wingOf(t) === wing).length;

  // Mass absence, Monday–Friday: P-7 becomes a sports period for a whole wing (or every class)
  const SPORTS_P = 7;
  function sportsInfo() {
    const all = absentSet.size > 6, on = day !== "SAT";
    const primary = on && (all || absentIn("primary") >= 2), middle = on && (all || absentIn("middle") >= 2);
    const labelFor = i => {
      if (!on || i.period !== SPORTS_P) return "";
      if (all) return "Sports Period (All Teachers)";
      const w = classWing(i.classDesc);
      return w === "primary" && primary ? "Sports Period (All Primary Teachers)" : w === "middle" && middle ? "Sports Period (All Middle Teachers)" : "";
    };
    const notes = all ? ["7 period sports for all classes (Class 1 to 12)"]
      : [primary && "7 period sports for all primary classes", middle && "7 period sports for all middle classes"].filter(Boolean);
    return { labelFor, notes };
  }

  // Class 11 & 12 stream merge: only when 5+ teachers are absent and 3+ of them are Higher-wing teachers
  const mergeActive = () => absentSet.size >= 5 && absentIn("higher") >= 3;
  // Other teachers who teach the same class in the same period (the other streams)
  const coTeachers = i => teachers.filter(t => t !== i.absentTeacher && tt(day, t, i.period).some(e => classNo(e) === classNo(i.classDesc)));

  // ---------- the arrangement: one slot per class period of an absent teacher ----------
  // slot: { period, classDesc, absentTeacher, assignedTeacher, note, sports, group, manual }
  const slotKey = i => `${i.absentTeacher}|${i.period}|${i.classDesc}`;

  // Rebuild the slots from the current absences, keeping choices already made, then apply the rules.
  // With `fill`, empty slots get the best free teacher automatically (the admin can change or remove any).
  function syncPlan(fill = true) {
    const old = new Map(plan.map(i => [slotKey(i), i]));
    const slots = [];
    [...absentSet].forEach(t => {
      const needed = absentPeriods[t] || new Set(ANY_PERIOD);
      periodsFor(day).forEach(p => { if (needed.has(p)) tt(day, t, p).forEach(cls => slots.push({ period: p, classDesc: cls, absentTeacher: t })); });
    });
    slots.sort((x, y) => x.period - y.period || x.absentTeacher.localeCompare(y.absentTeacher));
    plan = slots.map(sl => {
      const o = old.get(slotKey(sl)) || {};
      const keep = o.assignedTeacher && !absentSet.has(o.assignedTeacher) ? o.assignedTeacher : "";
      return { ...sl, assignedTeacher: keep, note: keep ? o.note || "" : "", manual: !!o.manual, sports: "", group: "" };
    });
    applyRules();
    if (fill) autoAssign(false);
  }

  function applyRules() {
    const sp = sportsInfo(), merge = mergeActive();
    plan.forEach(i => {
      i.sports = sp.labelFor(i);
      if (i.sports) { i.assignedTeacher = ""; i.note = ""; i.group = ""; return; }
      i.group = "";
      const senior = classNo(i.classDesc) >= 11;
      if (merge && senior) {
        const co = coTeachers(i), present = co.filter(t => !absentSet.has(t));
        if (present.length) {          // a co-teacher of the same class & period is present: merge into their class
          if (!i.manual) { i.assignedTeacher = present[0]; i.note = `Merged with ${subjectOf(tt(day, present[0], i.period).find(e => classNo(e) === classNo(i.classDesc)))} class`; }
          return;
        }
        if (co.length) i.group = `${classNo(i.classDesc)}|${i.period}`; // every stream teacher absent: one substitute for all
      }
      if (!i.manual && i.note.startsWith("Merged") && !(merge && senior)) { i.assignedTeacher = ""; i.note = ""; }
    });
    // A combined group needs ONE substitute: if its slots were filled separately (before the rule applied), refill them together
    [...new Set(plan.filter(i => i.group).map(i => i.group))].forEach(g => {
      const slots = plan.filter(i => i.group === g);
      if (slots.some(i => i.manual)) return;
      if (new Set(slots.map(i => i.assignedTeacher)).size > 1 || slots.some(i => !i.assignedTeacher)) slots.forEach(i => { i.assignedTeacher = ""; i.note = ""; });
    });
  }
  const groupNote = g => `Combined: ${plan.filter(i => i.group === g).map(i => subjectOf(i.classDesc)).join(" + ")}`;

  // Periods each teacher is busy with: own classes plus substitutions in the plan
  // (ignoring one slot — and the other slots of its combined group — when choosing for it)
  function busyMap(skip = -1) {
    const g = skip >= 0 ? plan[skip].group : "";
    const busy = {};
    teachers.forEach(t => { busy[t] = new Set(scheduled(day, t)); });
    plan.forEach((i, k) => { if (k === skip || (g && i.group === g)) return; if (i.assignedTeacher && busy[i.assignedTeacher]) busy[i.assignedTeacher].add(i.period); });
    return busy;
  }

  // Substitution periods a teacher took earlier this week (Monday up to the day before)
  function weeklySubs(t) {
    const d0 = new Date(date + "T00:00:00"); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    const from = isoDate(d0);
    return Object.entries(data.savedDays).filter(([d]) => d >= from && d < date).reduce((n, [, v]) => n + ((v || {})[t]?.length || 0), 0);
  }

  // Free, present teachers for a period, best first — the priority order:
  // 1) strict least workload today (regular + substitution), so nobody goes past 5 while others have fewer;
  // 2) wing / section matching (Multipurpose teachers match any wing); 3) avoid 4 consecutive periods;
  // 4) rotation: not whoever substituted on the previous saved day (especially the same period), fewer this week.
  const candidatesFor = (k, busy = busyMap(k)) => candidatesAt(plan[k].period, busy, plan[k].classDesc);
  function candidatesAt(p, busy = busyMap(), cls = "") {
    const prevDate = Object.keys(data.savedDays).filter(d => d < date).sort().at(-1);
    const prev = prevDate ? data.savedDays[prevDate] || {} : {};
    const rep = t => (prev[t]?.length ? (prev[t].includes(p) ? 2 : 1) : 0);
    const w = classWing(cls);
    const wingMiss = t => (!w || wingOf(t) === "multi" || wingOf(t) === w ? 0 : 1);
    const week = Object.fromEntries(teachers.map(t => [t, weeklySubs(t)]));
    return teachers.filter(t => !absentSet.has(t) && !busy[t].has(p) && !blockedPeriods[t]?.has(p)).sort((a, b) =>
      busy[a].size - busy[b].size
      || wingMiss(a) - wingMiss(b)
      || (createsFourConsecutive(busy[a], p) ? 1 : 0) - (createsFourConsecutive(busy[b], p) ? 1 : 0)
      || rep(a) - rep(b)
      || week[a] - week[b]
      || a.localeCompare(b));
  }

  // Give empty slots the best free teacher, in period order (a combined group gets one teacher for all of it).
  // includeManual: also fill slots the admin emptied on purpose (the "Fill empty periods" button).
  function autoAssign(includeManual = true) {
    const idx = plan.map((_, k) => k).filter(k => !plan[k].sports && !plan[k].assignedTeacher && (includeManual || !plan[k].manual))
      .sort((x, y) => plan[x].period - plan[y].period);
    idx.forEach(k => {
      const i = plan[k];
      if (i.assignedTeacher) return; // filled with its group
      const best = candidatesFor(k)[0] || "";
      (i.group ? plan.filter(x => x.group === i.group && !x.assignedTeacher) : [i]).forEach(x => {
        x.assignedTeacher = best; x.manual = false; x.note = best && i.group ? groupNote(i.group) : "";
      });
    });
    rebalance();
    return plan.filter(i => !i.sports && !i.assignedTeacher).length;
  }

  // Filling in period order can leave an early pick with more periods than someone still free for that slot.
  // Re-check every automatic choice and move it to a teacher with strictly fewer periods today until nothing improves.
  function rebalance() {
    for (let round = 0; round < 6; round++) {
      let moved = false;
      plan.forEach((i, k) => {
        if (i.sports || i.manual || i.group || !i.assignedTeacher || i.note.startsWith("Merged")) return;
        const busy = busyMap(k), best = candidatesAt(i.period, busy, i.classDesc)[0];
        if (best && best !== i.assignedTeacher && busy[best].size < busy[i.assignedTeacher].size) { i.assignedTeacher = best; moved = true; }
      });
      if (!moved) break;
    }
  }

  // Warning shown on a slot's card
  function slotStatus(k, busy = busyMap(k)) {
    const i = plan[k], t = i.assignedTeacher;
    if (i.sports) return null;
    if (!t) return { text: "Not assigned — merge class", badge: "danger" };
    if (!i.note.startsWith("Merged") && createsFourConsecutive(busy[t] || new Set(), i.period)) return { text: "4th period in a row", badge: "warn" };
    return null;
  }

  // Slots that are a teacher's 6th (or later) period of the day → "(Sports/Outdoor Activities)"
  function sixthPeriodSlots() {
    const out = new Set();
    teachers.forEach(t => {
      const reg = scheduled(day, t); let n = reg.length; const seen = new Set();
      plan.map((i, k) => [i, k]).filter(([i]) => i.assignedTeacher === t).sort((a, b) => a[0].period - b[0].period).forEach(([i, k]) => {
        if (!reg.includes(i.period) && !seen.has(i.period)) { seen.add(i.period); n++; if (n >= 6) out.add(k); }
      });
    });
    return out;
  }
  const ACTIVITY = "(Sports/Outdoor Activities)";

  // Present teachers' workload today: regular periods, substitution periods (numbers) and the total
  function workloadSummary() {
    return sorted().filter(t => !absentSet.has(t)).map(t => {
      const reg = scheduled(day, t);
      const subs = [...new Set(plan.filter(i => i.assignedTeacher === t && !reg.includes(i.period)).map(i => i.period))].sort((a, b) => a - b);
      return { teacher: t, regular: reg.length, subs, total: reg.length + subs.length };
    });
  }

  // What the teachers' Daily Arrangement page shows for this date
  function publishedEntry() {
    const six = sixthPeriodSlots();
    return {
      day,
      absent: [...absentSet].map(t => ({ teacher: t, periods: scheduled(day, t).filter(p => (absentPeriods[t] || new Set(ANY_PERIOD)).has(p)) })),
      present: teachers.filter(t => !absentSet.has(t)),
      plan: plan.map((i, k) => ({ period: i.period, time: ptime(i.period, day), classDesc: i.classDesc, absentTeacher: i.absentTeacher,
        assignedTeacher: i.assignedTeacher, note: i.note || "", sports: i.sports || "", activity: six.has(k) })),
      notes: sportsInfo().notes,
      summary: workloadSummary(),
      publishedAt: new Date().toISOString(),
    };
  }

  // Preview: the real teachers' page in a window, fed the unpublished draft through localStorage (same site)
  const PREVIEW_KEY = "sages-arrangement-preview";
  // viewDate: show an already-published day read-only (History tab) instead of the current draft
  function openPreview(viewDate = "") {
    closePreview(); // an old preview window, if any (this also clears the stored draft, so store it after)
    const shown = viewDate ? { date: viewDate, entry: data.published[viewDate], published: true } : { date, entry: publishedEntry() };
    try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(shown)); }
    catch { return toast("This view needs browser storage — please allow it.", true); }
    const box = document.createElement("div");
    box.className = "sub-preview";
    box.innerHTML = `<div class="sub-preview-win" role="dialog" aria-modal="true" aria-label="${viewDate ? "Published arrangement" : "Preview of the Daily Arrangement page"}">
        <div class="sub-preview-bar${viewDate ? " view" : ""}"><b>${viewDate ? `📋 Arrangement — ${esc(niceDate(viewDate))}` : "👁 Preview — this is what teachers will see"}</b>
          <span>${viewDate ? "" : `<button type="button" class="btn-sm primary" data-prev="publish">💾 Publish now</button> `}<button type="button" class="btn-sm" data-prev="close">Close</button></span></div>
        <iframe src="/pages/arrangement.html?preview=1&t=${Date.now()}" title="Daily Arrangement preview"></iframe>
      </div>`;
    box.addEventListener("click", e => {
      const act = e.target.closest("[data-prev]")?.dataset.prev;
      if (act === "close" || e.target === box) closePreview();
      if (act === "publish") saveAndPublish();
    });
    document.body.appendChild(box);
    document.addEventListener("keydown", previewKey);
  }
  function previewKey(e) { if (e.key === "Escape") closePreview(); }
  function closePreview() {
    document.querySelector(".sub-preview")?.remove();
    document.removeEventListener("keydown", previewKey);
    try { localStorage.removeItem(PREVIEW_KEY); } catch {}
  }

  // Only the latest KEEP_DAYS published days are kept: publishing a new one removes the oldest.
  // Fairness counts are not reduced (they reset with "New month"); the old day's list just goes.
  const KEEP_DAYS = 30;
  function pruneOld() {
    const old = Object.keys(data.published).sort().reverse().slice(KEEP_DAYS);
    old.forEach(d => { delete data.published[d]; delete data.savedDays[d]; });
    return old;
  }

  async function saveAndPublish() {
    if (!plan.length) return;
    const empty = plan.filter(i => !i.assignedTeacher && !i.sports).length;
    if (empty && !confirm(`${empty} period(s) have no substitute and will show as "merge class". Publish anyway?`)) return;
    const old = data.savedDays[date];
    if (old && !confirm(`An arrangement for ${date} is already published. Replace it with this one?`)) return;
    const perTeacher = {};
    plan.forEach(i => {
      const t = i.assignedTeacher;
      if (!t || i.sports || i.note.startsWith("Merged") || (perTeacher[t] || []).includes(i.period)) return;
      (perTeacher[t] = perTeacher[t] || []).push(i.period);
    });
    // Undo the counts of a previously saved list for this date, then add the new one
    if (old) Object.keys(old).forEach(t => { if (data.history[t]) data.history[t].count = Math.max(0, data.history[t].count - old[t].length); });
    data.savedDays[date] = perTeacher;
    teachers.forEach(t => {
      const h = data.history[t];
      if (perTeacher[t]) h.count += perTeacher[t].length;
      const dates = Object.keys(data.savedDays).filter(d => data.savedDays[d][t]?.length).sort();
      if (dates.length) { h.lastDate = dates.at(-1); h.lastPeriods = data.savedDays[h.lastDate][t]; }
      else if (h.lastDate === date) { h.lastDate = ""; h.lastPeriods = []; }
    });
    data.published[date] = publishedEntry();
    const dropped = pruneOld();
    closePreview();
    if (await save((old ? "Arrangement updated and re-published." : "Saved and published — teachers can now see it.")
      + (dropped.length ? ` Oldest record removed (${dropped.join(", ")}) — only the latest ${KEEP_DAYS} are kept.` : ""))) render();
  }

  async function unpublish(d, ask = true) {
    if (ask && !confirm(`Remove the published arrangement for ${d}? Teachers will no longer see it, and its counts will be taken off the history.`)) return;
    const old = data.savedDays[d] || {};
    Object.keys(old).forEach(t => { if (data.history[t]) data.history[t].count = Math.max(0, data.history[t].count - old[t].length); });
    delete data.savedDays[d];
    delete data.published[d];
    teachers.forEach(t => {
      const h = data.history[t];
      const dates = Object.keys(data.savedDays).filter(x => data.savedDays[x][t]?.length).sort();
      h.lastDate = dates.at(-1) || ""; h.lastPeriods = dates.length ? data.savedDays[h.lastDate][t] : [];
    });
    if (await save("Removed.")) { if (d === date) resetDaily(); render(); }
  }

  // What a slot shows in the "assigned teacher" column of every output (chart, print, Word, WhatsApp)
  function assignedText(i, k, six = sixthPeriodSlots()) {
    if (i.sports) return i.sports;
    if (!i.assignedTeacher) return "No free teacher (merge class)";
    return i.assignedTeacher + (six.has(k) ? ` ${ACTIVITY}` : "") + (i.note ? ` [${i.note}]` : "");
  }

  function whatsappText() {
    const six = sixthPeriodSlots();
    let text = `*SAGES SONHAT - ARRANGEMENT CLASS*\n📅 Date: ${date} (${day})\n----------------------\n`;
    const absentList = sorted().filter(t => absentSet.has(t));
    if (absentList.length) text += `*Absent Teachers*\n${absentList.map((t, k) => `${k + 1}. ${t}`).join("\n")}\n----------------------\n`;
    plan.forEach((i, k) => { text += `• *P-${i.period}* (${ptime(i.period, day)}) | ${i.classDesc}\n   Absent: ${i.absentTeacher} ➔ *${assignedText(i, k, six)}*\n`; });
    const notes = sportsInfo().notes;
    if (notes.length) text += `----------------------\n${notes.map(n => `🏃 ${n}`).join("\n")}\n`;
    return text + `----------------------\nFull list: ${location.origin}/pages/arrangement.html`;
  }

  // One combined message for a teacher with all their substitution periods today
  function teacherMessage(t) {
    const six = sixthPeriodSlots();
    const mine = plan.map((i, k) => [i, k]).filter(([i]) => i.assignedTeacher === t && !i.sports);
    return `*SAGES SONHAT - ARRANGEMENT CLASS*\n📅 Date: ${date} (${day})\n\nDear ${t}, your arrangement periods today:\n`
      + mine.map(([i, k]) => `• *P-${i.period}* (${ptime(i.period, day)}) | ${i.classDesc} — for ${i.absentTeacher}${six.has(k) ? ` ${ACTIVITY}` : ""}${i.note ? ` [${i.note}]` : ""}`).join("\n")
      + `\n\nFull list: ${location.origin}/pages/arrangement.html`;
  }
  const teacherWaLink = t => { const m = String(data.mobiles[t] || "").replace(/\D/g, "");
    return (m.length === 10 ? `https://wa.me/91${m}` : "https://wa.me/") + "?text=" + encodeURIComponent(teacherMessage(t)); };

  // Printable chart: absent teachers once at the top, a 4-column table, notes, then the workload summary
  function chartParts() {
    const six = sixthPeriodSlots();
    return {
      absent: sorted().filter(t => absentSet.has(t)),
      rows: plan.map((i, k) => [`P-${i.period} (${ptime(i.period, day)})`, i.classDesc, i.absentTeacher, assignedText(i, k, six)]),
      notes: sportsInfo().notes,
      summary: workloadSummary(),
    };
  }

  const loadScript = src => new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const el = document.createElement("script"); el.src = src; el.onload = ok; el.onerror = fail; document.head.appendChild(el);
  });

  // Editable Word (.docx) file of the day's chart and summary, built in the browser (JSZip from cdnjs)
  async function downloadDocx() {
    try { await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"); }
    catch { return toast("Could not load the Word maker — check the internet connection.", true); }
    const c = chartParts(), x = v => String(v ?? "").replace(/[<>&"]/g, ch => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[ch]));
    const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}<w:sz w:val="${o.size || 20}"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
    const para = (t, o = {}) => `<w:p><w:pPr>${o.center ? '<w:jc w:val="center"/>' : ""}<w:spacing w:after="${o.after ?? 80}"/></w:pPr>${run(t, o)}</w:p>`;
    const cell = (t, o = {}) => `<w:tc><w:tcPr>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ""}</w:tcPr>${para(t, { ...o, after: 0 })}</w:tc>`;
    const table = (head, rows) => `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(e => `<w:${e} w:val="single" w:sz="4" w:space="0" w:color="8A9BB8"/>`).join("")}</w:tblBorders>
      <w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>
      <w:tr>${head.map(h => cell(h, { b: true, color: "FFFFFF", fill: "0B3D91" })).join("")}</w:tr>${rows.map(r => `<w:tr>${r.map(v => cell(v)).join("")}</w:tr>`).join("")}</w:tbl>`;
    const body = [
      para("SWAMI ATMANAND GOVT. ENGLISH MEDIUM SCHOOL, SONHAT", { b: true, center: true, size: 28, color: "0B3D91" }),
      para(`Arrangement Class — ${niceDate(date)}`, { b: true, center: true, size: 24 }),
      para(`Absent Teachers: ${c.absent.join(", ") || "None"}`, { b: true, color: "B71C1C", after: 160 }),
      table(["Period & Time", "Class & Subject", "Absent Teacher", "Assigned Teacher"], c.rows),
      ...c.notes.map(n => para(n, { b: true, color: "8A5300" })),
      para("Present Teachers Workload Summary", { b: true, size: 24, color: "0B3D91", after: 80 }),
      table(["Teacher", "Regular", "Substitution", "Total"], c.summary.map(r => [r.teacher, r.regular, r.subs.length ? `${r.subs.length} (${r.subs.map(p => `P-${p}`).join(", ")})` : "—", r.total])),
    ].join("");
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}
      <w:p/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`);
    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Arrangement Class ${date} - SAGES Sonhat.docx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("Word file downloaded — open it to edit or print.");
  }

  // ---------- rendering ----------
  const chip = (cls, onclick, icon, label, disabled = false) =>
    `<button type="button" class="sub-chip ${cls}" ${disabled ? "disabled" : `data-sub="${onclick}"`}>${icon}<span>${esc(label)}</span></button>`;

  let freeOpen = false; // "free periods of present teachers" panel open?

  function dailyHtml() {
    const absent = sorted().filter(t => absentSet.has(t));
    const slotIndex = new Map(plan.map((i, k) => [slotKey(i), k]));
    const six = sixthPeriodSlots();
    const toCoverAll = plan.filter(i => !i.sports).length, assigned = plan.filter(i => !i.sports && i.assignedTeacher).length;
    const wingTag = t => `<i class="sub-wing w-${wingOf(t)}">${{ primary: "Primary", middle: "Middle", higher: "Higher", multi: "Multi" }[wingOf(t)]}</i>`;

    // Under each absent teacher: one card per class period with a dropdown of present teachers free then
    const absentBoxes = absent.map(t => {
      const needed = absentPeriods[t] || new Set(ANY_PERIOD);
      const cards = scheduled(day, t).flatMap(p => tt(day, t, p).map(cls => {
        const k = slotIndex.get(slotKey({ absentTeacher: t, period: p, classDesc: cls }));
        const on = needed.has(p) && k !== undefined, i = on ? plan[k] : null, sub = on ? i.assignedTeacher : "";
        const head = `<div class="sub-pcard-head"><b>P-${p}</b><small>${esc(ptime(p, day))}</small></div><div class="sub-pcard-cls">${esc(cls)}</div>`;
        if (on && i.sports) return `<div class="sub-pcard is-sports">${head}<div class="sub-sports">🏃 ${esc(i.sports)}</div></div>`;
        const busy = on ? busyMap(k) : busyMap(), st = on ? slotStatus(k, busy) : null;
        const co = on && classNo(cls) >= 11 ? coTeachers(i).filter(x => !absentSet.has(x)) : [];
        const groupMates = on && i.group ? plan.filter(x => x.group === i.group && x.assignedTeacher).map(x => x.assignedTeacher) : [];
        const opts = [...new Set([...(sub ? [sub] : []), ...groupMates, ...candidatesAt(p, busy, cls)])];
        const label = x => co.includes(x) ? `${x} — merge into their class` : `${x} (${busy[x]?.size || 0} today · ${weeklySubs(x)} this wk)${wingOf(x) !== classWing(cls) && wingOf(x) !== "multi" ? " · other wing" : ""}`;
        const attrs = `data-subchange="assign" data-t="${jsArg(t)}" data-p="${p}" data-c="${esc(cls)}"`;
        return `<div class="sub-pcard ${!on ? "is-covered" : sub ? "is-done" : "is-empty"}">${head}
          <div class="sub-pcard-pick">
            <select ${attrs} aria-label="Substitute for ${esc(t)}, P-${p}">
              <option value=""${on && !sub ? " selected" : ""}>— Not assigned —</option>
              ${[...new Set([...opts, ...co])].map(x => `<option value="${esc(x)}"${x === sub ? " selected" : ""}>${esc(label(x))}</option>`).join("")}
              <option value="__covered"${!on ? " selected" : ""}>✓ Already covered</option>
            </select>
            ${sub ? `<button type="button" class="sub-time-del" data-sub="unassign" data-i="${k}" title="Remove ${esc(sub)}" aria-label="Remove substitute">✕</button>` : ""}
          </div>
          ${on && i.note ? `<span class="sub-badge info">${esc(i.note)}</span>` : ""}
          ${on && six.has(k) ? `<span class="sub-badge warn">6th period → ${ACTIVITY}</span>` : ""}
          ${st ? `<span class="sub-badge ${st.badge}">${esc(st.text)}</span>` : ""}
        </div>`;
      }));
      const mine = plan.filter(i => i.absentTeacher === t), toCover = mine.filter(i => !i.sports).length;
      const who = mine.map(i => `<span class="${i.sports ? "sports" : i.assignedTeacher ? "" : "none"}"><b>P-${i.period}</b> → ${i.sports ? "Sports" : i.assignedTeacher ? esc(i.assignedTeacher) : "not assigned"}</span>`).join("");
      return `<div class="sub-group"><h4>${esc(t)} ${wingTag(t)} <small>absent · ${cards.length ? `${toCover} period${toCover === 1 ? "" : "s"} to cover` : "no class today"}</small>
          <span class="sub-presets"><button type="button" class="btn-sm" data-sub="absAll" data-t="${jsArg(t)}">All</button><button type="button" class="btn-sm" data-sub="absAfter3" data-t="${jsArg(t)}">After 3rd (P4–7)</button></span>
          <button type="button" class="sub-x" data-sub="absent" data-t="${jsArg(t)}" title="Mark ${esc(t)} present again" aria-label="Mark present">✕</button></h4>
        ${who ? `<div class="sub-who">${who}</div>` : ""}
        ${cards.length ? `<div class="sub-pcards">${cards.join("")}</div>` : ""}</div>`;
    }).join("");

    // Present teachers' free periods: untick one to keep that teacher out of it (office duty, personal break…)
    const present = sorted().filter(t => !absentSet.has(t));
    const blockedCount = present.reduce((n, t) => n + (blockedPeriods[t]?.size || 0), 0);
    const freePanel = `<details class="sub-free"${freeOpen ? " open" : ""}><summary data-sub="freeToggle">🕘 Present teachers' free periods today${blockedCount ? ` · <b>${blockedCount} unticked</b>` : ""} <small>— untick a period for office duty or a personal break</small></summary>
        <div class="sub-slots">${present.map(t => { const free = freePeriods(day, t);
          return `<div class="sub-slot"><b>${esc(t)} ${wingTag(t)}</b><div class="sub-pills">${free.length ? free.map(p => { const bl = blockedPeriods[t]?.has(p);
            return `<button type="button" class="sub-pill ${bl ? "blocked" : "free"}" data-sub="blockPeriod" data-t="${jsArg(t)}" data-p="${p}" title="${esc(ptime(p, day))}">${bl ? "✕" : "✓"} P-${p}</button>`; }).join("") : `<span class="sub-muted">No free period</span>`}</div></div>`; }).join("")}</div>
      </details>`;

    const notes = sportsInfo().notes, summary = workloadSummary(), merge = mergeActive();
    const subsBy = {}; plan.forEach(i => { if (i.assignedTeacher && !i.sports) (subsBy[i.assignedTeacher] = subsBy[i.assignedTeacher] || []).push(i); });
    const result = !absent.length ? "" : `
      <div class="sub-card" id="sub-result">
        <div class="sub-card-head"><h3>2. Review &amp; publish — ${esc(niceDate(date))}</h3>${plan.length ? (data.published[date] ? `<span class="sub-tag">Published</span>` : `<span class="sub-tag draft">Not published yet</span>`) : ""}</div>
        ${!plan.length ? `<p class="hint">No periods need a substitute.</p>` : `
          <div class="sub-arr-bar"><span><b>${toCoverAll}</b> periods to cover · <b class="ok">${assigned}</b> assigned${toCoverAll - assigned ? ` · <b class="bad">${toCoverAll - assigned}</b> not assigned` : ""}${plan.length - toCoverAll ? ` · ${plan.length - toCoverAll} sports` : ""}</span>
            <span><button type="button" class="btn-sm" data-sub="autoAssign">⚡ Fill empty periods</button> <button type="button" class="btn-sm" data-sub="clearAssign">Clear all</button></span></div>
          ${merge ? `<p class="sub-note">🔀 Class 11 &amp; 12 stream merge is on today (${absentSet.size} absent, ${absentIn("higher")} from the Higher wing).</p>` : ""}
          ${notes.length ? `<div class="sub-notes">${notes.map(n => `<p>🏃 ${esc(n)}</p>`).join("")}</div>` : ""}
          <div class="sub-actions">
            <button type="button" class="btn-sm btn-preview" data-sub="preview">👁 Preview</button>
            <button type="button" class="btn-sm primary" data-sub="publish">💾 Save &amp; Publish</button>
            <button type="button" class="btn-sm wa" data-sub="whatsapp">📲 WhatsApp</button>
            <button type="button" class="btn-sm" data-sub="copy">📋 Copy text</button>
            <button type="button" class="btn-sm" data-sub="print">🖨 Print</button>
            <button type="button" class="btn-sm" data-sub="docx">📄 Word (.docx)</button>
          </div>
          <p class="hint">Publishing saves each substitute's count for fairness and shows this list on the website's <a href="/pages/arrangement.html" target="_blank">Daily Arrangement</a> page.</p>
          ${Object.keys(subsBy).length ? `<h4 class="sub-h4">📲 Send each teacher their periods</h4>
          <div class="sub-send">${Object.keys(subsBy).sort().map(t => { const m = data.mobiles[t];
            return `<div class="sub-send-row"><b>${esc(t)}</b><span>${subsBy[t].map(i => `P-${i.period}`).join(", ")}</span>
              <a class="btn-sm wa" href="${esc(teacherWaLink(t))}" target="_blank" rel="noopener">${m ? `WhatsApp ${esc(m)}` : "WhatsApp (choose contact)"}</a></div>`; }).join("")}</div>
          <p class="hint">Add teachers' 10-digit mobile numbers in the <b>Teachers</b> tab to open their chat directly.</p>` : ""}
          <h4 class="sub-h4">👥 Present teachers' workload today</h4>
          <div class="sub-table-wrap"><table class="sub-table sub-workload"><tr><th>Teacher</th><th>Regular</th><th>Substitution</th><th>Total</th></tr>
            ${summary.map(r => `<tr${r.total >= 6 ? ' class="heavy"' : ""}><td><b>${esc(r.teacher)}</b></td><td>${r.regular}</td><td>${r.subs.length ? `${r.subs.length} (${r.subs.map(p => `P-${p}`).join(", ")})` : "—"}</td><td><b>${r.total}</b></td></tr>`).join("")}
          </table></div>`}
      </div>`;
    return `
      <div class="sub-card">
        <div class="sub-row">
          <label class="field"><span>Date</span><input type="date" data-subchange="date" value="${esc(date)}"></label>
          <label class="field"><span>Timetable day</span><select data-subchange="day">${DAYS.map(d => `<option value="${d}"${d === day ? " selected" : ""}>${DAY_NAMES[d]}</option>`).join("")}</select></label>
        </div>
        ${data.published[date] ? `<p class="sub-note">✔ The arrangement for this date is published and shown below. Change it and publish again to replace it.</p>`
          : carriedFrom ? `<p class="sub-note carry">↪ Absent teachers carried over from <b>${esc(niceDate(carriedFrom))}</b>. Change them if needed, or reset to start fresh.</p>` : ""}
        <button type="button" class="btn-sm danger" data-sub="resetDay" style="margin-top:10px">↺ Reset ${date === isoDate(new Date()) ? "today's" : "this day's"} arrangement</button>
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>1. Absent teachers</h3><button type="button" class="btn-sm" data-sub="clearAbsent">Clear</button></div>
        <p class="hint">Tap the teachers who are absent. For a half day use <b>After 3rd (P4–7)</b>. Each period gets the best free teacher automatically:
          fewest periods today first, then the same wing as the class, then no 4 periods in a row, then whoever did not substitute yesterday and has fewer this week.
          <b>(x today · y this wk)</b> = periods today and substitutions this week. Change any name from its list.</p>
        <div class="sub-chips">${sorted().map(t => chip(absentSet.has(t) ? "absent-on" : "", "absent", absentSet.has(t) ? "☑" : "☐", t).replace('data-sub="absent"', `data-sub="absent" data-t="${jsArg(t)}"`)).join("")}</div>
        ${absentBoxes}
        ${absent.length ? freePanel : ""}
      </div>
      ${result}`;
  }

  function historyHtml() {
    const pub = Object.keys(data.published).sort().reverse();
    return `
      <div class="sub-card">
        <div class="sub-card-head"><h3>Arrangement count this month</h3><button type="button" class="btn-sm danger" data-sub="resetHistory">New month (reset)</button></div>
        <p class="hint">How many arrangement periods each teacher has taken. The generator uses this to share duties fairly.</p>
        <div class="sub-table-wrap"><table class="sub-table">
          <tr><th>Teacher</th><th>Total</th><th>Last duty</th></tr>
          ${sorted().map(t => { const h = data.history[t];
            return `<tr><td><b>${esc(t)}</b></td><td><span class="sub-badge ok">${h.count} periods</span></td><td>${h.lastDate ? `${esc(h.lastDate)} (P-${h.lastPeriods.join(", P-")})` : "—"}</td></tr>`; }).join("")}
        </table></div>
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>Published arrangements (Last ${KEEP_DAYS} days)</h3><span class="sub-tag">${Object.keys(data.published).length} / ${KEEP_DAYS}</span></div>
        <p class="hint">Only the latest ${KEEP_DAYS} arrangements are kept. When a new one is published, the oldest is removed automatically. Click a day to open its arrangement.</p>
        ${pub.length ? `<div class="sub-table-wrap"><table class="sub-table"><tr><th>Date</th><th>Absent</th><th>Substitutions</th><th></th></tr>
          ${pub.map(d => { const x = data.published[d];
            return `<tr class="sub-click" data-sub="viewDay" data-d="${esc(d)}" tabindex="0" title="Open the arrangement for ${esc(d)}"><td><b>${esc(d)}</b><small>${DAY_NAMES[x.day] || ""}</small></td><td>${x.absent.map(a => esc(a.teacher)).join(", ")}</td><td>${x.plan.length}</td>
              <td class="sub-view">View ›</td></tr>`; }).join("")}
        </table></div>` : `<p class="sub-muted">Nothing published yet.</p>`}
      </div>`;
  }

  const timesDay = () => (timesSet === "SAT" ? "SAT" : "MON");
  const savedDraft = () => periodsFor(timesDay()).map(p => ptime(p, timesDay()).split("-").map(x => toInput(x.trim())));
  const draft = () => (timesDraft = timesDraft || savedDraft());
  const savedBreaks = () => Object.fromEntries(Object.entries(breaksOf(timesDay())).map(([k, v]) => [k, [...v.time.split("-").map(x => toInput(x.trim())), v.label || "Lunch"]]));
  const bdraft = () => (breaksDraft = breaksDraft || savedBreaks());
  const draftChanged = () => JSON.stringify(draft()) !== JSON.stringify(savedDraft()) || JSON.stringify(bdraft()) !== JSON.stringify(savedBreaks());
  // "HH:MM" + minutes
  const addMin = (hm, m) => { const [h, mi] = hm.split(":").map(Number), t = Math.min(h * 60 + mi + m, 23 * 60 + 59); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };

  // Between two periods: the break's times and name, or a button to add one
  function breakRow(after) {
    const br = bdraft()[after];
    if (!br) return `<button type="button" class="sub-break-add" data-sub="addBreak" data-k="${after}">＋ Lunch break after P-${after}</button>`;
    return `<div class="sub-time sub-break"><input class="sub-break-name" data-bl="${after}" value="${esc(br[2])}" maxlength="20" aria-label="Break name">
      <input type="time" data-bt="${after}" data-end="0" value="${br[0]}"><span>to</span><input type="time" data-bt="${after}" data-end="1" value="${br[1]}">
      <button type="button" class="sub-time-del" data-sub="delBreak" data-k="${after}" title="Remove break" aria-label="Remove break">✕</button></div>`;
  }

  function timetableHtml() {
    return `
      <div class="sub-card">
        <div class="sub-card-head"><h3>Heading on every timetable</h3></div>
        <p class="hint">Shown at the top of the School Timetable page and on every printed timetable, e.g. the start date and prayer time. Each line here is a separate line there.</p>
        <div class="sub-pcard-pick"><textarea class="sub-input" id="sub-tt-note" rows="2" maxlength="200" placeholder="W.E.F. - 16/06/2026&#10;Prayer Time - 10:00 AM - 10:15 AM">${esc(data.timetableNote)}</textarea>
          <button type="button" class="btn-sm primary" data-sub="saveNote">💾 Save</button></div>
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>Period timings</h3></div>
        <div class="sub-tabs sub-tabs-sm">${[["WEEK", "Monday – Friday"], ["SAT", "Saturday"]].map(([k, l]) =>
          `<button type="button" class="sub-tab${timesSet === k ? " active" : ""}" data-sub="timesSet" data-k="${k}">${l}</button>`).join("")}</div>
        <p class="hint">${timesSet === "SAT"
          ? (data.periodTimesSat ? "Saturday has its own timings." : "Saturday is using the Monday – Friday timings. Change them below and click <b>Save timings</b> to give Saturday its own.")
          : "Timings for Monday to Friday."} New arrangements, printouts and the teachers' pages use these times.</p>
        <div class="sub-times">
          ${draft().map(([a, b], k) => { const p = k + 1, last = p === draft().length;
            return `<div class="sub-time"><b>P-${p}</b><input type="time" data-pt="${p}" data-end="0" value="${a}"><span>to</span><input type="time" data-pt="${p}" data-end="1" value="${b}">${last && p > 1
              ? `<button type="button" class="sub-time-del" data-sub="delPeriod" title="Remove P-${p}" aria-label="Remove P-${p}">✕</button>` : `<span class="sub-time-gap"></span>`}</div>${last ? "" : breakRow(p)}`; }).join("")}
          <button type="button" class="btn-sm sub-time-add" data-sub="addPeriod">＋ Add period</button>
        </div>
        <div class="sub-actions"><button type="button" class="btn-sm primary${draftChanged() ? " unsaved" : ""}" data-sub="saveTimes">💾 Save timings</button>
          <button type="button" class="btn-sm" data-sub="defaultTimes">${timesSet === "SAT" ? "Same as Monday – Friday" : "Use default timings"}</button></div>
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>Master timetable</h3><button type="button" class="btn-sm danger" data-sub="resetTimetable">Reset to default</button></div>
        <div class="sub-row">
          <label class="field"><span>Day</span><select data-subchange="ttDay">${DAYS.map(d => `<option value="${d}"${d === ttDay ? " selected" : ""}>${DAY_NAMES[d]}</option>`).join("")}</select></label>
          <label class="field"><span>Teacher</span><select data-subchange="ttTeacher">${sorted().map(t => `<option${t === ttTeacher ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
        </div>
        <p class="hint">Write the class and subject for each period, e.g. <i>Class 9 (Science)</i>. Separate two classes with a comma. Leave empty for a free period.</p>
        <div class="sub-table-wrap"><table class="sub-table">
          <tr><th>Period</th><th>Class &amp; subject</th><th></th></tr>
          ${periodsFor(ttDay).map(p => `<tr><td><b>P-${p}</b><small>${ptime(p, ttDay)}</small></td>
            <td><input class="sub-input" data-ttp="${p}" value="${esc(tt(ttDay, ttTeacher, p).join(", "))}" placeholder="Free period"></td>
            <td><button type="button" class="btn-sm primary" data-sub="savePeriod" data-p="${p}">Save</button></td></tr>`).join("")}
        </table></div>
      </div>`;
  }

  // Teaching staff from the website (Principal + Faculty) who aren't in the arrangement list yet.
  // `content` is the site content loaded by admin.js.
  function staffNotInList() {
    const site = typeof content !== "undefined" && content ? content : {};
    const titled = n => n.split(/\s+/).map(w => (w === "MD" ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(" ");
    const have = new Set(teachers.map(t => t.toLowerCase()));
    // Teaching staff only: the Principal and the Faculty list. Administrative staff (assistant grade, peons, watchman) never take classes.
    const names = [site.principal || {}, ...(site.faculty || [])].map(x => (x.name || "").trim()).filter(Boolean)
      .map(n => (/^dr\.?\s/i.test(n) ? "Dr. " + titled(n.replace(/^dr\.?\s+/i, "")) : titled(n)));
    return [...new Set(names)].filter(n => !have.has(n.toLowerCase())).sort((a, b) => a.localeCompare(b));
  }

  function teachersHtml() {
    const fromStaff = staffNotInList();
    const periodsPerWeek = t => DAYS.reduce((n, dy) => n + scheduled(dy, t).length, 0);
    return `
      <div class="sub-card">
        <div class="sub-card-head"><h3>Add a teacher</h3></div>
        <p class="hint">When a new teacher joins, add them here, then enter their periods in the <b>Timetable</b> tab so the generator knows when they are busy.</p>
        <div class="sub-row">
          <label class="field"><span>From the Principal &amp; faculty list</span>
            <select data-subchange="pickStaff"><option value="">${fromStaff.length ? "Choose a faculty member…" : "All faculty are already in the list"}</option>
              ${fromStaff.map(n => `<option>${esc(n)}</option>`).join("")}</select></label>
          <label class="field"><span>…or type a name</span><input class="sub-input" id="sub-new-teacher" placeholder="e.g. Ramesh Kumar Sahu" maxlength="60"></label>
        </div>
        <button type="button" class="btn-sm primary" data-sub="addTeacher" style="margin-top:10px">＋ Add teacher</button>
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>Teachers in the arrangement list <span class="sub-tag">${teachers.length}</span></h3></div>
        <div class="sub-tlist">
          ${sorted().map(t => { const n = periodsPerWeek(t);
            return `<div class="sub-trow"><b class="sub-tname">${esc(t)}</b>
              <span class="sub-tper">${n ? `${n} periods / week` : `<span class="sub-badge warn">No periods yet</span>`}</span>
              <span class="sub-tact"><button type="button" class="btn-sm" data-sub="editTeacherTT" data-t="${jsArg(t)}">🗓 Timetable</button><button type="button" class="btn-sm danger" data-sub="removeTeacher" data-t="${jsArg(t)}">Remove</button></span>
              <span class="sub-tinfo">
                <label><span>Wing</span><select data-subchange="wing" data-t="${jsArg(t)}">${Object.entries(WINGS).map(([k, l]) => `<option value="${k}"${wingOf(t) === k ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>
                <label><span>WhatsApp no.</span><input type="tel" inputmode="numeric" maxlength="14" placeholder="10-digit mobile" data-subchange="mobile" data-t="${jsArg(t)}" value="${esc(data.mobiles[t] || "")}"></label>
              </span></div>`; }).join("")}
        </div>
        <p class="hint"><b>Wing</b> decides which classes a teacher is preferred for as a substitute (Multipurpose = any class). The <b>WhatsApp number</b> lets the Daily tab open each teacher's chat with their periods. Removing a teacher takes them out of future arrangements; their past history stays.</p>
      </div>`;
  }

  function render() {
    root.innerHTML = `
      <div class="sub-tabs">
        ${[["daily", "📅 Daily arrangement"], ["history", "📊 History"], ["timetable", "🗓 Timetable"], ["full", "📋 Full timetable"], ["teachers", "👥 Teachers"]].map(([k, l]) =>
          `<button type="button" class="sub-tab${tab === k ? " active" : ""}" data-sub="tab" data-k="${k}">${l}</button>`).join("")}
      </div>
      ${{ daily: dailyHtml, history: historyHtml, timetable: timetableHtml, teachers: teachersHtml, full: () => `<div class="sub-card"><p class="hint">The finished timetable built from the Timetable tab, the same one teachers see on the website's <a href="/pages/timetable.html" target="_blank">School Timetable</a> page.</p><div id="tt-root"></div></div>` }[tab]()}`;
    if (tab === "full") TimetableView.mount(root.querySelector("#tt-root"), data);
  }

  // ---------- events ----------
  async function onClick(e) {
    const b = e.target.closest("[data-sub]");
    if (!b || !root.contains(b)) return;
    const a = b.dataset.sub, t = b.dataset.t ? JSON.parse(b.dataset.t) : null, p = Number(b.dataset.p);
    if (a === "tab") { tab = b.dataset.k; return render(); }
    if (a === "absent") {
      if (absentSet.has(t)) { absentSet.delete(t); availSet.add(t); }
      else { absentSet.add(t); availSet.delete(t); absentPeriods[t] = new Set(ANY_PERIOD); }
      syncPlan();
    }
    if (a === "absentPeriod") { const s = absentPeriods[t] = absentPeriods[t] || new Set(ANY_PERIOD); s.has(p) ? s.delete(p) : s.add(p); syncPlan(); }
    if (a === "unassign") {
      const i = plan[Number(b.dataset.i)];
      toast(`${i.assignedTeacher} removed from P-${i.period}, ${i.classDesc} for ${i.absentTeacher}.`);
      (i.group ? plan.filter(x => x.group === i.group) : [i]).forEach(x => { x.assignedTeacher = ""; x.note = ""; x.manual = true; });
    }
    if (a === "autoAssign") { const left = autoAssign(true); if (left) toast(`${left} period(s) have no free teacher — merge class.`, true); }
    if (a === "clearAssign") plan.forEach(i => { if (!i.sports) { i.assignedTeacher = ""; i.note = ""; i.manual = true; } });
    // Half-day presets for an absent teacher
    if (a === "absAll" || a === "absAfter3") {
      absentPeriods[t] = a === "absAll" ? new Set(ANY_PERIOD) : new Set(ANY_PERIOD.filter(x => x >= 4));
      syncPlan(); toast(a === "absAll" ? `${t}: all periods need a substitute.` : `${t}: half day — only P-4 onwards need a substitute.`);
    }
    if (a === "freeToggle") { freeOpen = !freeOpen; return; } // the <details> opens/closes by itself
    // Untick a present teacher's free period (office duty…): they are taken out of any slot there and it is refilled
    if (a === "blockPeriod") {
      const set = blockedPeriods[t] = blockedPeriods[t] || new Set();
      if (set.has(p)) set.delete(p);
      else {
        set.add(p);
        plan.forEach(i => { if (i.period === p && i.assignedTeacher === t && !i.note.startsWith("Merged")) { i.assignedTeacher = ""; i.note = ""; i.manual = false; } });
        autoAssign(false);
      }
    }
    if (a === "docx") return downloadDocx();
    if (a === "clearAbsent") { resetDaily(); }
    if (a === "resetDay") {
      if (data.published[date]) {
        if (!confirm(`Reset the arrangement for ${date}? It is published, so it will also be removed from the teachers' page (they will see the previous day's until you publish a new one).`)) return;
        return unpublish(date, false);
      }
      resetDaily(); toast("Cleared — start fresh for this day.");
    }
    if (a === "allAvail") { teachers.forEach(x => { if (!absentSet.has(x)) availSet.add(x); }); plan = []; }
    if (a === "noneAvail") { availSet.clear(); plan = []; }
    if (a === "publish") return saveAndPublish();
    if (a === "unpublish") return unpublish(b.dataset.d);
    if (a === "preview") return openPreview();
    if (a === "viewDay") return openPreview(b.dataset.d);
    if (a === "whatsapp") return window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(whatsappText()), "_blank");
    if (a === "copy") {
      try { await navigator.clipboard.writeText(whatsappText()); toast("Copied — paste it in WhatsApp."); }
      catch { prompt("Copy this text:", whatsappText()); }
      return;
    }
    if (a === "print") return printPlan();
    if (a === "resetHistory") {
      if (!confirm("Start a new month? Every teacher's arrangement count goes back to 0 (last duty dates are kept).")) return;
      teachers.forEach(x => { data.history[x].count = 0; });
      data.savedDays = {};
      if (await save("Counts reset for the new month.")) render();
      return;
    }
    if (a === "resetTimetable") {
      if (!confirm("Reset the master timetable to the default 2026-27 timetable? Your edits will be lost.")) return;
      data.timetable = buildDefaultTimetable();
      data.periodTimesSat = { ...PERIOD_TIMES_SAT };
      data.periodBreaksSat = { ...PERIOD_BREAKS_SAT };
      if (await save("Timetable reset to default.")) render();
      return;
    }
    if (a === "addTeacher") {
      const name = (root.querySelector("#sub-new-teacher").value || "").trim().replace(/\s+/g, " ");
      if (!name) return toast("Choose a staff member or type a name first.", true);
      if (teachers.some(t => t.toLowerCase() === name.toLowerCase())) return toast(`${name} is already in the list.`, true);
      teachers.push(name);
      DAYS.forEach(dy => { data.timetable[dy][name] = data.timetable[dy][name] || Object.fromEntries(ALL_PERIODS.map(p => [p, []])); });
      data.history[name] = data.history[name] || { count: 0, lastDate: "", lastPeriods: [] };
      data.wings[name] = data.wings[name] || "multi";
      availSet.add(name);
      if (await save(`${name} added. Now set their periods in the Timetable tab.`)) { ttTeacher = name; render(); }
      return;
    }
    if (a === "removeTeacher") {
      if (!confirm(`Remove ${t} from the arrangement list? They won't be given arrangements any more. Past history is kept.`)) return;
      teachers.splice(teachers.indexOf(t), 1);
      absentSet.delete(t); availSet.delete(t); plan = [];
      if (ttTeacher === t) ttTeacher = sorted()[0] || "";
      if (await save(`${t} removed from the arrangement list.`)) render();
      return;
    }
    if (a === "saveNote") {
      data.timetableNote = root.querySelector("#sub-tt-note").value.split("\n").map(l => l.trim()).filter(Boolean).join("\n");
      if (await save(data.timetableNote ? "Timetable heading saved." : "Timetable heading removed.")) render();
      return;
    }
    if (a === "timesSet") {
      if (timesDraft && draftChanged() && !confirm("You have unsaved timing changes. Switch anyway and discard them?")) return;
      timesSet = b.dataset.k; timesDraft = null; breaksDraft = null; return render();
    }
    if (a === "addPeriod") { const d = draft(), end = d.length ? d.at(-1)[1] : "10:00"; d.push([end, addMin(end, 40)]); return render(); }
    if (a === "delPeriod") {
      const d = draft(), p = d.length, days = timesSet === "SAT" ? ["SAT"] : DAYS.filter(x => x !== "SAT" || !data.periodTimesSat);
      const busy = teachers.filter(t => days.some(dy => tt(dy, t, p).length));
      if (busy.length && !confirm(`P-${p} has classes for ${busy.length} teacher(s) (${busy.slice(0, 3).join(", ")}${busy.length > 3 ? "…" : ""}). Remove the period anyway? Their entries are kept but hidden until the period is added back.`)) return;
      d.pop(); Object.keys(bdraft()).forEach(k => { if (Number(k) >= d.length) delete bdraft()[k]; }); return render();
    }
    if (a === "addBreak") {
      const k = Number(b.dataset.k), d = draft(), start = d[k - 1][1], next = d[k][0];
      bdraft()[k] = [start, next > start ? next : addMin(start, 30), "Lunch"]; return render();
    }
    if (a === "delBreak") { delete bdraft()[b.dataset.k]; return render();
    }
    if (a === "saveTimes" || a === "defaultTimes") {
      const sat = timesSet === "SAT";
      let times = null, breaks = null;
      if (a === "defaultTimes") {
        if (!confirm(sat ? "Make Saturday use the Monday – Friday timings again?" : "Go back to the default Monday – Friday timings?")) return;
        if (!sat) { times = { ...PERIOD_TIMES }; breaks = { ...PERIOD_BREAKS }; }
      } else {
        times = {};
        for (const [k, [s0, e0]] of draft().entries()) {
          const p = k + 1;
          if (!s0 || !e0) return toast(`Enter both times for P-${p}.`, true);
          if (s0 >= e0) return toast(`P-${p} must end after it starts.`, true);
          times[p] = `${fromInput(s0)} - ${fromInput(e0)}`;
        }
        breaks = {};
        for (const [k, [s0, e0, label]] of Object.entries(bdraft())) {
          if (!s0 || !e0 || s0 >= e0) return toast(`Check the times of the break after P-${k}.`, true);
          breaks[k] = { time: `${fromInput(s0)} - ${fromInput(e0)}`, label: (label || "").trim() || "Break" };
        }
      }
      timesDraft = null; breaksDraft = null;
      if (sat) {
        if (times) { data.periodTimesSat = times; data.periodBreaksSat = breaks; } else { delete data.periodTimesSat; delete data.periodBreaksSat; }
      } else { data.periodTimes = times; data.periodBreaks = breaks; }
      // Keep today's and later published lists in step with the new times
      const today = isoDate(new Date());
      Object.keys(data.published).filter(d => d >= today).forEach(d => { const x = data.published[d]; x.plan.forEach(i => { i.time = ptime(i.period, x.day); }); });
      const what = sat ? "Saturday" : "Monday – Friday";
      if (await save(a === "defaultTimes" ? (sat ? "Saturday now uses the Monday – Friday timings." : "Default timings restored.") : `${what} timings saved.`)) render();
      return;
    }
    if (a === "editTeacherTT") { ttTeacher = t; tab = "timetable"; return render(); }
    if (a === "savePeriod") {
      const v = root.querySelector(`[data-ttp="${p}"]`).value.trim();
      data.timetable[ttDay][ttTeacher][p] = v ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
      if (await save(`Saved P-${p} for ${ttTeacher} (${DAY_NAMES[ttDay]}).`)) render();
      return;
    }
    render();
  }

  // Typing in a timetable period or a timing turns its Save button yellow until it is saved.
  function onInput(e) {
    const el = e.target;
    if (el.dataset.ttp) {
      const p = Number(el.dataset.ttp);
      root.querySelector(`[data-sub="savePeriod"][data-p="${p}"]`)?.classList.toggle("unsaved", el.value.trim() !== tt(ttDay, ttTeacher, p).join(", "));
    }
    if (el.dataset.bt) bdraft()[el.dataset.bt][Number(el.dataset.end)] = el.value;
    if (el.dataset.bl) bdraft()[el.dataset.bl][2] = el.value;
    if (el.dataset.pt || el.dataset.bt || el.dataset.bl) {
      if (el.dataset.pt) draft()[Number(el.dataset.pt) - 1][Number(el.dataset.end)] = el.value;
      root.querySelector('[data-sub="saveTimes"]')?.classList.toggle("unsaved", draftChanged());
    }
  }

  async function saveTeacherInfo(k, t, v) {
    if (k === "wing") { data.wings[t] = v; if (await save(`${t}: ${WINGS[v]}.`)) render(); return; }
    const m = v.replace(/\D/g, "");
    if (m && m.length !== 10) { toast("Enter a 10-digit mobile number (or leave it empty).", true); return render(); }
    if (m) data.mobiles[t] = m; else delete data.mobiles[t];
    if (await save(m ? `${t}'s WhatsApp number saved.` : `${t}'s number removed.`)) render();
  }

  function onChange(e) {
    const k = e.target.dataset.subchange;
    if (!k || !root.contains(e.target)) return;
    if (k === "date") { if (!e.target.value) return; loadDate(e.target.value); }
    if (k === "day") { day = e.target.value; plan = []; syncPlan(); }
    if (k === "assign") {
      const t = JSON.parse(e.target.dataset.t), p = Number(e.target.dataset.p), cls = e.target.dataset.c, v = e.target.value;
      const set = absentPeriods[t] = absentPeriods[t] || new Set(ANY_PERIOD);
      if (v === "__covered") { set.delete(p); syncPlan(false); toast(`P-${p} of ${t} marked as already covered.`); }
      else {
        if (!set.has(p)) { set.add(p); syncPlan(false); }
        const slot = plan.find(i => slotKey(i) === slotKey({ absentTeacher: t, period: p, classDesc: cls }));
        if (slot) {
          const co = classNo(cls) >= 11 ? coTeachers(slot) : [];
          (slot.group ? plan.filter(x => x.group === slot.group) : [slot]).forEach(x => {
            x.assignedTeacher = v; x.manual = true;
            x.note = !v ? "" : co.includes(v) && !absentSet.has(v) ? `Merged with ${subjectOf(tt(day, v, p).find(e => classNo(e) === classNo(cls)))} class` : slot.group ? groupNote(slot.group) : "";
          });
        }
        toast(v ? `${v} assigned to P-${p}, ${cls} for ${t}.` : `P-${p}, ${cls} for ${t} — not assigned.`);
      }
    }
    if (k === "ttDay") ttDay = e.target.value;
    if (k === "ttTeacher") ttTeacher = e.target.value;
    if (k === "pickStaff") { root.querySelector("#sub-new-teacher").value = e.target.value; return; }
    if (k === "wing" || k === "mobile") return saveTeacherInfo(k, JSON.parse(e.target.dataset.t), e.target.value.trim());
    render();
  }

  function printPlan() {
    const c = chartParts(), w = window.open("", "_blank");
    if (!w) return toast("Please allow pop-ups to print.", true);
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Arrangement Class ${esc(date)} - SAGES Sonhat</title>
      <style>body{font-family:Arial,sans-serif;padding:18px;color:#111}h1{font-size:17px;margin:0;text-align:center;color:#0b3d91}h2{font-size:14px;margin:4px 0 10px;text-align:center}
      .absent{border:1.5px solid #b71c1c;background:#fdecea;padding:7px 10px;margin-bottom:10px;font-size:13px}.absent b{color:#b71c1c}
      table{width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:10px}th,td{border:1px solid #8a9bb8;padding:5px 7px;text-align:left;vertical-align:top}th{background:#0b3d91;color:#fff}
      .note{font-weight:bold;color:#8a5300;margin:4px 0}h3{font-size:14px;margin:14px 0 6px;color:#0b3d91}@page{margin:10mm}</style></head><body>
      <h1>Swami Atmanand Govt. English Medium School, Sonhat</h1><h2>Arrangement Class — ${esc(niceDate(date))}</h2>
      <div class="absent"><b>Absent Teachers:</b> ${c.absent.map(esc).join(", ") || "None"}</div>
      <table><tr><th>Period &amp; Time</th><th>Class &amp; Subject</th><th>Absent Teacher</th><th>Assigned Teacher</th></tr>
      ${c.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</table>
      ${c.notes.map(n => `<p class="note">🏃 ${esc(n)}</p>`).join("")}
      <h3>Present Teachers Workload Summary</h3>
      <table><tr><th>Teacher</th><th>Regular</th><th>Substitution</th><th>Total</th></tr>
      ${c.summary.map(r => `<tr><td>${esc(r.teacher)}</td><td>${r.regular}</td><td>${r.subs.length ? `${r.subs.length} (${r.subs.map(p => `P-${p}`).join(", ")})` : "—"}</td><td><b>${r.total}</b></td></tr>`).join("")}</table>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  async function mount(el) {
    root = el;
    root.innerHTML = `<p class="sub-muted">Loading arrangement data…</p>`;
    if (!data) {
      const res = await fetch(`/api/substitution?t=${Date.now()}`, { cache: "no-store" }).catch(() => null);
      data = normalize(res?.ok ? await res.json() : null);
      ttTeacher = sorted()[0] || "";
      loadDate(isoDate(new Date()));
    }
    render();
    if (!el.dataset.bound) {
      el.dataset.bound = "1";
      el.addEventListener("click", onClick);
      el.addEventListener("change", onChange);
      el.addEventListener("input", onInput);
      el.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.(".sub-click")) e.target.click(); });
    }
  }

  return { mount };
})();
