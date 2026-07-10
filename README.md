# Kaan Acar — Portfolio

A cinematic, name-driven portfolio concept for a visual communication design student.

## How to view it

No build step needed. Just open `index.html` in a browser, or run a local server:

```
cd kaan-acar-portfolio
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## What makes the hero different

Your name — KAAN ACAR — fills the screen in a condensed poster typeface (Bebas Neue),
with a colored gradient visible only through the letterforms. The gradient drifts on
its own and reacts to your cursor, like light passing through frosted glass. This is
the page's one signature move: your identity isn't announced with a label, it's felt
as the first thing on screen.

A thin cinema-style letterbox frame runs along the top and bottom of the hero
(inspired by widescreen film framing), carrying your role and location as small
printed labels, then retracts once you scroll past it.

A fine film-grain texture sits over the whole page at low opacity for a tactile,
premium feel rather than a flat digital one.

## File structure

```
index.html        → page structure and copy
css/style.css      → design tokens, layout, all styling
js/script.js       → loader sequence, cursor-reactive hero, scroll reveals, work carousel
assets/            → put your real images/video here
```

## What to personalize before publishing

1. **Work section** — three levels, all generated entirely from the
   `PROJECTS` array at the top of `js/script.js`. Add, remove or edit
   projects there only — nothing in `index.html` or `style.css` needs to
   change.
   - **Level 1, the homepage carousel** (`#work-carousel`): a 3D ring (CSS
     `perspective`/`rotateY`/`translateZ` + JS, no Three.js) of the project
     covers only. Drag, scroll, or arrow keys rotate it.
   - **Level 2, the project page** (`#project-page`): clicking a cover
     triggers a cinematic clone-and-grow transition into a genuinely
     separate full-viewport page for that project — an ordered horizontal
     gallery of its own images (`images` array/count) for `type: 'image'`
     projects, or a clean video page for `type: 'video'` ones. This is not
     another rotating ring; the case-study images never appear inside the
     homepage carousel.
   - **Level 3, the enlarged image**: clicking any gallery image grows it to
     fill most of the viewport; Escape or the scrim returns to the gallery,
     Escape again (or the ✕ button) returns to the homepage carousel.
   - Most tiles are still gradient placeholders drawn from the
     `TONE_PALETTE` cycle (an `images` field that's just a number =
     placeholder count, `supporting` = placeholder count alongside a video)
     — swap these for real images/video once you have final project media.
     For a project with real photos already in hand, give it a
     `cover: 'assets/projects/<id>/cover.jpg'` field (shown, uncropped, as
     the carousel card) and set `images` to an **array** of real image
     paths in display order instead of a number — see the `linka` entry for
     a working example.
2. **About portrait** — same approach: swap the `.portrait` placeholder for a
   real photo.
3. **Copy** — update the bio, tools, city, and contact email/socials in
   `index.html`.
4. **Colors** — all colors are CSS variables at the top of `style.css`
   (`--paper`, `--ink`, `--accent`, `--accent-2`). Change the accent colors to
   match your own brand if cobalt/coral isn't your palette.

## Accessibility

- Respects `prefers-reduced-motion`: loader, grain, and the cursor-reactive
  gradient are all disabled for users who request reduced motion.
- All interactive elements have visible keyboard focus states.
- Layout is responsive down to mobile widths.
