// All page content comes from one JSON document. The admin panel saves it to
// Vercel Blob (served by /api/content); data/content.json is the fallback for
// local preview and before the first save. Elements with data-render="<key>"
// are filled by the matching renderer below.

const MENU = [
  { label: "Home", href: "index.html" },
  { label: "About Us", href: "about.html" },
  {
    label: "Administration", href: "administration.html", sub: [
      ["Principal's Profile", "administration.html#principal"],
      ["School Management Committee", "administration.html#smc"],
      ["Faculty", "administration.html#faculty"],
      ["Administrative Staff", "administration.html#staff"],
      ["Parent Teacher Association", "administration.html#pta"],
    ],
  },
  {
    label: "Admission", href: "admission.html", sub: [
      ["Admission Process", "admission.html#process"],
      ["Eligibility & Documents", "admission.html#documents"],
      ["Registration Enquiry", "admission.html#registration"],
    ],
  },
  {
    label: "Academic", href: "academic.html", sub: [
      ["Classes & Curriculum", "academic.html#curriculum"],
      ["Results", "academic.html#results"],
      ["Student Achievements", "academic.html#achievements"],
      ["School Calendar", "academic.html#calendar"],
    ],
  },
  {
    label: "Infrastructure", href: "infrastructure.html", sub: [
      ["Smart Classrooms", "infrastructure.html#classrooms"],
      ["Laboratories", "infrastructure.html#labs"],
      ["Library", "infrastructure.html#library"],
      ["School Campus", "infrastructure.html#campus"],
    ],
  },
  {
    label: "Activities", href: "activities.html", sub: [
      ["Sports Events", "activities.html#sports"],
      ["Cultural Events", "activities.html#cultural"],
      ["Technical Events", "activities.html#technical"],
      ["Scout Guide / NSS", "activities.html#scout"],
    ],
  },
  { label: "News & Events", href: "news.html" },
  { label: "Gallery", href: "gallery.html" },
  { label: "Contact Us", href: "contact.html" },
];

// School identity is fixed here on purpose and is not editable from the admin panel.
const IDENTITY = {
  name: "Swami Atmanand Government English Medium School",
  hindi: "स्वामी आत्मानंद शासकीय अंग्रेजी माध्यम विद्यालय",
  place: "Sonhat, District - Koriya, Chhattisgarh",
  logo: "images/logo.png",
};

const MONTHS =["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function loadContent() {
  try {
    const res = await fetch("/api/content");
    if (res.ok) return await res.json();
  } catch { /* local preview has no API */ }
  const res = await fetch("data/content.json");
  return res.json();
}

// ---------- helpers ----------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const paras = text => String(text || "").split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
const lines = text => String(text || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => `<li>${esc(l)}</li>`).join("");
const list = v => Array.isArray(v) ? v : [];

function dateBox(iso) {
  const [, m, d] = String(iso || "").split("-");
  if (!m || !d) return `<div class="date-box">–</div>`;
  return `<div class="date-box">${esc(d)}<small>${MONTHS[+m - 1] || ""}</small></div>`;
}

function avatar(name, photo) {
  if (photo) return `<div class="avatar"><img src="${esc(photo)}" alt="${esc(name)}" loading="lazy"></div>`;
  const initial = String(name || "?").replace(/[^\p{L}]/gu, "").charAt(0).toUpperCase() || "?";
  return `<div class="avatar">${esc(initial)}</div>`;
}

function table(headers, rows) {
  if (!rows.length) return `<p class="empty">Details will be updated soon.</p>`;
  return `<div class="table-wrap"><table>
    <tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr>
    ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}
  </table></div>`;
}

function datedList(items, { sortDesc = true, link = "" } = {}) {
  const sorted = [...list(items)].sort((a, b) => sortDesc ? String(b.date).localeCompare(a.date) : String(a.date).localeCompare(b.date));
  if (!sorted.length) return `<li><p class="empty">Nothing to show right now.</p></li>`;
  return sorted.map(i => {
    const text = link ? `<a href="${link}">${esc(i.text)}</a>` : esc(i.text);
    return `<li>${dateBox(i.date)}<p>${text}</p></li>`;
  }).join("");
}

function featureCards(items) {
  return list(items).map(f => `<div class="feature reveal"><div class="icon">${esc(f.icon)}</div><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join("");
}

function imageCards(items) {
  return list(items).map(c => `<div class="card reveal">${c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : ""}<div class="card-body"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div></div>`).join("");
}

function textWithImage(title, text, image, imageFirst = false) {
  const img = image ? `<img src="${esc(image)}" alt="" style="border-radius:10px" loading="lazy">` : "<div></div>";
  const body = `<div>${title ? `<h2>${esc(title)}</h2>` : ""}${paras(text)}</div>`;
  return imageFirst ? img + body : body + img;
}

const lookup = (c, path) => path.split(".").reduce((o, k) => o?.[k], c);
// Admin-set count wins over the page's default; blank or 0 means use the default.
const limitOf = (el, c) => Number(el.dataset.limitKey && lookup(c, el.dataset.limitKey)) || Number(el.dataset.limit) || Infinity;

// ---------- renderers ----------
const RENDER = {
  slides: (c) => list(c.slides).map((s, i) => `
    <div class="slide${i === 0 ? " active" : ""}" style="background-image:url('${esc(s.image)}')">
      <div class="container">
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        ${s.buttonText ? `<a href="${esc(s.buttonLink || "#")}" class="btn">${esc(s.buttonText)}</a>` : ""}
      </div>
    </div>`).join("") + `<div class="slider-dots"></div>`,

  features: c => featureCards(c.features),

  intro: c => `
    <div class="reveal">
      <h2>${esc(c.intro?.title)}</h2>
      <div class="loc">${esc(c.site.place)}</div>
      ${paras(c.intro?.text)}
      <a href="about.html" class="btn btn-outline">Read More</a>
    </div>
    ${c.intro?.image ? `<img class="reveal" src="${esc(c.intro.image)}" alt="">` : ""}`,

  notices: (c, el) => {
    const items = datedList(c.notices, { link: el.dataset.link });
    // The home page box scrolls; the list is doubled so the loop is seamless.
    return el.dataset.variant === "scroll" && list(c.notices).length > 3 ? items + items : items;
  },
  news: (c, el) => datedList(c.news, { link: el.dataset.link }),
  events: (c, el) => datedList(c.events, { sortDesc: false, link: el.dataset.link }),

  principalHome: c => {
    const p = c.principal || {};
    const first = String(p.message || "").split(/\n\s*\n/).slice(0, 2).join("\n\n");
    return `
      <div class="principal-photo reveal">
        ${p.photo ? `<img class="ph" src="${esc(p.photo)}" alt="${esc(p.name)}">` : `<div class="ph">👤</div>`}
        <div class="name-tag">${esc(p.name)}<small>Principal, SAGES Sonhat</small></div>
      </div>
      <div class="reveal">
        <div class="section-title" style="text-align:left;margin-bottom:10px"><span>${esc(c.home?.principalKicker || "From the Desk of")}</span><h2>${esc(c.home?.principalTitle || "Principal's Message")}</h2></div>
        ${p.quote ? `<blockquote>“${esc(p.quote)}”</blockquote>` : ""}
        ${paras(first)}
        <a href="administration.html#principal" class="btn btn-outline">Read More</a>
      </div>`;
  },

  principalFull: c => {
    const p = c.principal || {};
    return `
      <div class="principal-photo">
        ${p.photo ? `<img class="ph" src="${esc(p.photo)}" alt="${esc(p.name)}">` : `<div class="ph">👤</div>`}
        <div class="name-tag">${esc(p.name)}<small>Principal, SAGES Sonhat</small></div>
      </div>
      <div class="content">
        <h2>Principal's Profile &amp; Message</h2>
        <p><strong>Qualification:</strong> ${esc(p.qualification)} &nbsp;|&nbsp; <strong>Experience:</strong> ${esc(p.experience)}</p>
        ${p.quote ? `<blockquote>“${esc(p.quote)}”</blockquote>` : ""}
        ${paras(p.message)}
      </div>`;
  },

  stats: c => list(c.stats).map(s => `<div class="stat"><strong data-count="${Number(s.value) || 0}" data-suffix="${esc(s.suffix)}">0</strong><span>${esc(s.label)}</span></div>`).join(""),

  levels: c => imageCards(c.levels),

  faculty: (c, el) => {
    const p = c.principal || {};
    // The home page leads with the principal, then the first teachers.
    const people = el.dataset.withPrincipal
      ? [{ name: p.name, designation: "Principal", photo: p.photo }, ...list(c.faculty)]
      : list(c.faculty);
    return people.slice(0, limitOf(el, c)).map(t => `<div class="person reveal">${avatar(t.name, t.photo)}<h4>${esc(t.name)}</h4><span>${esc(t.designation)}</span></div>`).join("");
  },

  stars: c => list(c.stars).map(s => `<div class="person star reveal">${avatar(s.name, s.photo)}<h4>${esc(s.name)}</h4><span>${esc(s.className)}</span><br><span class="score">${esc(s.score)}</span></div>`).join(""),

  gallery: (c, el) => list(c.gallery).slice(0, limitOf(el, c)).map(g => `<a href="${esc(g.image)}"><img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy"><span>${esc(g.caption)}</span></a>`).join(""),

  partners: c => list(c.partners).map(p => `<a class="partner" href="${esc(p.link)}" target="_blank" rel="noopener"><div class="icon">${esc(p.icon)}</div>${esc(p.name)}</a>`).join(""),

  cta: c => `<h2>${esc(c.cta?.text)}</h2>${c.cta?.buttonText ? `<a href="${esc(c.cta.buttonLink || "#")}" class="btn">${esc(c.cta.buttonText)}</a>` : ""}`,

  about: c => textWithImage("Our School", c.about?.text, c.about?.image),
  vision: c => `<h2>🎯 Our Vision</h2>${paras(c.about?.vision)}`,
  mission: c => `<h2>🚀 Our Mission</h2><ul>${lines(c.about?.mission)}</ul>`,
  atmanand: c => paras(c.about?.atmanand),

  smc: c => table(["S.No.", "Name", "Designation"], list(c.smc).map((r, i) => [i + 1, esc(r.name), esc(r.designation)])),
  staff: c => table(["S.No.", "Name", "Designation"], list(c.staff).map((r, i) => [i + 1, esc(r.name), esc(r.designation)])),
  pta: c => paras(c.pta?.text),

  admissionSteps: c => list(c.admissionSteps).map((s, i) => `<div class="feature"><div class="step-no">${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join(""),
  admissionNote: c => `<p><strong>Note:</strong> ${esc(c.admission?.note)}</p>`,
  eligibility: c => `<h2>Eligibility</h2><ul>${lines(c.admission?.eligibility)}</ul>`,
  documents: c => `<h2>Documents Required</h2><ul>${lines(c.admission?.documents)}</ul>`,

  curriculum: c => table(["Level", "Classes", "Subjects"], list(c.curriculum).map(r => [esc(r.level), esc(r.classes), esc(r.subjects)])),
  results: c => table(["Year", "Class", "Appeared", "Passed", "Pass %"], list(c.results).map(r => [esc(r.year), esc(r.className), esc(r.appeared), esc(r.passed), esc(r.percent)])),
  achievements: c => featureCards(c.achievements),
  calendar: c => table(["Month", "Event"], list(c.calendar).map(r => [esc(r.month), esc(r.event)])),

  classrooms: c => textWithImage("Smart Classrooms", c.classrooms?.text, c.classrooms?.image),
  labs: c => imageCards(c.labs),
  library: c => textWithImage("Library", c.library?.text, c.library?.image, true),
  campus: c => featureCards(c.campus),

  activities: c => list(c.activities).map((a, i) => `
    <section id="${esc(a.anchor)}" class="${i % 2 ? "bg-soft" : ""}">
      <div class="container intro content">${textWithImage(a.title, a.text, a.image, i % 2 === 1)}</div>
    </section>`).join(""),

  disclosure: c => table(["S.No.", "Document", "View"], list(c.disclosure).map((d, i) => [
    i + 1, esc(d.title),
    d.file ? `<a href="${esc(d.file)}" target="_blank" rel="noopener">View PDF</a>` : `<span class="empty">To be uploaded</span>`,
  ])),

  contactInfo: c => `
    <p><strong>📍 Address</strong><br>${esc(c.site.name)},<br>${esc(c.site.address)}</p>
    <p><strong>✉ Email</strong><br><a href="mailto:${esc(c.site.email)}">${esc(c.site.email)}</a></p>
    <p><strong>☎ Phone</strong><br>${esc(c.site.phone)}</p>
    <p><strong>🕘 Office Hours</strong><br>${esc(c.site.hoursWeekday)}<br>${esc(c.site.hoursSaturday)}</p>`,
};

// ---------- layout ----------
function currentPage() {
  const file = location.pathname.split("/").pop();
  return file === "" ? "index.html" : file;
}

function renderHeader(c) {
  const s = c.site;
  const page = currentPage();
  const ticker = list(c.ticker).map(n => `<a href="news.html"><span class="badge-new">NEW</span>${esc(n.text)}</a>`).join("");
  const menu = MENU.map(item => {
    const active = item.href === page ? " active" : "";
    if (!item.sub) return `<li class="${active}"><a href="${item.href}">${item.label}</a></li>`;
    const subs = item.sub.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join("");
    return `<li class="has-sub${active}"><a href="${item.href}">${item.label}</a><ul class="submenu">${subs}</ul></li>`;
  }).join("");

  document.getElementById("site-header").innerHTML = `
    <div class="topbar">
      <div class="container">
        <div class="ticker"><div class="ticker-track">${ticker}</div></div>
        <div class="topbar-links">
          <a href="mailto:${esc(s.email)}">✉ ${esc(s.email)}</a>
          <a href="contact.html">Contact Now</a>
          <a href="admin.html" class="admin-link">🔒 Admin</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="logo" aria-label="Home">
          <img src="${esc(s.logo)}" alt="School logo"
            onerror="this.parentElement.classList.remove('has-img'); this.remove()"
            onload="this.parentElement.classList.add('has-img')">
          SAGES<small>SONHAT</small></a>
        <div class="brand">
          <h1>${esc(s.name)}</h1>
          <div class="hindi">${esc(s.hindi)}</div>
          <p>${esc(s.place)}</p>
        </div>
        <div class="header-contact">
          Call us<strong>${esc(s.phone)}</strong>
        </div>
      </div>
    </header>
    <nav class="nav">
      <div class="container">
        <button class="nav-toggle" aria-label="Open menu">☰</button>
        <ul class="menu">${menu}</ul>
      </div>
    </nav>`;
}

function renderFooter(c) {
  const s = c.site;
  const year = new Date().getFullYear();
  document.getElementById("site-footer").innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <h4>About the School</h4>
          <p>${esc(s.footerAbout)}</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="admission.html">Admission</a></li>
            <li><a href="administration.html#faculty">Faculty</a></li>
            <li><a href="academic.html#results">Results</a></li>
            <li><a href="disclosure.html">Public Disclosure</a></li>
          </ul>
        </div>
        <div>
          <h4>Useful Links</h4>
          <ul>
            <li><a href="https://eduportal.cg.nic.in/" target="_blank" rel="noopener">CG School Education</a></li>
            <li><a href="https://cgbse.nic.in/" target="_blank" rel="noopener">CG Board (CGBSE)</a></li>
            <li><a href="https://scert.cg.gov.in/" target="_blank" rel="noopener">SCERT Chhattisgarh</a></li>
            <li><a href="https://koriya.gov.in/" target="_blank" rel="noopener">District Koriya</a></li>
            <li><a href="https://diksha.gov.in/" target="_blank" rel="noopener">DIKSHA</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>📍 ${esc(s.address)}</p>
          <p>✉ <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p>
          <p>☎ ${esc(s.phone)}</p>
          <p>🕘 ${esc(s.hoursWeekday)}<br>${esc(s.hoursSaturday)}</p>
        </div>
      </div>
      <div class="footer-bottom">
        © ${year} ${esc(s.name)}, Sonhat. All rights reserved. · <a href="admin.html">Admin</a>
      </div>
    </footer>
    <button class="back-to-top" aria-label="Back to top">↑</button>
    <div class="lightbox"><img alt=""></div>`;
}

function renderSections(c) {
  document.querySelectorAll("[data-text]").forEach(el => {
    const value = lookup(c, el.dataset.text);
    if (value) el.textContent = value;
  });
  document.querySelectorAll("[data-render]").forEach(el => {
    const fn = RENDER[el.dataset.render];
    if (!fn) return;
    el.innerHTML = fn(c, el);
    // Hide a whole block when the admin has removed every item from its list.
    const wrapper = el.closest("[data-section]");
    if (wrapper) wrapper.hidden = !el.querySelector(".slide, .feature, .stat, .card, .person, a");
  });
}

// ---------- behaviour ----------
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".menu");
  toggle.addEventListener("click", () => menu.classList.toggle("open"));
  // On mobile, first tap on a parent item opens its submenu instead of navigating.
  document.querySelectorAll(".has-sub > a").forEach(a => {
    a.addEventListener("click", e => {
      if (window.innerWidth > 960) return;
      const li = a.parentElement;
      if (!li.classList.contains("sub-open")) {
        e.preventDefault();
        li.classList.add("sub-open");
      }
    });
  });
}

function initSlider() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelector(".slider-dots");
  if (!slides.length || !dots) return;
  let i = 0;
  slides.forEach((_, n) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", `Slide ${n + 1}`);
    b.addEventListener("click", () => show(n));
    dots.appendChild(b);
  });
  function show(n) {
    slides[i].classList.remove("active");
    dots.children[i].classList.remove("active");
    i = n;
    slides[i].classList.add("active");
    dots.children[i].classList.add("active");
  }
  show(0);
  if (slides.length > 1) setInterval(() => show((i + 1) % slides.length), 5000);
}

function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / 1500, 1);
        el.textContent = Math.floor(p * target) + (p === 1 ? (el.dataset.suffix || "") : "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  });
  counters.forEach(c => io.observe(c));
}

function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
}

function initBackToTop() {
  const btn = document.querySelector(".back-to-top");
  window.addEventListener("scroll", () => btn.classList.toggle("show", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0 }));
}

function initLightbox() {
  const box = document.querySelector(".lightbox");
  const img = box.querySelector("img");
  document.querySelectorAll(".gallery a").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      img.src = a.getAttribute("href");
      box.classList.add("open");
    });
  });
  box.addEventListener("click", () => box.classList.remove("open"));
}

function initForms() {
  document.querySelectorAll("form.form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      form.querySelector(".form-msg").style.display = "block";
      form.reset();
    });
  });
}

(async function init() {
  const content = await loadContent();
  content.site = { ...content.site, ...IDENTITY };
  renderHeader(content);
  renderFooter(content);
  renderSections(content);
  initNav();
  initSlider();
  initCounters();
  initReveal();
  initBackToTop();
  initLightbox();
  initForms();
  // Jump to #anchor after content renders, since the target may not have existed on load.
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
})();
