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
  const niceDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
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
    if (pub) plan = pub.plan.map(i => ({ period: i.period, classDesc: i.classDesc, absentTeacher: i.absentTeacher, assignedTeacher: i.assignedTeacher || "" }));
    else { carriedFrom = prev; syncPlan(); }
  }

  // ---------- generation (same rules as the original app) ----------
  function createsFourConsecutive(busy, candidate) {
    const s = new Set(busy); s.add(candidate);
    let streak = 0;
    for (const p of periodsFor(day)) { streak = s.has(p) ? streak + 1 : 0; if (streak >= 4) return true; }
    return false;
  }

  // ---------- the arrangement: one slot per class period of an absent teacher ----------
  const slotKey = i => `${i.absentTeacher}|${i.period}|${i.classDesc}`;

  // Rebuild the slots from the current absences, keeping substitutes already chosen. New slots are filled
  // automatically when `fillNew` is set (the admin can change or remove any of them).
  function syncPlan(fillNew = true) {
    const old = new Map(plan.map(i => [slotKey(i), i.assignedTeacher]));
    const slots = [];
    [...absentSet].forEach(t => {
      const needed = absentPeriods[t] || new Set(ANY_PERIOD);
      periodsFor(day).forEach(p => { if (needed.has(p)) tt(day, t, p).forEach(cls => slots.push({ period: p, classDesc: cls, absentTeacher: t })); });
    });
    slots.sort((x, y) => x.period - y.period || x.absentTeacher.localeCompare(y.absentTeacher));
    const fresh = [];
    plan = slots.map((sl, i) => {
      const k = slotKey(sl);
      if (!old.has(k)) fresh.push(i);
      const keep = old.get(k);
      return { ...sl, assignedTeacher: keep && !absentSet.has(keep) ? keep : "" };
    });
    if (fillNew && fresh.length) autoAssign(fresh);
  }

  // Periods each teacher is busy with: own classes plus substitutions in the plan (optionally ignoring one slot)
  function busyMap(skip = -1) {
    const busy = {};
    teachers.forEach(t => { busy[t] = new Set(scheduled(day, t)); });
    plan.forEach((i, k) => { if (k !== skip && i.assignedTeacher && busy[i.assignedTeacher]) busy[i.assignedTeacher].add(i.period); });
    return busy;
  }

  // Free, present teachers for a slot, best first (same fairness rules as the original app):
  // avoid a 4th period in a row, avoid whoever substituted on the previous working day, then fewer periods today, then fewer this month.
  const candidatesFor = (k, busy = busyMap(k)) => candidatesAt(plan[k].period, busy);
  function candidatesAt(p, busy = busyMap()) {
    const prevDate = previousWorkingDate(date), prevPlan = data.savedDays[prevDate] || null, todayPlan = data.savedDays[date] || {};
    const prevDayPeriods = t => {
      if (prevPlan) return prevPlan[t]?.length ? prevPlan[t] : null;
      const h = data.history[t];
      return h && h.lastDate === prevDate && h.lastPeriods.length ? h.lastPeriods : null;
    };
    const countExclToday = t => (data.history[t]?.count || 0) - (todayPlan[t] || []).length;
    return teachers.filter(t => !absentSet.has(t) && !busy[t].has(p)).sort((a, b) => {
      const fourA = createsFourConsecutive(busy[a], p) ? 1 : 0, fourB = createsFourConsecutive(busy[b], p) ? 1 : 0;
      if (fourA !== fourB) return fourA - fourB;
      const prevA = prevDayPeriods(a), prevB = prevDayPeriods(b);
      const repA = prevA ? (prevA.includes(p) ? 2 : 1) : 0, repB = prevB ? (prevB.includes(p) ? 2 : 1) : 0;
      if (repA !== repB) return repA - repB;
      if (busy[a].size !== busy[b].size) return busy[a].size - busy[b].size;
      return countExclToday(a) - countExclToday(b) || a.localeCompare(b);
    });
  }

  // Give each listed (or every empty) slot the best free teacher, in period order
  function autoAssign(only = null) {
    const idx = (only || plan.map((_, k) => k).filter(k => !plan[k].assignedTeacher)).sort((x, y) => plan[x].period - plan[y].period);
    idx.forEach(k => { plan[k].assignedTeacher = candidatesFor(k)[0] || ""; });
    return idx.filter(k => !plan[k].assignedTeacher).length;
  }

  // Note shown next to a slot
  function slotStatus(k, busy = busyMap(k)) {
    const t = plan[k].assignedTeacher;
    if (!t) return { text: "Not assigned — merge class", badge: "danger" };
    if (createsFourConsecutive(busy[t] || new Set(), plan[k].period)) return { text: "4th period in a row", badge: "warn" };
    return null; // fine — nothing to flag
  }

  async function saveAndPublish() {
    if (!plan.length) return;
    const empty = plan.filter(i => !i.assignedTeacher).length;
    if (empty && !confirm(`${empty} period(s) have no substitute and will show as "merge class". Publish anyway?`)) return;
    const old = data.savedDays[date];
    if (old && !confirm(`An arrangement for ${date} is already published. Replace it with this one?`)) return;
    const perTeacher = {};
    plan.forEach(i => { if (i.assignedTeacher) (perTeacher[i.assignedTeacher] = perTeacher[i.assignedTeacher] || []).push(i.period); });
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
    data.published[date] = {
      day,
      absent: [...absentSet].map(t => ({ teacher: t, periods: scheduled(day, t).filter(p => (absentPeriods[t] || new Set(ANY_PERIOD)).has(p)) })),
      present: teachers.filter(t => !absentSet.has(t)),
      plan: plan.map(i => ({ period: i.period, time: ptime(i.period, day), classDesc: i.classDesc, absentTeacher: i.absentTeacher, assignedTeacher: i.assignedTeacher })),
      publishedAt: new Date().toISOString(),
    };
    if (await save(old ? "Arrangement updated and re-published." : "Saved and published — teachers can now see it.")) render();
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

  function whatsappText() {
    let text = `*SAGES SONHAT - SUBSTITUTION LIST*\n📅 Date: ${date} (${day})\n----------------------\n`;
    plan.forEach(i => { text += `• *P-${i.period}* | ${i.classDesc}\n   Absent: ${i.absentTeacher} ➔ *${i.assignedTeacher || "No free teacher (merge class)"}*\n`; });
    return text + `----------------------\nFull list: ${location.origin}/pages/arrangement.html`;
  }

  // ---------- rendering ----------
  const chip = (cls, onclick, icon, label, disabled = false) =>
    `<button type="button" class="sub-chip ${cls}" ${disabled ? "disabled" : `data-sub="${onclick}"`}>${icon}<span>${esc(label)}</span></button>`;

  function dailyHtml() {
    const absent = sorted().filter(t => absentSet.has(t));
    // Under each absent teacher: one card per class period with a dropdown of present teachers free then
    const slotIndex = new Map(plan.map((i, k) => [slotKey(i), k]));
    const assigned = plan.filter(i => i.assignedTeacher).length;
    const absentBoxes = absent.map(t => {
      const needed = absentPeriods[t] || new Set(ANY_PERIOD);
      const cards = scheduled(day, t).flatMap(p => tt(day, t, p).map(cls => {
        const k = slotIndex.get(slotKey({ absentTeacher: t, period: p, classDesc: cls }));
        const on = needed.has(p) && k !== undefined, sub = on ? plan[k].assignedTeacher : "";
        const busy = on ? busyMap(k) : busyMap(), st = on ? slotStatus(k, busy) : null;
        const opts = [...new Set([...(sub ? [sub] : []), ...candidatesAt(p, busy)])];
        const attrs = `data-subchange="assign" data-t="${jsArg(t)}" data-p="${p}" data-c="${esc(cls)}"`;
        return `<div class="sub-pcard ${!on ? "is-covered" : sub ? "is-done" : "is-empty"}">
          <div class="sub-pcard-head"><b>P-${p}</b><small>${esc(ptime(p, day))}</small></div>
          <div class="sub-pcard-cls">${esc(cls)}</div>
          <div class="sub-pcard-pick">
            <select ${attrs} aria-label="Substitute for ${esc(t)}, P-${p}">
              <option value=""${on && !sub ? " selected" : ""}>— Not assigned —</option>
              ${opts.map(x => `<option value="${esc(x)}"${x === sub ? " selected" : ""}>${esc(x)} (${busy[x]?.size || 0})</option>`).join("")}
              <option value="__covered"${!on ? " selected" : ""}>✓ Already covered</option>
            </select>
            ${sub ? `<button type="button" class="sub-time-del" data-sub="unassign" data-i="${k}" title="Remove ${esc(sub)}" aria-label="Remove substitute">✕</button>` : ""}
          </div>
          ${st ? `<span class="sub-badge ${st.badge}">${esc(st.text)}</span>` : ""}
        </div>`;
      }));
      const toCover = plan.filter(i => i.absentTeacher === t).length;
      return `<div class="sub-group"><h4>${esc(t)} <small>absent · ${cards.length ? `${toCover} period${toCover === 1 ? "" : "s"} to cover` : "no class today"}</small>
          <button type="button" class="sub-x" data-sub="absent" data-t="${jsArg(t)}" title="Mark ${esc(t)} present again" aria-label="Mark present">✕</button></h4>
        ${cards.length ? `<div class="sub-pcards">${cards.join("")}</div>` : ""}</div>`;
    }).join("");
    const result = !absent.length ? "" : `
      <div class="sub-card" id="sub-result">
        <div class="sub-card-head"><h3>2. Review &amp; publish — ${esc(niceDate(date))}</h3>${plan.length ? (data.published[date] ? `<span class="sub-tag">Published</span>` : `<span class="sub-tag draft">Not published yet</span>`) : ""}</div>
        ${!plan.length ? `<p class="hint">No periods need a substitute.</p>` : `
          <div class="sub-arr-bar"><span><b>${plan.length}</b> periods to cover · <b class="ok">${assigned}</b> assigned${plan.length - assigned ? ` · <b class="bad">${plan.length - assigned}</b> not assigned` : ""}</span>
            <span><button type="button" class="btn-sm" data-sub="autoAssign">⚡ Fill empty periods</button> <button type="button" class="btn-sm" data-sub="clearAssign">Clear all</button></span></div>
          <div class="sub-table-wrap"><table class="sub-table sub-summary">
            <tr><th>Period</th><th>Class</th><th>Absent teacher</th><th>Substitute</th></tr>
            ${plan.map(i => `<tr class="${i.assignedTeacher ? "" : "unassigned"}"><td><b>P-${i.period}</b><small>${esc(ptime(i.period, day))}</small></td><td>${esc(i.classDesc)}</td>
              <td class="sub-abs">${esc(i.absentTeacher)}</td><td class="sub-asg">${i.assignedTeacher ? `→ ${esc(i.assignedTeacher)}` : "Not assigned — merge class"}</td></tr>`).join("")}
          </table></div>
          <div class="sub-actions">
            <button type="button" class="btn-sm primary" data-sub="publish">💾 Save &amp; Publish for teachers</button>
            <button type="button" class="btn-sm wa" data-sub="whatsapp">📲 WhatsApp</button>
            <button type="button" class="btn-sm" data-sub="copy">📋 Copy text</button>
            <button type="button" class="btn-sm" data-sub="print">🖨 Print</button>
          </div>
          <p class="hint">Publishing saves each substitute's count for fairness and shows this list on the website's <a href="/pages/arrangement.html" target="_blank">Daily Arrangement</a> page.</p>`}
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
        <p class="hint">Tap the teachers who are absent. For each of their periods, choose a present teacher from the list — it shows only teachers who are free in that period, with <b>(number)</b> = their periods today. A free teacher is suggested for you.</p>
        <div class="sub-chips">${sorted().map(t => {
          // Present teachers already given a substitution show their periods straight away
          const subs = plan.filter(i => i.assignedTeacher === t).map(i => i.period).sort((x, y) => x - y);
          return `<button type="button" class="sub-chip ${absentSet.has(t) ? "absent-on" : subs.length ? "has-sub" : ""}" data-sub="absent" data-t="${jsArg(t)}" title="${subs.length ? `Substituting: ${subs.map(p => `P-${p}`).join(", ")}` : ""}">${absentSet.has(t) ? "☑" : "☐"}<span>${esc(t)}</span>${subs.length ? `<em class="sub-chip-tag">${subs.map(p => `P-${p}`).join(", ")}</em>` : ""}</button>`;
        }).join("")}</div>
        ${absentBoxes}
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
        <div class="sub-card-head"><h3>Published arrangements</h3></div>
        ${pub.length ? `<div class="sub-table-wrap"><table class="sub-table"><tr><th>Date</th><th>Absent</th><th>Substitutions</th><th></th></tr>
          ${pub.map(d => { const x = data.published[d];
            return `<tr><td><b>${esc(d)}</b><small>${DAY_NAMES[x.day] || ""}</small></td><td>${x.absent.map(a => esc(a.teacher)).join(", ")}</td><td>${x.plan.length}</td>
              <td><button type="button" class="btn-sm danger" data-sub="unpublish" data-d="${esc(d)}">Remove</button></td></tr>`; }).join("")}
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
              <span class="sub-tact"><button type="button" class="btn-sm" data-sub="editTeacherTT" data-t="${jsArg(t)}">🗓 Timetable</button><button type="button" class="btn-sm danger" data-sub="removeTeacher" data-t="${jsArg(t)}">Remove</button></span></div>`; }).join("")}
        </div>
        <p class="hint">Removing a teacher takes them out of future arrangements. Their past history stays in the records.</p>
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
    if (a === "unassign") plan[Number(b.dataset.i)].assignedTeacher = "";
    if (a === "autoAssign") { const left = autoAssign(); if (left) toast(`${left} period(s) have no free teacher — merge class.`, true); }
    if (a === "clearAssign") plan.forEach(i => { i.assignedTeacher = ""; });
    if (a === "avail") { availSet.has(t) ? availSet.delete(t) : availSet.add(t); plan = []; }
    if (a === "blockPeriod") { const s = blockedPeriods[t] = blockedPeriods[t] || new Set(); s.has(p) ? s.delete(p) : s.add(p); plan = []; }
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

  function onChange(e) {
    const k = e.target.dataset.subchange;
    if (!k || !root.contains(e.target)) return;
    if (k === "date") { if (!e.target.value) return; loadDate(e.target.value); }
    if (k === "day") { day = e.target.value; plan = []; syncPlan(); }
    if (k === "assign") {
      const t = JSON.parse(e.target.dataset.t), p = Number(e.target.dataset.p), cls = e.target.dataset.c, v = e.target.value;
      const set = absentPeriods[t] = absentPeriods[t] || new Set(ANY_PERIOD);
      if (v === "__covered") { set.delete(p); syncPlan(false); }
      else {
        if (!set.has(p)) { set.add(p); syncPlan(false); }
        const slot = plan.find(i => slotKey(i) === slotKey({ absentTeacher: t, period: p, classDesc: cls }));
        if (slot) slot.assignedTeacher = v;
      }
    }
    if (k === "ttDay") ttDay = e.target.value;
    if (k === "ttTeacher") ttTeacher = e.target.value;
    if (k === "pickStaff") { root.querySelector("#sub-new-teacher").value = e.target.value; return; }
    render();
  }

  function printPlan() {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Substitution ${esc(date)}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:18px;margin:0}h2{font-size:14px;color:#555;margin:4px 0 14px}
      table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #999;padding:6px 8px;text-align:left}th{background:#eee}</style></head><body>
      <h1>Swami Atmanand Govt. English Medium School, Sonhat</h1><h2>Substitution Arrangement — ${esc(date)} (${DAY_NAMES[day]})</h2>
      <table><tr><th>Period</th><th>Time</th><th>Class &amp; subject</th><th>Absent teacher</th><th>Substitute</th></tr>
      ${plan.map(i => `<tr><td>P-${i.period}</td><td>${ptime(i.period, day)}</td><td>${esc(i.classDesc)}</td><td>${esc(i.absentTeacher)}</td><td>${esc(i.assignedTeacher || "No free teacher (merge class)")}</td></tr>`).join("")}
      </table><script>window.onload=()=>window.print()<\/script></body></html>`);
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
    }
  }

  return { mount };
})();
