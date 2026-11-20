// Arrangement / Substitution tool for the admin panel.
// Ported from the school's Smart Substitution Manager (index-v12.html): same generation rules,
// but data is saved to the website (/api/substitution) and each day's list can be published for teachers.
// Needs js/substitution-defaults.js (PERIOD_TIMES, TEACHERS, buildDefaultTimetable) and admin.js's toast().

window.SubstitutionAdmin = (() => {
  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
  const ALL_PERIODS = [1, 2, 3, 4, 5, 6, 7];
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
  let ttDay = "MON", ttTeacher = "";

  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
    if (!d.timetable || typeof d.timetable !== "object") d.timetable = fresh;
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
    return d;
  }

  async function save(message) {
    const res = await fetch("/api/substitution", {
      method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
    }).catch(() => null);
    if (res?.status === 401) { toast("Session expired — log in again, then save.", true); return false; }
    if (!res?.ok) { toast("Could not save. Please try again.", true); return false; }
    toast(message);
    return true;
  }

  const tt = (dy, t, p) => data.timetable[dy][t][p] || [];
  const scheduled = (dy, t) => ALL_PERIODS.filter(p => tt(dy, t, p).length);
  const freePeriods = (dy, t) => ALL_PERIODS.filter(p => !tt(dy, t, p).length);

  function resetDaily() {
    absentSet = new Set(); availSet = new Set(teachers); absentPeriods = {}; blockedPeriods = {}; plan = [];
  }

  // ---------- generation (same rules as the original app) ----------
  function createsFourConsecutive(busy, candidate) {
    const s = new Set(busy); s.add(candidate);
    let streak = 0;
    for (const p of ALL_PERIODS) { streak = s.has(p) ? streak + 1 : 0; if (streak >= 4) return true; }
    return false;
  }

  function generate() {
    if (!absentSet.size) return toast("First mark the teachers who are absent today.", true);
    const vacant = [];
    absentSet.forEach(t => {
      const needed = absentPeriods[t] || new Set(ALL_PERIODS);
      ALL_PERIODS.forEach(p => { if (needed.has(p)) tt(day, t, p).forEach(cls => vacant.push({ period: p, classDesc: cls, absentTeacher: t })); });
    });
    vacant.sort((a, b) => a.period - b.period);
    if (!vacant.length) return toast("The absent teachers have no regular periods on this day.", true);

    const busy = {};
    teachers.forEach(t => { busy[t] = new Set(scheduled(day, t)); });
    const prevDate = previousWorkingDate(date);
    const prevPlan = data.savedDays[prevDate] || null;
    const todayPlan = data.savedDays[date] || {};
    const prevDayPeriods = t => {
      if (prevPlan) return prevPlan[t]?.length ? prevPlan[t] : null;
      const h = data.history[t];
      return h.lastDate === prevDate && h.lastPeriods.length ? h.lastPeriods : null;
    };
    // Monthly count excluding today's already-saved list, so regenerating today stays fair
    const countExclToday = t => data.history[t].count - (todayPlan[t] || []).length;

    plan = vacant.map(slot => {
      const p = slot.period;
      const candidates = [...availSet].filter(t => !absentSet.has(t) && !busy[t].has(p) && !blockedPeriods[t]?.has(p));
      if (!candidates.length) return { ...slot, assignedTeacher: "", status: "No free teacher — merge class", badge: "danger" };
      candidates.sort((a, b) => {
        const fourA = createsFourConsecutive(busy[a], p) ? 1 : 0, fourB = createsFourConsecutive(busy[b], p) ? 1 : 0;
        if (fourA !== fourB) return fourA - fourB;
        // Avoid whoever substituted on the previous working day (more so for the same period)
        const prevA = prevDayPeriods(a), prevB = prevDayPeriods(b);
        const repA = prevA ? (prevA.includes(p) ? 2 : 1) : 0, repB = prevB ? (prevB.includes(p) ? 2 : 1) : 0;
        if (repA !== repB) return repA - repB;
        if (busy[a].size !== busy[b].size) return busy[a].size - busy[b].size;
        return countExclToday(a) - countExclToday(b);
      });
      const chosen = candidates[0];
      const four = createsFourConsecutive(busy[chosen], p);
      busy[chosen].add(p);
      return { ...slot, assignedTeacher: chosen,
        status: four ? "Unavoidable (4th period in a row)" : `Total periods today: ${busy[chosen].size}`,
        badge: four ? "warn" : "ok" };
    });
    render();
    root.querySelector("#sub-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveAndPublish() {
    if (!plan.length) return;
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
      absent: [...absentSet].map(t => ({ teacher: t, periods: scheduled(day, t).filter(p => (absentPeriods[t] || new Set(ALL_PERIODS)).has(p)) })),
      present: teachers.filter(t => !absentSet.has(t)),
      plan: plan.map(i => ({ period: i.period, time: PERIOD_TIMES[i.period], classDesc: i.classDesc, absentTeacher: i.absentTeacher, assignedTeacher: i.assignedTeacher })),
      publishedAt: new Date().toISOString(),
    };
    if (await save(old ? "Arrangement updated and re-published." : "Saved and published — teachers can now see it.")) render();
  }

  async function unpublish(d) {
    if (!confirm(`Remove the published arrangement for ${d}? Teachers will no longer see it, and its counts will be taken off the history.`)) return;
    const old = data.savedDays[d] || {};
    Object.keys(old).forEach(t => { if (data.history[t]) data.history[t].count = Math.max(0, data.history[t].count - old[t].length); });
    delete data.savedDays[d];
    delete data.published[d];
    teachers.forEach(t => {
      const h = data.history[t];
      const dates = Object.keys(data.savedDays).filter(x => data.savedDays[x][t]?.length).sort();
      h.lastDate = dates.at(-1) || ""; h.lastPeriods = dates.length ? data.savedDays[h.lastDate][t] : [];
    });
    if (await save("Removed.")) render();
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
    const avail = sorted().filter(t => availSet.has(t) && !absentSet.has(t));
    const absentRows = absent.map(t => {
      const sch = scheduled(day, t);
      const needed = absentPeriods[t] || new Set(ALL_PERIODS);
      const pills = sch.length ? sch.map(p => `<button type="button" class="sub-pill ${needed.has(p) ? "need" : "off"}" data-sub="absentPeriod" data-t="${jsArg(t)}" data-p="${p}" title="${esc(tt(day, t, p).join(" / "))} (${PERIOD_TIMES[p]})">${needed.has(p) ? "☑" : "☐"} P-${p}</button>`).join("")
        : `<span class="sub-muted">No regular class today</span>`;
      return `<div class="sub-slot absent"><b>${esc(t)}</b><div class="sub-pills">${pills}</div></div>`;
    }).join("");
    const freeRows = avail.map(t => {
      const free = freePeriods(day, t);
      const pills = free.length ? free.map(p => { const blocked = blockedPeriods[t]?.has(p);
        return `<button type="button" class="sub-pill ${blocked ? "blocked" : "free"}" data-sub="blockPeriod" data-t="${jsArg(t)}" data-p="${p}" title="${PERIOD_TIMES[p]}">${blocked ? "✕" : "✓"} P-${p}</button>`; }).join("")
        : `<span class="sub-muted">No free period today</span>`;
      return `<div class="sub-slot"><b>${esc(t)}</b><div class="sub-pills">${pills}</div></div>`;
    }).join("");
    const result = plan.length ? `
      <div class="sub-card" id="sub-result">
        <div class="sub-card-head"><h3>Arrangement for ${esc(date)} (${DAY_NAMES[day]})</h3>${data.published[date] ? `<span class="sub-tag">Published</span>` : `<span class="sub-tag draft">Not published yet</span>`}</div>
        <div class="sub-table-wrap"><table class="sub-table">
          <tr><th>Period</th><th>Class &amp; subject</th><th>Absent teacher</th><th>Substitute</th><th>Note</th></tr>
          ${plan.map(i => `<tr><td><b>P-${i.period}</b><small>${PERIOD_TIMES[i.period]}</small></td><td>${esc(i.classDesc)}</td><td class="sub-abs">${esc(i.absentTeacher)}</td>
            <td class="sub-asg">${i.assignedTeacher ? esc(i.assignedTeacher) : "—"}</td><td><span class="sub-badge ${i.badge}">${esc(i.status)}</span></td></tr>`).join("")}
        </table></div>
        <div class="sub-actions">
          <button type="button" class="btn-sm primary" data-sub="publish">💾 Save &amp; Publish for teachers</button>
          <button type="button" class="btn-sm wa" data-sub="whatsapp">📲 WhatsApp</button>
          <button type="button" class="btn-sm" data-sub="copy">📋 Copy text</button>
          <button type="button" class="btn-sm" data-sub="print">🖨 Print</button>
        </div>
        <p class="hint">Publishing saves each substitute's count for fairness and shows this list on the website's <a href="/pages/arrangement.html" target="_blank">Daily Arrangement</a> page.</p>
      </div>` : "";
    return `
      <div class="sub-card">
        <div class="sub-row">
          <label class="field"><span>Date</span><input type="date" data-subchange="date" value="${esc(date)}"></label>
          <label class="field"><span>Timetable day</span><select data-subchange="day">${DAYS.map(d => `<option value="${d}"${d === day ? " selected" : ""}>${DAY_NAMES[d]}</option>`).join("")}</select></label>
        </div>
        ${data.published[date] ? `<p class="sub-note">✔ An arrangement for this date is already published. Generating again and publishing will replace it.</p>` : ""}
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>1. Absent teachers</h3><button type="button" class="btn-sm" data-sub="clearAbsent">Clear</button></div>
        ${absent.length ? `<p class="hint">Their periods that need a substitute are ticked. Untick any period already covered.</p><div class="sub-slots">${absentRows}</div>` : ""}
        <div class="sub-chips">${sorted().map(t => chip(absentSet.has(t) ? "absent-on" : "", "absent", absentSet.has(t) ? "☑" : "☐", t).replace('data-sub="absent"', `data-sub="absent" data-t="${jsArg(t)}"`)).join("")}</div>
      </div>
      <div class="sub-card">
        <div class="sub-card-head"><h3>2. Teachers available for substitution</h3><span><button type="button" class="btn-sm" data-sub="allAvail">All</button> <button type="button" class="btn-sm" data-sub="noneAvail">None</button></span></div>
        <div class="sub-chips">${sorted().map(t => { const ab = absentSet.has(t), av = availSet.has(t) && !ab;
          return chip(ab ? "disabled" : av ? "avail-on" : "", "avail", av ? "✓" : "☐", t, ab).replace('data-sub="avail"', `data-sub="avail" data-t="${jsArg(t)}"`); }).join("")}</div>
        ${avail.length ? `<p class="hint">Free periods of the selected teachers. Tap a period to block it (✕) if the teacher is busy with other work.</p><div class="sub-slots">${freeRows}</div>` : ""}
      </div>
      <button type="button" class="sub-generate" data-sub="generate">⚡ Generate arrangement</button>
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

  function timetableHtml() {
    return `
      <div class="sub-card">
        <div class="sub-card-head"><h3>Master timetable</h3><button type="button" class="btn-sm danger" data-sub="resetTimetable">Reset to default</button></div>
        <div class="sub-row">
          <label class="field"><span>Day</span><select data-subchange="ttDay">${DAYS.map(d => `<option value="${d}"${d === ttDay ? " selected" : ""}>${DAY_NAMES[d]}</option>`).join("")}</select></label>
          <label class="field"><span>Teacher</span><select data-subchange="ttTeacher">${sorted().map(t => `<option${t === ttTeacher ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
        </div>
        <p class="hint">Write the class and subject for each period, e.g. <i>Class 9 (Science)</i>. Separate two classes with a comma. Leave empty for a free period.</p>
        <div class="sub-table-wrap"><table class="sub-table">
          <tr><th>Period</th><th>Class &amp; subject</th><th></th></tr>
          ${ALL_PERIODS.map(p => `<tr><td><b>P-${p}</b><small>${PERIOD_TIMES[p]}</small></td>
            <td><input class="sub-input" data-ttp="${p}" value="${esc(tt(ttDay, ttTeacher, p).join(", "))}" placeholder="Free period"></td>
            <td><button type="button" class="btn-sm primary" data-sub="savePeriod" data-p="${p}">Save</button></td></tr>`).join("")}
        </table></div>
      </div>`;
  }

  // Staff from the website (Faculty + Administrative Staff + Principal) who aren't in the arrangement list yet.
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
        ${[["daily", "📅 Daily arrangement"], ["history", "📊 History"], ["timetable", "🗓 Timetable"], ["teachers", "👥 Teachers"]].map(([k, l]) =>
          `<button type="button" class="sub-tab${tab === k ? " active" : ""}" data-sub="tab" data-k="${k}">${l}</button>`).join("")}
      </div>
      ${{ daily: dailyHtml, history: historyHtml, timetable: timetableHtml, teachers: teachersHtml }[tab]()}`;
  }

  // ---------- events ----------
  async function onClick(e) {
    const b = e.target.closest("[data-sub]");
    if (!b || !root.contains(b)) return;
    const a = b.dataset.sub, t = b.dataset.t ? JSON.parse(b.dataset.t) : null, p = Number(b.dataset.p);
    if (a === "tab") { tab = b.dataset.k; return render(); }
    if (a === "absent") {
      if (absentSet.has(t)) { absentSet.delete(t); availSet.add(t); }
      else { absentSet.add(t); availSet.delete(t); absentPeriods[t] = new Set(ALL_PERIODS); }
      plan = [];
    }
    if (a === "absentPeriod") { const s = absentPeriods[t] = absentPeriods[t] || new Set(ALL_PERIODS); s.has(p) ? s.delete(p) : s.add(p); plan = []; }
    if (a === "avail") { availSet.has(t) ? availSet.delete(t) : availSet.add(t); plan = []; }
    if (a === "blockPeriod") { const s = blockedPeriods[t] = blockedPeriods[t] || new Set(); s.has(p) ? s.delete(p) : s.add(p); plan = []; }
    if (a === "clearAbsent") { resetDaily(); }
    if (a === "allAvail") { teachers.forEach(x => { if (!absentSet.has(x)) availSet.add(x); }); plan = []; }
    if (a === "noneAvail") { availSet.clear(); plan = []; }
    if (a === "generate") return generate();
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
    if (a === "editTeacherTT") { ttTeacher = t; tab = "timetable"; return render(); }
    if (a === "savePeriod") {
      const v = root.querySelector(`[data-ttp="${p}"]`).value.trim();
      data.timetable[ttDay][ttTeacher][p] = v ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
      if (await save(`Saved P-${p} for ${ttTeacher} (${DAY_NAMES[ttDay]}).`)) render();
      return;
    }
    render();
  }

  function onChange(e) {
    const k = e.target.dataset.subchange;
    if (!k || !root.contains(e.target)) return;
    if (k === "date") { date = e.target.value; day = dayOf(date); plan = []; }
    if (k === "day") { day = e.target.value; plan = []; }
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
      ${plan.map(i => `<tr><td>P-${i.period}</td><td>${PERIOD_TIMES[i.period]}</td><td>${esc(i.classDesc)}</td><td>${esc(i.absentTeacher)}</td><td>${esc(i.assignedTeacher || "No free teacher (merge class)")}</td></tr>`).join("")}
      </table><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  async function mount(el) {
    root = el;
    root.innerHTML = `<p class="sub-muted">Loading arrangement data…</p>`;
    if (!data) {
      const res = await fetch(`/api/substitution?t=${Date.now()}`, { cache: "no-store" }).catch(() => null);
      data = normalize(res?.ok ? await res.json() : null);
      availSet = new Set(teachers);
      ttTeacher = sorted()[0] || "";
      date = isoDate(new Date()); day = dayOf(date);
    }
    render();
    if (!el.dataset.bound) {
      el.dataset.bound = "1";
      el.addEventListener("click", onClick);
      el.addEventListener("change", onChange);
    }
  }

  return { mount };
})();
