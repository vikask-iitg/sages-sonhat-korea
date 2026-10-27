// Shared header, navigation and footer are injected on every page
// so the menu only has to be maintained in one place.

const SCHOOL = {
  name: "Swami Atmanand Government English Medium School",
  hindi: "स्वामी आत्मानंद शासकीय अंग्रेजी माध्यम विद्यालय",
  place: "Sonhat, District - Koriya, Chhattisgarh",
  email: "sagessonhat@gmail.com", // TODO: replace with official email
  phone: "+91 00000 00000", // TODO: replace with official phone
  address: "Sonhat, District - Koriya, Chhattisgarh - 497449",
};

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

const NOTICES = [
  "Admissions open for Session 2026-27 — collect forms from the school office",
  "Half-yearly examination time table published — see Academic › School Calendar",
  "Rajyotsava celebrations on 1st November — all students to report by 8:30 AM",
];

function currentPage() {
  const file = location.pathname.split("/").pop();
  return file === "" ? "index.html" : file;
}

function renderHeader() {
  const page = currentPage();
  const ticker = NOTICES.map(n => `<a href="news.html"><span class="badge-new">NEW</span>${n}</a>`).join("");
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
          <a href="mailto:${SCHOOL.email}">✉ ${SCHOOL.email}</a>
          <a href="contact.html">Contact Now</a>
        </div>
      </div>
    </div>
    <header class="site-header">
      <div class="container">
        <a href="index.html" class="logo" aria-label="Home">SAGES<small>SONHAT</small></a>
        <div class="brand">
          <h1>${SCHOOL.name}</h1>
          <div class="hindi">${SCHOOL.hindi}</div>
          <p>${SCHOOL.place}</p>
        </div>
        <div class="header-contact">
          Call us<strong>${SCHOOL.phone}</strong>
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

function renderFooter() {
  const year = new Date().getFullYear();
  document.getElementById("site-footer").innerHTML = `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <h4>About the School</h4>
          <p>A Swami Atmanand Utkrisht Vidyalaya of the Government of Chhattisgarh, offering quality
          English-medium education, free of cost, to the children of Sonhat and surrounding villages.</p>
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
          <p>📍 ${SCHOOL.address}</p>
          <p>✉ <a href="mailto:${SCHOOL.email}">${SCHOOL.email}</a></p>
          <p>☎ ${SCHOOL.phone}</p>
          <p>🕘 Mon – Fri: 10:00 AM – 4:00 PM<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Saturday: 7:00 AM – 12:00 PM</p>
        </div>
      </div>
      <div class="footer-bottom">
        © ${year} ${SCHOOL.name}, Sonhat. All rights reserved.
      </div>
    </footer>
    <button class="back-to-top" aria-label="Back to top">↑</button>
    <div class="lightbox"><img alt=""></div>`;
}

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
  if (!slides.length) return;
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
  setInterval(() => show((i + 1) % slides.length), 5000);
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

renderHeader();
renderFooter();
initNav();
initSlider();
initCounters();
initReveal();
initBackToTop();
initLightbox();
initForms();
