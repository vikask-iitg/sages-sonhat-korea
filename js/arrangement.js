// Daily Arrangement page: a read-only view of the substitution lists the admin publishes.
// Teachers pick a date and see who is absent, who is present, and who takes each period.

(function () {
  const root = document.getElementById("arrangement");
  const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
  const nice = iso => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  let published = {}, dates = [], selected = "", mine = "";

  function render() {
    if (!dates.length) {
      root.innerHTML = `<div class="arr-empty">📭 No arrangement has been published yet. Please check again later.</div>`;
      return;
    }
    const x = published[selected];
    const teachers = [...new Set([...x.present, ...x.absent.map(a => a.teacher)])].sort();
    const rows = x.plan.filter(i => !mine || i.assignedTeacher === mine || i.absentTeacher === mine);
    root.innerHTML = `
      <div class="arr-controls">
        <label><span>Date</span><select data-arr="date">${dates.map(d => `<option value="${d}"${d === selected ? " selected" : ""}>${esc(nice(d))}${d === today ? " (today)" : ""}</option>`).join("")}</select></label>
        <label><span>Find my periods</span><select data-arr="mine"><option value="">All teachers</option>${teachers.map(t => `<option${t === mine ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
      </div>
      ${selected !== today ? `<p class="arr-note">Showing ${esc(nice(selected))}. ${published[today] ? "" : "Today's arrangement is not published yet."}</p>` : ""}
      <div class="arr-summary">
        <div class="arr-box absent">
          <h3>🔴 Absent <span>${x.absent.length}</span></h3>
          <div class="arr-absent">${[...x.absent].sort((a, b) => a.teacher.localeCompare(b.teacher)).map(a => `
            <div class="${a.teacher === mine ? "me" : ""}"><b>${esc(a.teacher)}</b>
              ${a.periods?.length ? `<span class="arr-periods">${a.periods.map(p => `<i>P-${p}</i>`).join("")}</span>` : ""}</div>`).join("") || `<p class="empty">None</p>`}</div>
        </div>
        <div class="arr-box present">
          <h3>🟢 Present <span>${x.present.length}</span></h3>
          <div class="arr-names">${[...x.present].sort((a, b) => a.localeCompare(b)).map(t => `<span class="${t === mine ? "me" : ""}">${esc(t)}</span>`).join("")}</div>
        </div>
      </div>
      <div class="arr-card">
        <h3>🔄 Arrangement periods — ${esc(DAY_NAMES[x.day] || "")}${mine ? ` · ${esc(mine)}` : ""}</h3>
        ${rows.length ? `<div class="table-wrap"><table>
          <tr><th>Period</th><th>Class &amp; subject</th><th>Absent teacher</th><th>Arrangement by</th></tr>
          ${rows.map(i => `<tr class="${mine && i.assignedTeacher === mine ? "me" : ""}">
            <td data-label="Period"><b>P-${i.period}</b><small>${esc(i.time || "")}</small></td><td data-label="Class">${esc(i.classDesc)}</td>
            <td class="arr-abs" data-label="Absent">${esc(i.absentTeacher)}</td><td class="arr-sub" data-label="Arrangement by">${i.assignedTeacher ? esc(i.assignedTeacher) : "No free teacher (merge class)"}</td></tr>`).join("")}
        </table></div>` : `<p class="empty">${mine ? `${esc(mine)} has no arrangement periods on this day.` : "No arrangement periods on this day."}</p>`}
      </div>`;
  }

  root.addEventListener("change", e => {
    const k = e.target.dataset.arr;
    if (k === "date") selected = e.target.value;
    if (k === "mine") mine = e.target.value;
    render();
  });

  fetch("/api/substitution")
    .then(r => (r.ok ? r.json() : { published: {} }))
    .catch(() => ({ published: {} }))
    .then(d => {
      published = d.published || {};
      dates = Object.keys(published).sort().reverse();
      selected = published[today] ? today : dates[0] || "";
      render();
    });
})();
