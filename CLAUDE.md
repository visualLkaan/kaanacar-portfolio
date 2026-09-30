# kaan-acar-portfolio

Personal portfolio of **Kaan Acar**, Visual Communication Design student
(Bahçeşehir University, Istanbul). A static, buildless, vanilla HTML/CSS/JS
site: cinematic loader, scroll-scrubbed Hero, a 3D project carousel, and a
chain of scroll-pinned "scenes" (Identity → About Me → Skills → Open For →
Contact).

This file is the permanent hand-off context for future Claude Code sessions.
**The code is the source of truth.** `js/*.js` and `css/style.css` carry very
long "why" comments. Read the comment next to anything before you change it.
`TODO.md` is a July 2026 session log. It is useful history, but it is **stale**:
it predates the September mobile-crash work, the `project/<id>/` pages,
`js/project-data.js` and the cover fixes. Where it disagrees with the code,
trust the code. `README.md` is also outdated. For example, it says `PROJECTS`
lives in `js/script.js`.

---

## Design system

`DESIGN.md` (repo root) is the source of truth for this project's visual
identity — colors, typography, spacing, motion, shapes, and explicit
Do's/Don'ts. It follows the DESIGN.md methodology (prose carries intent;
tokens are reference values, not literal instructions) adapted to this
site's own brand: premium minimalism, Apple-inspired craftsmanship,
cinematic motion, dark editorial canvas.

Before making any UI/CSS/motion change:

1. Read `DESIGN.md`.
2. Evaluate whether the change strengthens or weakens the existing design
   language (colors, type roles, spacing rhythm, shape register, easing
   curves).
3. If it weakens consistency, choose an alternative that fits the existing
   system and explain why — don't introduce a new color, font role, radius,
   or easing curve as a one-off fix.
4. If `DESIGN.md` itself needs to evolve (a genuinely new pattern, not a
   one-off), update it deliberately alongside the code change, not silently.

Key house rules drawn from DESIGN.md and the code:
- Signature ease is `cubic-bezier(.76,0,.24,1)`. The "transform ease" is `cubic-bezier(.22,1,.36,1)`.
- Border radii are either circular or near-sharp. Never use 8–16px.
- Gradients and blur belong only to ambient backgrounds, never to UI chrome.
- Every animation must respect `prefers-reduced-motion`.
- The code prefers deterministic motion (sine hashes) over `Math.random`. The loader crowd is the one deliberate exception, because it is a verbatim port.
- Effects taken from React Bits (Split Text, Shiny Text, Flowing Menu, Option Wheel, Prism) are **re-implemented in vanilla JS/CSS**, never installed as libraries.
- GSAP is scoped to the loader only.

---

## Stack & files

No build step, no package.json, no framework. Every third-party library is **self-hosted** under
`assets/vendor/` (no CDN except Google Fonts):
`gsap/gsap.min.js` (loader only), `pdfjs/pdf.min.mjs` + `pdf.worker.min.mjs` (live PDF
rendering), `three/three.module.min.js` + `three.core.min.js` (Prism WebGL only).

```
index.html                 Homepage shell (loader, hero, #work, #project-page dialog, scenes, contact)
css/style.css              All styles (one file)
js/project-data.js         PROJECTS array + asset-path resolution + pdf.js pipeline + palette
                           extraction + PROJECT_MEDIA_MOBILE_TIER flag. Shared by homepage and project pages.
js/project-render.js       ProjectRender.renderInto(): builds a project's head + gallery (with FLIP
                           enlarge) or video player. Shared by desktop dialog and project pages.
js/script.js               Homepage only: loader, afterLoader() gating, hero, Prism mount,
                           desktop 3D ring, mobile single-card carousel, desktop dialog.
js/project-page.js         Standalone project page controller (project/<id>/index.html only).
js/prism-bg.js             Hero WebGL Prism (dynamic import, desktop only)
js/identity.js             #identity scroll scene (dynamic import, desktop only)
js/scenes.js               #about-me / #skills / #availability scroll scenes (dynamic import, desktop only)
js/fast-travel.js          Radial "Fast Travel" wheel, the site's ONLY navigation
js/flow-menu.js            #contact Flowing-Menu marquee rows
project/<id>/index.html    One static shell per project (14), all byte-identical -- the project is
                           resolved from the URL slug. Loads project-data.js + project-render.js + project-page.js.
assets/hero/frames/        frame-001..126.webp (3840x2160) + manifest.json {count:126,width,height,pad:3}
assets/loader/peeps.png    Open Peeps sprite sheet for the loader crowd (15x7 grid)
assets/projects/<id>/      Production media per project (see mappings below)
assets/skills/, assets/contact/   Logos used in #skills and #contact
```

Script load order is part of the contract: `window.SITE_ROOT_HREF` inline script →
`project-data.js` → `project-render.js` → `script.js` (homepage) or `project-page.js` (project pages).
`SITE_ROOT_HREF` is `'./'` in `index.html` and `'../../'` in every `project/<id>/index.html`.
`project-data.js` uses it to resolve **every** PROJECTS path to an absolute URL once. The fix
exists because relative paths used to 404 on project pages. Keep project paths written
site-root-relative (`assets/projects/...`).

Unreferenced but tracked (don't assume they're used): `assets/intro.mp4`,
`assets/fonts/BebasNeue-Regular.ttf` (Bebas comes from Google Fonts), `loader/skiper39.tsx`
(the original React source the loader crowd was ported from).

---

## Desktop vs mobile/tablet architecture (the most important concept)

The site has **two tiers**. They are split by the same check everywhere:

```js
var coarse = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var w = coarse ? Math.min(innerWidth, innerHeight) : innerWidth;
mobileTier = coarse && w <= 1024;     // PROJECT_MEDIA_MOBILE_TIER in project-data.js
```

- Pointer type is checked **first**. A landscape iPad reports more than 1024px of width but is still the
  same memory-limited device, so coarse-pointer devices use the smaller of width and height.
- A desktop browser window resized narrow is **still desktop**. The fine pointer never matches.
- CSS mirrors this with
  `@media (pointer:coarse) and (max-width:1024px), (pointer:coarse) and (max-height:1024px)`.
- A few older checks use a plain `innerWidth <= 1024` or `prismTierWidth <= 1024` variant. The
  hero micro-parallax, for example, uses `window.innerWidth <= 1024`. Leave them as they are unless
  you are fixing a real bug.

**Desktop** gets the full cinematic experience:
- Loader, then the scroll-scrubbed 126-frame hero canvas.
- WebGL Prism, the cursor-parallax name and ambient blobs.
- The 3D ring carousel with live PDF-rendered covers and hover video previews.
- An in-page `#project-page` dialog for projects.
- Scroll-pinned reveal scenes.

**Mobile/tablet** is intentionally a plain, natively scrolling document. This is **stability-first**:
real iPhone/iPad devices crashed (iOS silently kills or reloads tabs that exceed memory):
- Hero shows **one static `<img>`** (`assets/hero/frames/frame-001.webp`). There is no canvas pipeline,
  no manifest fetch and no scroll listener.
- **No Prism.** `prism-bg.js` and Three.js are never even fetched. WebGL context creation crashed
  real devices even at the lightest tier.
- No ambient blob loop, no hero cursor parallax, no hero scroll scale/blur, no `.reveal` observer.
  `.reveal` elements are forced visible by CSS.
- `identity.js` and `scenes.js` return early. Scroll tracks collapse to `min-height:100svh`, so content
  is shown already built.
- The loader crowd gets fewer peeps (floor of 20 at ≤430px) and smaller peeps (scale 0.55 at ≤430px).
- The Work carousel is a **separate implementation** (`buildMobileWork()`), not a restyle of the ring.
  See below.
- Projects open on **separate pages** (`project/<id>/`), not the in-page dialog.
- The homepage **never** instantiates a project's PDF or video. That includes palette sampling.

---

## Mobile performance & crash-prevention rules (do NOT regress)

1. Never load pdf.js, render a PDF, create a `<video>`, or buffer a project video on the
   mobile/tablet **homepage**. Mobile cards and wash colors use only static images:
   `coverMobile || cover || coverFallback`.
2. Never mount WebGL (Prism/Three.js) on mobile/tablet. Never start permanent rAF loops there
   (ambient blobs, hero parallax, scene engines).
3. Mobile carousel invariant: **exactly one `.carousel-card` in the DOM**, at most **2 cover images
   resident** (the active one plus one off-DOM `Image()` neighbor preload). A monotonically
   increasing `mobileGen` counter discards stale async loads. There is no queue: rapid taps
   converge directly on the last project. An earlier attempt (the 3D ring on mobile with an eviction
   window) still crashed under rapid left/right navigation. **Do not bring the ring back on mobile.**
4. Mobile cover visibility: an `img.onload` listener is always attached, and `img.decode()` is only an
   optimization. `decode()` alone was a confirmed bug: some mobile browsers reject it, and covers
   silently never appeared.
5. The play icon is hidden and shown with **inline `style.display`**, never the `hidden` attribute.
   The CSS `display:flex` rule on it overrides `[hidden]`.
6. Mobile hero: one static frame only. The desktop frame decoder uses `createImageBitmap` with a
   crop-then-resize to the canvas backing size. Decoding the full 3840px width of 126 frames on a
   portrait phone was a real multi-hundred-MB crash. Frames load with a concurrency of 6.
7. On mobile, `will-change` is removed from `#hero`, `#hero-prism`, `.hero-name-wrap` and `.hero-content`,
   because nothing animates them there.
8. Loader safety nets: `failOpen()` at a hard 12s ceiling, on sprite load error, on reduced motion or
   when GSAP is missing. Everything non-critical is deferred via `afterLoader()`, then trickled out one
   callback per idle slice (`requestIdleCallback`). `#work-carousel` is registered with `{priority:true}`.
9. `coverMobile` files (about 1400px on the longest edge) exist so the mobile card never decodes a
   full-resolution gallery plate. Keep using them.

---

## Loader

- `#loader` has two **fully independent** systems. Do not couple them:
  - **Crowd:** a canvas port of Skiper 39 "Crowd Canvas" (Open Peeps + GSAP), verbatim logic,
    including its `Math.random`.
  - **Typography:** "WELCOME / to my / PORTFOLIO" with per-character GSAP timelines. The timing
    constants are `CROWD_LEAD_MS 600` and `HOLD_MS 2000`.
- An earlier version redirected the peeps into letter formations. The user **explicitly rejected it**.
  Don't reintroduce crowd-forms-text.
- `playReveal()` cross-dissolves the loader into the hero. On complete it runs `loader.remove()` and
  then `markLoaderDone()`.
- **Mobile back/forward:** if the Navigation Timing type is `back_forward` on the mobile tier, the
  loader is skipped entirely (`failOpen()`), so returning from a project page restores the homepage
  instead of replaying the intro. Desktop always replays the loader.
- The canvas backing scale is fixed at 1 (no DPR multiply). The sprite sheet is pre-decoded via
  `createImageBitmap`.

## Hero

- `#hero` is `position:sticky` inside `#hero-scroll-track`, which gives about 1700px of scroll runway
  (`SCROLL_RANGE = 1700`, kept in step with the CSS).
- **Desktop:** the scroll position drives a canvas that paints the preloaded WebP frame sequence
  (`assets/hero/frames`). It never scrubs a `<video>`: video seeking was the original stutter cause.
  Details:
  - Frames start preloading during the loader hold.
  - Progress is lerped (0.09).
  - It falls back to the nearest loaded frame.
  - `.hero-content` gets a tiny scale/lift/fade near the end.
- A separate desktop-only micro-parallax applies a scale up to 1.02 and a blur up to 1.5px to `#hero`
  as it scrolls away.
- The desktop cursor parallax moves `#hero-name-wrap` a few px and Prism less.
- "KAAN ACAR" uses a CSS shiny-text treatment (Geist 700). It is the page's single "shine" moment.
- **Prism:** desktop only, mounted after the loader with `{maxPixelRatio:1.75, steps:64}`. It uses a
  fixed violet/indigo identity and **never** follows the Work palette. It is masked out of the
  text area.
- Reduced motion: the track collapses to one viewport, and frame 0 is painted statically.
- Mobile: the static `frame-001.webp` `<img>` (`.hero-bg-mobile-frame`), and the track is `min-height:100svh`.

## Hero → Projects (Work) color transition

- The Work section has its own fixed full-viewport `.work-bg`: a blurred two-radial `__wash`.
  Desktop also gets 26 deterministic particles. It fades in via the `.in-view` class, toggled by an
  IntersectionObserver on `#work`, and fades out when Work leaves.
- Wash colors are the CSS `@property --wash-a/--wash-b` (`<color>`, initial `#14141a`). They have a
  1.5s transition, so the browser genuinely interpolates the hue between projects. There is never a
  hard cut.
- Colors are **extracted live** from each project's main image (`getProjectPalette()` in
  project-data.js): a 48×48 canvas, a quantized histogram and the two most distinct clusters. Results
  are cached per project id. `WASH_PALETTE` is only a fallback.
- **Desktop:** the observer threshold is 0.12. The palette source is the cover, or PDF page 1, or a
  video frame. The particle and tilt rAF loop runs only while `#work` is in view.
- **Mobile** makes the handoff continuous rather than a "pop":
  - (a) Palette extraction for **LinkA** (the mobile initial project) starts immediately at script
    start, in parallel with the loader.
  - (b) The observer uses `rootMargin: '15% 0px 35% 0px'`, so the wash starts while the Hero is still on
    screen.
  - (c) `mobileUpdateWash()` sets the fallback color **synchronously**, so the wash never sits at the
    near-black initial value, then crossfades to the extracted color.
- `#work` → `#identity`: Identity opens on opaque `#000`, and the wash fades out on its own. It is a
  plain dark-to-dark cut.

## Projects / Work section

`PROJECTS` in `js/project-data.js` is the **single source of truth**. The carousel, the dialog and the
project pages are all generated from it, and no project data lives in HTML or CSS. Adding a project
means three things: add a `PROJECTS` entry, add media under `assets/projects/<id>/`, and add a
`project/<id>/index.html` copied from any existing shell. The shells are byte-identical.

Fields:

| Field | Meaning |
|---|---|
| `type` | `'image'` or `'video'`. |
| `cover` | A static cover image, used on both tiers. |
| `pdf` | The desktop card renders page 1 live. The gallery shows pages 2+, or pages 1+ if `cover` exists. |
| `pdfPagesInGallery: false` | The PDF only supplies the cover; the gallery comes from `extraImages`/`autoImages`. |
| `extraImages` | Static gallery plates appended after the PDF pages. |
| `autoImages` | Probes `photo1`, `photo2`, … in the browser until a 404. |
| `images` | An explicit array of gallery images (linka). |
| `video` | The full video. It is only ever loaded in the dialog or on the project page. |
| `videoPreview` | A muted, looping card preview. Desktop only. |
| `coverFallback` / `coverMobile` | Mobile card-only static images. `coverMobile` takes priority. |
| `description` | An optional blurb in the project head. |

The Work section has **three distinct levels**:
1. The carousel of covers.
2. The project view (gallery or video).
3. The enlarged image.

The user explicitly rejected merging the project view into the ring as a "mode" (July 2026).
Keep them separate.

### Desktop carousel (3D ring)
- A CSS 3D ring (`perspective` / `rotateY` / `translateZ`). **No Three.js/WebGL for the ring**
  (this was an explicit user preference).
  - All 14 cards stay in the DOM. The ring recenters with `translateZ(-radius)` so the front card isn't blurry.
  - Card depth (scale, opacity) is a function of angle, and cards more than 100° from the front get
    `pointer-events:none`. This works around a hit-testing bug.
- Controls:
  - Drag: capture happens only after 10px of movement, so plain clicks still work.
  - Inertia is capped at ±14, then the ring snaps.
  - The wheel moves **one card per gesture** (threshold 42, 320ms gap) and only when the pointer is
    over a card.
  - Arrow keys also step one card. Enter/Space opens the card.
- Idle autoplay runs after 5s idle: a 3.4s sine-eased step, then a 3.2s hold. It pauses while hovering,
  and reduced motion disables it. (A stale comment in `buildRing`'s header says there is no autoplay;
  the code does run it.)
- Starts at index 0 (WHO I AM).
- Cover loading:
  - `buildProjectCard()` only builds the DOM and returns `startCover()`.
  - `ensureNeighborhoodLoaded()` starts the active card plus its two neighbors.
  - `queueBackfillCover()` loads the rest one at a time in idle slices.
- Info panel (bottom-left): number / title / category / year, swapped with a WAAPI fade.
- Click → `flyIntoProject()`: the cover is cloned and grown with FLIP to fill the viewport with a
  brightness pulse (850ms), then `openProjectPage()` opens the `#project-page` dialog.

### Desktop video hover behavior
- The preview only plays on **mouseenter of the active (centered) card**. Off-center cards stay paused on
  their first frame. On mouseenter it sets `currentTime = 0` and calls `play()`. On mouseleave it
  pauses, resets to 0 and removes `.is-playing`.
- `videoPreview` projects **without** a `cover` (who-i-am, reach, fight-club-titles, fight-club-soap)
  get a `<video preload="auto">` whose `src` is only set when `startCover()` runs (neighborhood or
  backfill). They show no play icon.
- `videoPreview` projects **with** a `cover` (**ev-tanitim-videosu** only) show the static cover JPG. The
  `<video>` is created **on first hover only** (`createDeferredPreview()`), sits at opacity 0, and fades in
  on the `playing` event, so the cover never flashes blank.
- Video projects with no `videoPreview` would get a tone gradient plus a ▶ icon. None exist currently.

### Mobile/tablet carousel (`buildMobileWork()`)
- One card, ‹ › buttons, a swipe of at least 40px advances one step, and arrow keys work too.
  WAAPI swaps the info panel.
- The initial project is **LinkA**, looked up by id and not by index. This avoids starting on a video
  project.
- The cover uses `object-fit:contain` over a blurred, scaled `.carousel-card__cover-bg` of the same
  image, so portrait title cards fill the landscape frame. **Never crop or substitute the main photo.**
- The ▶ icon shows for `type:'video'` only.
- **Mobile video behavior:** the card never touches video. It shows the static
  `coverFallback`/`cover` plus ▶.
- A tap navigates to `project/<id>/`, which is a real page load.

## Project detail views

- **Desktop dialog** (`#project-page` in index.html):
  - `ProjectRender.renderInto()` fills it, and body scroll is locked.
  - Tab focus is trapped. ✕ or Escape closes it, and Escape first collapses an enlarged image.
  - Focus returns to the card. The contents clear after 520ms.
  - **No URL or history change.** No deep links (an intentional scope cut).
- **Standalone page** `project/<id>/index.html`:
  - Used by mobile and also reachable directly on any device.
  - The slug comes from the URL (`/project/<id>/`). An unknown slug shows "Project not found".
  - Sets `document.title = "<title> — Kaan Acar"`. No loader, hero or script.js: only this
    project's media.
  - It reuses the `#project-page` styles as a plain page (`class="project-page open"`) with a `←` back
    link to `../../index.html`.
- Rendering (shared by both views):
  - Image gallery: a horizontal strip (drag or wheel scroll, lazy `<img>`). Clicking an image
    FLIP-enlarges it; a scrim click or Escape collapses it. PDFs show "Loading gallery…" until the
    pages render at scale 2.
  - Video page: `<video controls playsInline src=video>` with no autoplay. With no `video` it shows a
    placeholder.

## Navigation & browser history

- **Fast Travel** (a left-center radial wheel) is the **only** navigation. The header Work/About/Contact
  links and the scroll-% readout were deliberately removed. Only the `KA` logo (`#top`) remains.
- Fast Travel has six destinations: `#work`, `#identity`, `#about-me`, `#skills`, `#availability` and
  `#contact`.
  - Desktop opens it on hover, mobile on tap.
  - It scrolls with a custom rAF using the signature ease, into each scene's "hold" window
    (`TRACK_TARGETS`). On collapsed tracks (mobile or reduced motion) it just scrolls to the section top.
  - Then it runs `history.pushState(null,'',hash)`.
- Mobile homepage, handled by an inline `<head>` script in index.html:
  - A **reload** sets `history.scrollRestoration='manual'`, so the page lands at the Hero.
  - Back/forward keeps `'auto'`, so the browser restores the Projects scroll position.
  - Don't make this blanket. A blanket version broke back navigation.
- Mobile project page:
  - The ← link pauses the video and clears its `src` first, because video teardown made Back feel slow.
  - If the referrer is same-origin and history exists, it calls `history.back()`; otherwise it follows
    the href. This, plus the loader's `back_forward` skip, is why Back returns to Projects instead of
    replaying the loader.
- Mobile enlarge history:
  - Enlarging an image pushes `{projectEnlarge:true}`, so the hardware or gesture Back collapses the
    image instead of leaving the page.
  - Closing it by any other means calls `history.back()`. One open always costs exactly one Back.
- Desktop: none of these history tweaks apply. The coarse-pointer gate makes them no-ops.

## Scenes after Work (brief)

- `#identity` ("KAAN ACAR", AGE: 21, DEPARTMENT, STATUS) uses its own rAF-throttled listener that goes
  idle when settled. It has no permanent loop.
- `#about-me`, `#skills` (6 cards with confidence rings and brand-color glow) and `#availability` use the
  shared `scenes.js` engine: build, then hold, then a group exit.
- `#contact` is the Flowing Menu with Instagram @kaanaccr, school mail, main mail and LinkedIn.
- All scroll-driven on desktop. All static and fully visible on mobile and under reduced motion.

---

## Asset rules — "main photo" covers vs actual project files

Every project has a designated **"main photo"**: a plain **presentation title card** (project name,
category, contact line). It is **not** the finished artwork.
- The main photo is the **cover** (carousel card).
- The real work (mockups, posters, illustrations, video) is the **project content**. It is shown in
  the gallery or video page, never as the cover.

In the reference folders the user marks them by filename: `main photo…pdf`, `Main Photo mola.jpeg`,
and `main video.mp4`.

The rule: the card cover must come from the designated main photo. The real artwork goes in the
detail-page gallery as `extraImages` under its own filename.
- **Past bug, do not repeat:** covers for kanye-west, breaking-the-grid, messi, scarface, white-noise,
  didot-specimen and unknown-place were previously pointed at the finished artwork, or rendered from
  the wrong PDF. The fix:
  - Each mobile cover JPG was rendered from the main-photo PDF's page 1, offline (Windows PdfDocument
    API).
  - It was committed as `coverFallback` plus a roughly 1400px `coverMobile`.
  - The artwork was kept as a separate `extraImages` plate.
- An `<img>` cannot display a PDF. That is the only reason these JPG previews exist. The **main-photo
  PDF itself is authoritative and must never be modified.**
- **Never generate, redraw, upscale, crop or substitute replacement assets.** Use only files the user
  provides. When the user adds new media (usually into a `reference*/` or `references/` folder):
  - **copy** it into `assets/projects/<id>/` with a clean kebab-case name, keeping the original;
  - then wire it into `PROJECTS`.
- The hero frames are untouched 4K sources; optimization happens at decode time, not by degrading
  files. `coverMobile` and preview re-encodes are the only sanctioned derived files.
- The root-level source folders are the user's originals. Don't delete, move or rename them without
  asking:
  - `reference2`–`reference12` and `references/`;
  - `ev tanıtım videosu/`, `WHO I AM/`, `who i am video/` and `hero background reference/`;
  - `MAIN PROBLEM/` and `last session/` (screen recordings of past bugs);
  - `screenshots/` (cover screenshots) and `loader/`.

  They are tracked in git and deployed, but not referenced by the site.

## Current project mappings (PROJECTS order = carousel order)

| # | id | Title / category | Desktop card | Mobile card (`coverMobile`→`cover`→`coverFallback`) | Detail content |
|---|---|---|---|---|---|
| 1 | `who-i-am` | WHO I AM — Blender / 3D Motion (video) | hover preview `who-i-am.mp4` | `cover-fallback.jpg` + ▶ | `who-i-am.mp4` (same file for preview & full) |
| 2 | `linka` | LinkA — E-Dating App, UI/UX (image) | `cover.jpg` | `cover.jpg` (**mobile initial**) | `plate-01..06.jpg` (`images`) |
| 3 | `white-noise` | WHITE NOISE — Book Cover | PDF p1 of `white-noise.pdf` (= `reference2/main photo book cover.pdf`, 1 page) | `bookcover-mockup-mobile.jpg` (title card) | `white-noise-mockup.jpg` (real 3D mockup, 5000×3240) |
| 4 | `kanye-west` | KANYE WEST — Editorial Design | PDF p1 of `kanye-west.pdf` | `kanye-west-cover-mobile.jpg` | `kanye-west.pdf` pages 2+ |
| 5 | `breaking-the-grid` | BREAKING THE GRID — Swiss Style | PDF p1 of `breaking-the-grid.pdf` (25MB) | `breaking-the-grid-cover-mobile.jpg` | `breaking-the-grid.pdf` pages 2+ |
| 6 | `didot-specimen` | DIDOT TYPE SPECIMEN — Typography | PDF p1 of `didot-specimen.pdf` (= `reference5/main photo didot.pdf`) | `didot-type-specimen-mobile.jpg` | `didot-specimen-poster.jpg` only (`pdfPagesInGallery:false`, the PDF's other pages are a case-study deck) |
| 7 | `reach` | REACH — Animation / Music Video | hover preview `reach-preview.mp4` | `cover-fallback.jpg` + ▶ | `reach-full.mp4` |
| 8 | `fight-club-titles` | FIGHT CLUB — Title Sequence | hover preview `fight-club-titles.mp4` (~81MB, same file as full) | `cover-fallback.jpg` + ▶ | `fight-club-titles.mp4` |
| 9 | `unknown-place` | UNKNOWN PLACE — Book Cover | PDF p1 of `unknown-place.pdf` (= `reference8/main photo8 unknown place.pdf`) | `unknown-place-cover-mobile.jpg` | `photo1.jpeg` via `autoImages` (add `photo2…` to extend) |
| 10 | `fight-club-soap` | Fight Club Soap — 3D Product Visualization | hover preview `fight-club-soap.mp4` | `cover-fallback.jpg` + ▶ | `fight-club-soap.mp4` |
| 11 | `scarface` | SCARFACE — Alternative Film Poster | PDF p1 of `main-photo.pdf` (= `reference10/main photo10 scarface.pdf`) | `scarface-artwork-mobile.jpg` | `scarface-illustration.jpg` (render of `reference10/scarfaceee.pdf`) |
| 12 | `messi` | MESSI — Illustration | PDF p1 of `main-photo.pdf` (= `reference11/main photo11 messi.pdf`) | `messi-artwork-mobile.jpg` | `messi-illustration.jpg` (render of `reference11/messi worldcup.pdf`) |
| 13 | `mola` | MOLA — Brand Identity | `main-photo.jpeg` (= `reference12/Main Photo mola.jpeg`) | `main-photo.jpeg` | `mola-brand-identity.pdf`, **all** pages incl. p1 (has its own `cover`) |
| 14 | `ev-tanitim-videosu` | EV TANITIM VIDEOSU — House Tour Video | static `cover.jpg`, deferred hover preview | `cover.jpg` + ▶ | `ev-tanitim-videosu.mp4` |

Notes:
- The "=" equivalences were verified byte-identical with `cmp`.
- `kanye-west.pdf` and `breaking-the-grid.pdf` are **not** byte-identical to their `reference3`/`reference4`
  "main photo" PDFs. The code comments say the mobile JPGs were rendered from the designated main-photo
  PDF. Confirm the page-1 content visually before changing those covers.
- Asset file names are historical. Trust the fields, not the file names: `scarface-artwork.jpg` and
  `messi-artwork.jpg` are the **title cards**, while `*-illustration.jpg` is the real artwork.
  Likewise `bookcover-mockup.jpg` is the title card and `white-noise-mockup.jpg` is the mockup.
- The desktop card for pdf projects never uses `coverFallback`/`coverMobile`. Those fields are mobile
  only (plus the mobile palette source).

## "EV TANITIM VIDEOSU" (house tour video) — intended behavior

- The id is `ev-tanitim-videosu` (ASCII slug), the title is `EV TANITIM VIDEOSU` and the category is
  `House Tour Video`. Its page is `project/ev-tanitim-videosu/index.html`.
- The original source is `ev tanıtım videosu/ev tanıtım videosu (2).mp4`.
  `assets/projects/ev-tanitim-videosu/ev-tanitim-videosu.mp4` is a **byte-identical copy** (verified,
  about 48MB). It is moov-first, so it streams. Do not re-encode or replace the full video.
- `ev-tanitim-videosu-preview.mp4` is a separate silent 960px re-encode (about 1.8MB), used only as the
  desktop hover preview. This mirrors reach's preview/full split.
- `cover.jpg` is a single frame extracted offline, never in the browser. It is the card on **every**
  tier and the mobile palette source.
- Desktop:
  - The card shows the static cover.
  - The preview `<video>` is only created on the **first hover of the active card**. It is never
    touched by the backfill queue.
  - It fades in over the cover once it is playing.
  - Clicking opens the dialog with the full video.
- Mobile: the cover plus ▶, with no video element on the homepage. A tap opens the project page, which
  shows the full original video with controls.
- It is the only project with both `cover` and `videoPreview`. Keep that pattern for any future
  "cover-first" video project.

---

## Running locally

A static server is required. Dynamic `import()` (Prism, scenes, fast-travel, pdf.js) and `fetch`
(the hero manifest) do not work from `file://`.

```bash
npx http-server -p 8080 -c-1     # or: python -m http.server 8000 (Python isn't installed on this machine)
# open http://localhost:8080/  and a project page: http://localhost:8080/project/linka/
```

- To test the mobile tier, use real devices or DevTools device emulation with touch, because tiering
  keys off the **pointer type**. Resizing a desktop window only changes widths, not the tier.
- There are no automated tests. Past sessions verified with ad-hoc Playwright scripts in the scratchpad.
  Nothing is checked in.

## GitHub & Netlify deployment

- Remote: `origin https://github.com/visualLkaan/kaanacar-portfolio.git`, branch **`main`**. The git
  user is Kaan Acar (acarkaan768@gmail.com).
- Netlify serves the repo as a plain static site. There is no build command, and the site root is the
  repo root (`index.html`). There is **no `netlify.toml`, `_redirects` or `_headers` in the repo**, so
  the Netlify site settings (URL, linked repo, auto-deploy) live only in the Netlify dashboard. Check
  there rather than assuming.
- The history shows "Portfolio ready for Netlify" (2026-07-31). Since then the workflow has been:
  1. commit to `main`;
  2. `git push origin main`;
  3. Netlify deploys the pushed commit.

  Confirm in the dashboard that auto-deploy from GitHub is on.
- Commit/push only when the user asks. Recent commits use conventional prefixes (`feat:` / `fix:`).
- Large files: GitHub rejects files over 100MB. The largest tracked files are around 81MB
  (`fight-club-titles.mp4` and its `reference7` original). Check sizes before adding new video.
- The `project/<id>/` links rely on the host serving `index.html` for directory URLs, which Netlify and
  http-server both do.

## Important constraints (must not change without explicit user request)

- Keep the architecture:
  - static, buildless and vanilla;
  - self-hosted vendor libs;
  - GSAP only in the loader;
  - no WebGL for the carousel.
- Keep the desktop/mobile split and every mobile crash-safety rule above. A desktop change must not
  leak into the mobile tier, and a mobile change must not alter desktop.
- `PROJECTS` stays the single data source, and `project-data.js` / `project-render.js` stay shared
  (never duplicated).
- Keep the `SITE_ROOT_HREF` + absolute-URL resolution.
- Keep the three-level Work architecture:
  - carousel → project view → enlarged image;
  - desktop uses the dialog, mobile uses the standalone pages.
- Mobile initial project = LinkA; desktop starts at index 0.
- Covers come from the designated main photos, and the real artwork goes in the galleries. Never
  modify the main-photo PDFs or the original videos.
- Fast Travel is the only nav. Don't re-add the header links or the scroll % readout.
- Prism keeps its fixed violet/indigo identity and does not react to project palettes.
- Loader: the crowd and the type stay independent (no crowd-forms-text), and the mobile
  back_forward loader skip stays.
- Keep the reload-only `scrollRestoration='manual'` on mobile.

## Mistakes previously made — don't repeat

- Pointing card covers at finished artwork or the wrong PDF instead of the designated main photo
  (7 projects; fixed Sept 2026).
- Relative asset paths from `project/<id>/` pages. Videos and PDFs 404'd until `SITE_ROOT_HREF` was
  added.
- Running the 3D ring (even with image eviction), Prism, WebGL, blob/parallax loops or the scene engines
  on phones. These caused real iOS crashes and reloads.
- Decoding full-width 4K hero frames on portrait phones (a memory blow-up).
- Relying only on `img.decode()` for mobile covers (they silently never showed).
- Hiding the play icon with the `hidden` attribute (CSS overrides it).
- A blanket `scrollRestoration='manual'` (broke Back), and plain-href Back links on mobile, which
  replayed the loader instead of returning to Projects.
- Calling `setPointerCapture` on every pointerdown on the ring (broke card clicks).
- Rendering PDF page 1 twice (once for the cover, once for the palette). It is cached once now
  (`getPdfPageOneUrl`).
- The absolutely positioned "add a src" video placeholder permanently covering a real video. It is only
  appended when there is no `video`.
- Making the project detail a second mode of the rotating ring (rejected by the user).
- Scrubbing hero `<video>.currentTime` (stutter). Replaced by the frame sequence.
- Starting mobile on a video project (who-i-am). Mobile now starts on LinkA.
- Leaving the mobile wash at its near-black initial value until the palette resolved (a color "pop").
- Blindly redesigning or rebuilding working systems (loader, carousel, project page, scenes). If
  something looks wrong, treat it as a bug in the existing implementation, not a reason to rebuild.
