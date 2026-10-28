# SAGES Sonhat — School Website

Official website of **Swami Atmanand Government English Medium School, Sonhat**
(स्वामी आत्मानंद शासकीय अंग्रेजी माध्यम विद्यालय), Block Sonhat, District Koriya, Chhattisgarh.

**Live site:** https://sagessonhatkorea.vercel.app
**Admin panel:** https://sagessonhatkorea.vercel.app/pages/admin.html

The site is plain HTML, CSS and JavaScript with no build step, hosted on Vercel. School staff update almost everything
(notices, events, faculty, photos, gallery, admission form and more) from a password-protected admin panel, without
touching code.

---

## What's on the site

| Page | Content |
|---|---|
| Home | Banner slider, feature boxes, introduction, notice board (notices, news, upcoming events), principal's message, school numbers, education levels, scrolling **Faculty & Staff** and **Star Performers** carousels, gallery preview, partners |
| About Us | About the school, vision, mission, about Swami Atmanand |
| Administration | Principal's profile, School Management Committee, faculty, administrative staff, PTA |
| Admission | Admission process, **Download Admission Form** button, eligibility and documents, registration enquiry form |
| Academic | Curriculum, board results, student achievements, school calendar |
| Infrastructure | Smart classrooms, laboratories, library, campus |
| Activities | Sports, cultural, technical, Scout Guide / NSS |
| News & Events | All notices, news and upcoming events |
| Gallery | Photo gallery with full-screen viewer |
| Contact Us | Address, phone, email, office hours, social links, Google Map, contact form |

Also included: Instagram / Facebook / WhatsApp links, tap-to-call phone, link previews for WhatsApp and Facebook shares,
and a layout that works on phones.

---

## Updating content (for school staff)

1. Open the **Admin panel** link above, or click **🔒 Admin** in the top bar of any page, and log in with the admin
   email ID and password. You are logged out automatically after 1 hour; unsaved edits stay on the page.
2. Pick a section in the left sidebar. The **Pages** group follows the website menu (Home Page, About Us,
   Administration, Admission, and so on).
3. Click **Unlock to edit** (each page opens locked), then edit, add (**+ Add new**), delete (🗑) or reorder (↑ ↓) items.
4. Click **💾 Save changes** (or press Ctrl/Cmd + S). The website updates within a few seconds.

**Photos:** uploading opens a crop window locked to the shape the website uses, so photos never look stretched:

| Where | Shape |
|---|---|
| Faculty, staff, star performers | square |
| Principal | portrait 4:5 |
| Banner slider | wide 16:9 |
| Gallery, introduction, About, Classrooms, Library, Activities | 4:3 |
| Education and laboratory cards | 3:2 |

Use **Edit photo** to re-frame an existing photo. Photos are saved at a fixed size per shape and compressed below
500 KB automatically.

**Automatic values:**
- The *Teachers & Staff* number on the home page counts principal + faculty + administrative staff by itself.
- Notices and news are shown newest first; events are shown in date order.
- Any home-page section whose list is emptied hides itself.

**Fixed on purpose:** the school name (English and Hindi), the location line under it and the logo cannot be changed
from the admin panel. To change them, edit the `IDENTITY` block at the top of [`js/main.js`](js/main.js).

**Backups:** every save also stores a dated copy in Vercel Blob under `backups/`, so a bad edit can be rolled back.

---

## How it works

```
Browser ──► static pages (index.html, pages/*.html) + js/main.js
                 │
                 └─ GET /api/content ──► Vercel Blob: content.json   (falls back to data/content.json)

Admin panel ──► /api/login ──► signed HttpOnly session cookie (1 hour, then auto logout)
            ──► PUT /api/content  ──► saves content.json (+ backups/)
            ──► POST /api/upload  ──► stores photos / PDFs in Blob under uploads/
```

- **All page content is one JSON document.** Pages contain empty containers like `<div data-render="faculty">`;
  [`js/main.js`](js/main.js) fills each one with its renderer from the `RENDER` map. Headings marked
  `data-text="home.…"` are filled the same way.
- **The admin panel is generated from a schema.** `SECTIONS` in [`js/admin.js`](js/admin.js) lists every editable
  field (text, textarea, image with crop ratio, PDF, date, number, select). `NAV` arranges them in the sidebar.
  To make something new editable: add the field to `SECTIONS`, give it a default in
  [`data/content.json`](data/content.json), and render it in `js/main.js`.
- **Defaults:** [`data/content.json`](data/content.json) is used for local preview and before the first save. When
  the admin panel loads, it fills in any new sections from it.

---

## Project structure

```
index.html              Home page (must stay at the root)
pages/                  All other pages, incl. admin.html
css/style.css           Website styles
css/admin.css           Admin panel styles
js/main.js              Shared header/footer, content renderers, carousels, slider, lightbox
js/admin.js             Admin panel: login, schema-driven editor, cropping, uploads
api/                    Vercel serverless functions
  _lib.js                 Auth helpers (password check, signed cookie), Blob URL helper
  login.js, logout.js, session.js
  content.js              GET / PUT site content
  upload.js               Image and PDF uploads (logged-in only, 4 MB max)
data/content.json       Default content
docs/admission-form.pdf Default admission form for the download button
images/                 Logo, favicon, link-preview image (og-image.jpg), fallback photo
vercel.json             Redirects from old /<page>.html addresses to /pages/<page>.html
```

All links are root-relative (`/pages/about.html`, `/css/style.css`), so they work from any folder.

---

## Running locally

Requires Node.js and the [Vercel CLI](https://vercel.com/docs/cli).

```bash
npm install
vercel link                      # once, choose the sages-sonhat-korea project
vercel env pull .env.local       # fetch secrets for local use (never commit this file)
vercel dev                       # full site + API at http://localhost:3000
```

For quick design work without the API, any static server works, for example
`npx live-server --port=5500`. Pages then show the defaults from `data/content.json`.

---

## Deployment

Pushing to `main` deploys to production automatically through Vercel's GitHub integration.

> Commits must be authored with an email linked to the GitHub account that owns the Vercel project. Otherwise
> Vercel blocks the deployment. This repo is configured with `git config user.email` for that reason.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` | Admin login email ID. |
| `ADMIN_PASSWORD` | Admin login password. Change it here and redeploy to rotate it. |
| `ADMIN_SECRET` | Random secret that signs login cookies. Changing it logs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | Set automatically by the connected Vercel Blob store (`sagessonhatkorea-blob`, Mumbai region). |

---

## Notes

- **Admission form:** the PDF currently in `docs/admission-form.pdf` is a *Model College, Bilaspur* re-admission
  form. Replace it with the school's own form from **Admin → Admission → Admission Form (PDF)**.
- **Placeholders:** names shown in square brackets, such as `[Teacher Name]` or `[Principal's Name]`, are
  placeholders to fill in from the admin panel.
- **Forms:** the contact and registration enquiry forms show a thank-you message but do not send data anywhere yet.
- **Old uploads:** deleting or replacing a photo in the admin panel does not remove the old file from Blob storage.
