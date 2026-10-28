// All page content comes from one JSON document. The admin panel saves it to
// Vercel Blob (served by /api/content); data/content.json is the fallback for
// local preview and before the first save. Elements with data-render="<key>"
// are filled by the matching renderer below.

const MENU = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/pages/about.html" },
  {
    label: "Administration", href: "/pages/administration.html", sub: [
      ["Principal's Profile", "/pages/administration.html#principal"],
      ["School Management Committee", "/pages/administration.html#smc"],
      ["Faculty", "/pages/administration.html#faculty"],
      ["Administrative Staff", "/pages/administration.html#staff"],
      ["Parent Teacher Association", "/pages/administration.html#pta"],
    ],
  },
  {
    label: "Admission", href: "/pages/admission.html", sub: [
      ["Admission Process", "/pages/admission.html#process"],
      ["Eligibility & Documents", "/pages/admission.html#documents"],
      ["Registration Enquiry", "/pages/admission.html#registration"],
    ],
  },
  {
    label: "Academic", href: "/pages/academic.html", sub: [
      ["Classes & Curriculum", "/pages/academic.html#curriculum"],
      ["Results", "/pages/academic.html#results"],
      ["Student Achievements", "/pages/academic.html#achievements"],
      ["School Calendar", "/pages/academic.html#calendar"],
    ],
  },
  {
    label: "Infrastructure", href: "/pages/infrastructure.html", sub: [
      ["Smart Classrooms", "/pages/infrastructure.html#classrooms"],
      ["Laboratories", "/pages/infrastructure.html#labs"],
      ["Library", "/pages/infrastructure.html#library"],
      ["School Campus", "/pages/infrastructure.html#campus"],
    ],
  },
  {
    label: "Activities", href: "/pages/activities.html", sub: [
      ["Sports Events", "/pages/activities.html#sports"],
      ["Cultural Events", "/pages/activities.html#cultural"],
      ["Technical Events", "/pages/activities.html#technical"],
      ["Scout Guide / NSS", "/pages/activities.html#scout"],
    ],
  },
  { label: "News & Events", href: "/pages/news.html" },
  { label: "Gallery", href: "/pages/gallery.html" },
  { label: "Contact Us", href: "/pages/contact.html" },
];

// School identity is fixed here on purpose and is not editable from the admin panel.
const IDENTITY = {
  name: "Swami Atmanand Government English Medium School",
  hindi: "स्वामी आत्मानंद शासकीय अंग्रेजी माध्यम विद्यालय",
  place: "Sonhat, District - Koriya, Chhattisgarh",
  logo: "/images/logo.png",
};

const MONTHS =["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function loadContent() {
  try {
    const res = await fetch("/api/content");
    if (res.ok) return await res.json();
  } catch { /* local preview has no API */ }
  const res = await fetch("/data/content.json");
  return res.json();
}

// ---------- helpers ----------
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const paras = text => String(text || "").split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
const lines = text => String(text || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => `<li>${esc(l)}</li>`).join("");
const list = v => Array.isArray(v) ? v : [];
// Inline brand icons for the school's social pages; each icon only shows when its link is set.
const SOCIAL = [
  ["instagram", "Instagram", '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>'],
  ["facebook", "Facebook", '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3z"/></svg>'],
  ["whatsapp", "WhatsApp", '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z"/><path fill="currentColor" d="M9.1 7.6c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.8 1 1.4 1.6 1.9.6.4 1 .6 1.3.7.2.1.3 0 .5-.1l.6-.8c.2-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.3.1.3 0 1-.3 1.3-.4.5-1.2.9-1.9.8-.9-.1-2.2-.5-3.7-1.8-1.2-1.1-2-2.4-2.2-3.2-.2-.9.1-1.6.5-2 .2-.3.4-.4.6-.5z"/></svg>'],
];
// WhatsApp is stored as a phone number; 10-digit numbers are treated as Indian (+91).
const whatsappUrl = number => {
  const digits = String(number || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits.length === 10 ? "91" + digits : digits}` : "";
};
const socialHref = (site, key) => key === "whatsapp" ? whatsappUrl(site.whatsapp) : site[key];
const socialLinks = (site, cls) => SOCIAL.filter(([key]) => socialHref(site, key)).map(([key, name, svg]) =>
  `<a class="${cls} ${key}" href="${esc(socialHref(site, key))}" target="_blank" rel="noopener" aria-label="${name}" title="${name}">${svg}</a>`).join("");
const telLink = phone => `<a href="tel:${esc(String(phone || "").replace(/[^\d+]/g, ""))}">${esc(phone)}</a>`;
// Links saved before pages moved into /pages/ (e.g. "admission.html") still point to the right place.
const pageLink = href => {
  const h = String(href || "#");
  if (/^(index\.html)?(#.*)?$/.test(h) && h !== "#" && !h.startsWith("#")) return "/" + h.replace("index.html", "");
  return /^[\w-]+\.html(#.*)?$/.test(h) ? `/pages/${h}` : h;
};

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
// Qualification and experience line shown with the principal's message; empty ones are left out.
const principalFacts = p => {
  const facts = [["🎓", "Qualification", p.qualification], ["⏳", "Experience", p.experience]].filter(f => String(f[2] || "").trim());
  return facts.length ? `<p class="principal-facts">${facts.map(([icon, label, value]) =>
    `<span>${icon} <strong>${label}:</strong> ${esc(value)}</span>`).join("")}</p>` : "";
};

const personCards = (people, reveal = true) => people.map(t =>
  `<div class="person${reveal ? " reveal" : ""}">${avatar(t.name, t.photo)}<h4>${esc(t.name)}</h4><span>${esc(t.designation)}</span>${
    t.subject ? `<small class="subject">${esc(t.subject)}</small>` : ""}</div>`).join("");

// Endless scrolling row: the track holds two identical sets and slides by one set, so the loop has no seam.
// Short lists are repeated (min ~8 cards per set) so a set is always wider than the screen.
const carousel = (cards, count) => {
  if (!count) return "";
  const reps = Math.ceil(8 / count);
  const repeats = reps > 1 ? `<div class="carousel-repeat" aria-hidden="true">${cards.repeat(reps - 1)}</div>` : "";
  return `<div class="carousel-track" style="--duration:${count * reps * 6}s">
    <div class="carousel-set">${cards}${repeats}</div>
    <div class="carousel-set" aria-hidden="true">${cards.repeat(reps)}</div>
  </div>`;
};

const limitOf = (el, c) => Number(el.dataset.limitKey && lookup(c, el.dataset.limitKey)) || Number(el.dataset.limit) || Infinity;

// ---------- renderers ----------
const RENDER = {
  slides: (c) => list(c.slides).map((s, i) => `
    <div class="slide${i === 0 ? " active" : ""}" style="background-image:url('${esc(s.image)}')">
      <div class="container">
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.text)}</p>
        ${s.buttonText ? `<a href="${esc(pageLink(s.buttonLink))}" class="btn">${esc(s.buttonText)}</a>` : ""}
      </div>
    </div>`).join("") + `<div class="slider-dots"></div>`,

  features: c => featureCards(c.features),

  intro: c => `
    <div class="reveal">
      <h2>${esc(c.intro?.title)}</h2>
      <div class="loc">${esc(c.site.place)}</div>
      ${paras(c.intro?.text)}
      <a href="/pages/about.html" class="btn btn-outline">Read More</a>
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
        ${principalFacts(p)}
        ${p.quote ? `<blockquote>“${esc(p.quote)}”</blockquote>` : ""}
        ${paras(first)}
        <a href="/pages/administration.html#principal" class="btn btn-outline">Read More</a>
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
        ${principalFacts(p)}
        ${p.quote ? `<blockquote>“${esc(p.quote)}”</blockquote>` : ""}
        ${paras(p.message)}
      </div>`;
  },

  stats: c => list(c.stats).map(s => {
    // "staff" counts are worked out from the people lists, so they never go stale.
    const auto = s.auto === "staff";
    const value = auto ? (c.principal?.name ? 1 : 0) + list(c.faculty).length + list(c.staff).length : Number(s.value) || 0;
    return `<div class="stat"><strong data-count="${value}" data-suffix="${auto ? "" : esc(s.suffix)}">0</strong><span>${esc(s.label)}</span></div>`;
  }).join(""),

  levels: c => imageCards(c.levels),

  faculty: c => personCards(list(c.faculty)),

  // Home page: principal, faculty and staff scroll past in one endless row.
  team: c => {
    const p = c.principal || {};
    const people = [...(p.name ? [{ name: p.name, designation: "Principal", subject: p.subject, photo: p.photo }] : []), ...list(c.faculty), ...list(c.staff)];
    return carousel(personCards(people, false), people.length);
  },

  stars: c => carousel(list(c.stars).map(s => `<div class="person star">${avatar(s.name, s.photo)}<h4>${esc(s.name)}</h4><span>${esc(s.className)}</span><br><span class="score">${esc(s.score)}</span></div>`).join(""), list(c.stars).length),

  gallery: (c, el) => list(c.gallery).slice(0, limitOf(el, c)).map(g => `<a href="${esc(g.image)}"><img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy"><span>${esc(g.caption)}</span></a>`).join(""),

  partners: c => list(c.partners).map(p => `<a class="partner" href="${esc(p.link)}" target="_blank" rel="noopener">
    <span class="partner-icon">${esc(p.icon)}</span>
    <span class="partner-name">${esc(p.name)}</span>
    ${p.link ? `<span class="partner-link">Visit website <span aria-hidden="true">↗</span></span>` : ""}
  </a>`).join(""),

  cta: c => `<h2>${esc(c.cta?.text)}</h2>${c.cta?.buttonText ? `<a href="${esc(pageLink(c.cta.buttonLink))}" class="btn">${esc(c.cta.buttonText)}</a>` : ""}`,

  about: c => textWithImage("Our School", c.about?.text, c.about?.image),
  vision: c => `<h2>🎯 Our Vision</h2>${paras(c.about?.vision)}`,
  mission: c => `<h2>🚀 Our Mission</h2><ul>${lines(c.about?.mission)}</ul>`,
  atmanand: c => paras(c.about?.atmanand),

  smc: c => table(["S.No.", "Name", "Designation"], list(c.smc).map((r, i) => [i + 1, esc(r.name), esc(r.designation)])),
  staff: c => personCards(list(c.staff)),
  pta: c => paras(c.pta?.text),

  admissionSteps: c => list(c.admissionSteps).map((s, i) => `<div class="feature"><div class="step-no">${i + 1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join(""),
  admissionNote: c => `<p><strong>Note:</strong> ${esc(c.admission?.note)}</p>`,
  admissionForm: c => {
    const pdf = c.admission?.formPdf ?? "/docs/admission-form.pdf";
    return pdf ? `<a class="btn" href="${esc(pdf)}" download="SAGES-Sonhat-Admission-Form.pdf" target="_blank" rel="noopener">⬇ Download Admission Form</a>` : "";
  },
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

  // Same icon set as the footer's contact column, in a light card.
  contactInfo: c => `
    <ul class="contact-list">
      <li>${footerIcon("pin")}<div><small>Address</small><strong>${esc(c.site.name)}</strong>${esc(c.site.address)}</div></li>
      <li>${footerIcon("mail")}<div><small>Email</small><a href="mailto:${esc(c.site.email)}">${esc(c.site.email)}</a></div></li>
      <li>${footerIcon("phone")}<div><small>Phone</small>${telLink(c.site.phone)}</div></li>
      <li>${footerIcon("clock")}<div><small>Office Hours</small>${esc(c.site.hoursWeekday)}<br>${esc(c.site.hoursSaturday)}</div></li>
    </ul>
    ${socialLinks(c.site, "social") ? `<div class="contact-follow"><small>Follow us</small><div class="socials">${socialLinks(c.site, "social")}</div></div>` : ""}`,
};

// ---------- layout ----------
function currentPage() {
  const path = location.pathname;
  return path === "/index.html" ? "/" : path;
}

function renderHeader(c) {
  const s = c.site;
  const page = currentPage();
  const ticker = list(c.ticker).map(n => `<a href="/pages/news.html"><span class="badge-new">NEW</span>${esc(n.text)}</a>`).join("");
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
          <a href="mailto:${esc(s.email)}" class="top-mail"><span class="top-social"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></span>${esc(s.email)}</a>
          ${socialLinks(s, "top-social")}
          <a href="/pages/admin.html" class="admin-link">🔒 Admin</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="container">
        <a href="/" class="logo" aria-label="Home">
          <img src="${esc(s.logo)}" alt="School logo"
            onerror="this.parentElement.classList.remove('has-img'); this.remove()"
            onload="this.parentElement.classList.add('has-img')">
          SAGES<small>SONHAT</small></a>
        <div class="brand">
          <h1>${esc(s.name)}</h1>
          <div class="hindi">${esc(s.hindi)}</div>
          <p>${esc(s.place)}</p>
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

const FOOTER_ICONS = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const footerIcon = name => `<span class="f-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${FOOTER_ICONS[name]}</svg></span>`;

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
            <li><a href="/pages/about.html">About Us</a></li>
            <li><a href="/pages/admission.html">Admission</a></li>
            <li><a href="/pages/administration.html#faculty">Faculty</a></li>
            <li><a href="/pages/academic.html#results">Results</a></li>
            <li><a href="/pages/contact.html">Contact Us</a></li>
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
          <ul class="f-contact">
            <li>${footerIcon("pin")}<div><small>Address</small>${esc(s.address)}</div></li>
            <li>${footerIcon("mail")}<div><small>Email</small><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div></li>
            <li>${footerIcon("phone")}<div><small>Phone</small>${telLink(s.phone)}</div></li>
            <li>${footerIcon("clock")}<div><small>Office Hours</small>${esc(s.hoursWeekday)}<br>${esc(s.hoursSaturday)}</div></li>
          </ul>
          ${socialLinks(s, "social") ? `<div class="f-follow"><small>Follow us</small><div class="socials">${socialLinks(s, "social")}</div></div>` : ""}
        </div>
      </div>
      <div class="footer-bottom">
        © ${year} ${esc(s.name)}, Sonhat. All rights reserved. · <a href="/pages/admin.html">Admin</a>
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

// Any picture that fails to load (e.g. a removed stock photo) falls back to a bundled school photo.
document.addEventListener("error", e => {
  const img = e.target;
  if (img.tagName !== "IMG" || img.closest(".logo") || img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = "/images/placeholder.jpg";
}, true);

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
