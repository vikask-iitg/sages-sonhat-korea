// Daily Arrangement page: a read-only view of the substitution lists the admin publishes.
// Teachers see today's arrangement until 5 PM (India time), then the page resets until the next one is published.
// Earlier days stay available through "See earlier arrangements".

(function () {
  const root = document.getElementById("arrangement");
  const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // School time (India), whatever the viewer's device clock zone is
  const RESET_HOUR = 17; // today's arrangement is shown until 5 PM, then the page resets
  function schoolNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).map(p => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }
  let today = schoolNow().date;
  const nice = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  let published = {}, dates = [], selected = "", mine = "", browsing = false, preview = null;

  // Arrangements still current: upcoming days, and today's until 5 PM
  const current = () => { const now = schoolNow(); today = now.date; return dates.filter(d => d > now.date || (d === now.date && now.minutes < RESET_HOUR * 60)); };

  // "Arrangement by" cell: a sports period, or the teacher (+ 6th-period activity label and merge/combine note)
  const assignedCell = i => i.sports ? `<span class="arr-sports">🏃 ${esc(i.sports)}</span>`
    : !i.assignedTeacher ? "No free teacher (merge class)"
    : `${esc(i.assignedTeacher)}${i.activity ? `<small class="arr-act">(Sports/Outdoor Activities)</small>` : ""}${i.note ? `<small class="arr-mnote">${esc(i.note)}</small>` : ""}`;

  // Long names wrap onto a second line inside their box (see .arr-name in style.css).
  const nameTag = t => `<span class="arr-name">${esc(t)}</span>`;

  function render() {
    if (!preview && !browsing) {
      const live = current().sort();
      selected = live.includes(today) ? today : live[0] || "";
    }
    if (!selected) {
      const ended = !!published[today] && !preview;
      root.innerHTML = `
        <div class="arr-empty">
          <div class="arr-empty-art" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="12" y="10" width="40" height="46" rx="6"/><path d="M24 10V6h16v4"/><path d="M21 26h22M21 35h22M21 44h12"/>
            </svg>
            <span class="arr-empty-badge">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </span>
          </div>
          <h3>${ended ? "Today's arrangement has ended" : "No arrangement published yet"}</h3>
          <p>${ended ? "Today's arrangement was shown until 5 PM. The next one will appear here as soon as the school publishes it."
            : "Today's teacher arrangement will appear here as soon as the school publishes it — who is absent, who is present, and who takes each period."}</p>
          <div class="arr-empty-actions">
            <button type="button" class="arr-btn primary" data-arr="reload">↻ Check again</button>
            <a class="arr-btn" href="/pages/timetable.html">📅 View School Timetable</a>
          </div>
          ${dates.length ? `<button type="button" class="arr-past" data-arr="past">📂 See earlier arrangements</button>` : ""}
        </div>`;
      return;
    }
    const x = published[selected];
    const teachers = [...new Set([...x.present, ...x.absent.map(a => a.teacher)])].sort();
    const rows = x.plan.filter(i => !mine || i.assignedTeacher === mine || i.absentTeacher === mine);
    root.innerHTML = `
      <div class="arr-controls">
        <label><span>Date</span><select data-arr="date">${(browsing || preview ? dates : current().sort().reverse()).map(d => `<option value="${d}"${d === selected ? " selected" : ""}>${esc(nice(d))}${d === today ? " (today)" : ""}</option>`).join("")}</select></label>
        <label><span>Find my periods</span><select data-arr="mine"><option value="">All teachers</option>${teachers.map(t => `<option${t === mine ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
      </div>
      ${browsing ? `<p class="arr-note">Showing an earlier arrangement: ${esc(nice(selected))}. <button type="button" class="arr-link" data-arr="back">Back to today</button></p>`
        : selected !== today ? `<p class="arr-note">Showing ${esc(nice(selected))}.</p>` : ""}
      <div class="arr-summary">
        <div class="arr-box absent">
          <h3>🔴 Absent <span>${x.absent.length}</span></h3>
          <div class="arr-absent">${[...x.absent].sort((a, b) => a.teacher.localeCompare(b.teacher)).map(a => `
            <div class="${a.teacher === mine ? "me" : ""}"><b>${nameTag(a.teacher)}</b>
              ${a.periods?.length ? `<span class="arr-periods">${a.periods.map(p => `<i>P-${p}</i>`).join("")}</span>` : ""}</div>`).join("") || `<p class="empty">None</p>`}</div>
        </div>
        <div class="arr-box present">
          <h3>🟢 Present <span>${x.present.length}</span></h3>
          <div class="arr-names">${[...x.present].sort((a, b) => a.localeCompare(b)).map(t => `<span class="${t === mine ? "me" : ""}">${nameTag(t)}</span>`).join("")}</div>
        </div>
      </div>
      <div class="arr-card">
        <h3>🔄 Arrangement periods — ${esc(DAY_NAMES[x.day] || "")}${mine ? ` · ${esc(mine)}` : ""}</h3>
        <div class="arr-legend"><b class="abs">● Absent teacher</b><b class="sub">→ Arrangement by</b></div>
        ${rows.length ? `<div class="table-wrap"><table>
          <tr><th>Period</th><th>Class &amp; subject</th><th>Absent teacher</th><th>Arrangement by</th></tr>
          ${rows.map(i => `<tr class="${mine && i.assignedTeacher === mine ? "me" : ""}">
            <td data-label="Period"><b>P-${i.period}</b><small>${esc(i.time || "")}</small></td><td data-label="Class">${esc(i.classDesc)}</td>
            <td class="arr-abs" data-label="Absent">${esc(i.absentTeacher)}</td><td class="arr-sub" data-label="Arrangement by">${assignedCell(i)}</td></tr>`).join("")}
        </table></div>` : `<p class="empty">${mine ? `${esc(mine)} has no arrangement periods on this day.` : "No arrangement periods on this day."}</p>`}
        ${(x.notes || []).map(n => `<p class="arr-note-sports">🏃 ${esc(n)}</p>`).join("")}
      </div>
      ${x.summary?.length ? `<div class="arr-card">
        <h3>👥 Present teachers' workload</h3>
        <div class="table-wrap"><table class="arr-summary-t">
          <tr><th>Teacher</th><th>Regular</th><th>Substitution</th><th>Total</th></tr>
          ${x.summary.filter(r => !mine || r.teacher === mine).map(r => `<tr class="${r.teacher === mine ? "me" : ""}"><td data-label="Teacher"><b>${esc(r.teacher)}</b></td><td data-label="Regular">${r.regular}</td>
            <td data-label="Substitution">${r.subs.length ? `${r.subs.length} (${r.subs.map(p => `P-${p}`).join(", ")})` : "—"}</td><td data-label="Total"><b>${r.total}</b></td></tr>`).join("")}
        </table></div>
      </div>` : ""}`;
  }

  root.addEventListener("click", e => {
    const k = e.target.closest("[data-arr]")?.dataset.arr;
    if (k === "reload") location.reload();
    if (k === "past") { browsing = true; selected = dates.find(d => d <= today) || dates[0]; render(); }
    if (k === "back") { browsing = false; render(); }
  });

  root.addEventListener("change", e => {
    const k = e.target.dataset.arr;
    if (k === "date") { selected = e.target.value; if (!current().includes(selected)) browsing = true; }
    if (k === "mine") mine = e.target.value;
    render();
  });

  // ?preview=1 — the admin's unpublished draft (from the admin panel, same browser), shown with a banner
  preview = (() => {
    if (!new URLSearchParams(location.search).has("preview")) return null;
    try { return JSON.parse(localStorage.getItem("sages-arrangement-preview")); } catch { return null; }
  })();
  if (preview) {
    document.body.classList.add("arr-preview");
    if (!preview.published) root.insertAdjacentHTML("beforebegin", `<div class="arr-preview-note">👁 Preview — not published yet. Teachers will see this after the admin publishes.</div>`);
  }

  (preview ? Promise.resolve({ published: { [preview.date]: preview.entry } }) : fetch("/api/substitution")
    .then(r => (r.ok ? r.json() : { published: {} }))
    .catch(() => ({ published: {} })))
    .then(d => {
      published = d.published || {};
      dates = Object.keys(published).sort().reverse();
      if (preview) selected = preview.date;
      render();
      // If the page is left open, reset it at 5 PM (and check again each minute after midnight changes the day)
      if (!preview) { let shown = current().join(); setInterval(() => { const now = current().join(); if (now !== shown && !browsing) { shown = now; render(); } }, 60 * 1000); }
    });
})();
