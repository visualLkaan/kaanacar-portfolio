---
name: Kaan Acar Portfolio
version: alpha
description: >
  Premium-minimal, Apple-inspired editorial portfolio. Dark theater canvas,
  one italic serif register, oversized poster display type, mono-spaced
  index numerals, cinematic easing. Adapted from the DESIGN.md methodology
  (google-labs-code/design.md) to this project's existing visual identity —
  not a reset of it.
colors:
  primary: "#2B4EFF"
  secondary: "#FF5A3C"
  tertiary: "#5B4FE0"
  neutral: "#F5F5F1"
  neutral-dim: "#EAEAE3"
  surface: "#101014"
  on-surface: "#F5F5F1"
  muted: "rgba(245,245,241,0.55)"
  line: "rgba(245,245,241,0.16)"
  primary-tint: "#7C93FF"
  secondary-tint: "#FF9478"
  tertiary-tint: "#9B90F2"
  ambient-1: "#2E1E63"
  ambient-2: "#8F8478"
  ambient-3: "#6B4A52"
typography:
  headline-poster:
    fontFamily: "Bebas Neue"
    fontSize: 3.6rem
    fontWeight: 400
    letterSpacing: 0.01em
  headline-display:
    fontFamily: Fraunces
    fontSize: 1.9rem
    fontWeight: 300
    lineHeight: 1.4
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label-ui:
    fontFamily: Geist
    fontSize: 0.85rem
    fontWeight: 500
    letterSpacing: 0.01em
  label-mono:
    fontFamily: "IBM Plex Mono"
    fontSize: 0.75rem
    fontWeight: 500
    letterSpacing: 0.08em
rounded:
  sharp: 3px
  media: 4px
  pill: 20px
  full: 9999px
spacing:
  edge: clamp(20px, 5vw, 64px)
  frame: 44px
  xs: 6px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 64px
motion:
  signature-ease: "cubic-bezier(.76,0,.24,1)"
  transform-ease: "cubic-bezier(.22,1,.36,1)"
  hover: 300ms
  reveal: 700ms
  page-transition: 550ms
components:
  nav-frame:
    height: "{spacing.frame}"
    typography: "{typography.label-mono}"
  meta-chip:
    padding: "3px 9px"
    rounded: "{rounded.pill}"
    typography: "{typography.label-mono}"
  media-card:
    rounded: "{rounded.media}"
  chrome-dot:
    rounded: "{rounded.full}"
---

## Overview

**Reference point:** a film title sequence crossed with a Pentagram case-study
microsite. A near-black theater canvas, one italic serif line used like a
caption beneath a still frame, oversized condensed poster type for names and
project titles, and mono-spaced index numerals stamped in the corner like a
frame counter on a contact sheet.

This is the specific point the design lives at — not "modern, clean, premium,"
which describes a region a hundred sites occupy. Depth here comes from tonal
contrast and slow cinematic easing, never from shadows, glass, or gradients on
UI chrome. Ambient blur and gradient exist in exactly one place: the fixed
background canvas, procedurally generated, never recreated per section.

This document follows the [DESIGN.md](https://github.com/google-labs-code/design.md)
methodology: prose carries the intent, tokens are reference values that
support it, not instructions to satisfy literally. When a new component or
screen isn't covered below, reason from the Overview and the Do's/Don'ts, not
from the nearest numeric value.

## Colors

One near-black surface, one paper foreground, and exactly two accents — a
cold electric blue that does almost all the work, and a warm coral used so
rarely that it stays meaningful.

- **Surface (`#101014`):** the canvas. Body background, project-page overlay,
  nav frame. Never lightened for "elevation" — elevation is tonal, not additive.
- **Neutral (`#F5F5F1`) / Neutral-dim (`#EAEAE3`):** paper. All primary text,
  all line art, all chrome strokes at reduced opacity (`muted`, `line`).
- **Primary (`#2B4EFF`):** the single interactive/accent signal — section
  numerals, active states, focus rings, the one CTA per view. If a screen
  needs a second point of emphasis, that's a sign to restructure the
  hierarchy, not to reach for another color.
- **Secondary (`#FF5A3C`):** a rare warm counterpoint. Its scarcity is what
  makes it register. It does not appear alongside primary in the same
  component.
- **Tertiary (`#5B4FE0`) + ambient hues (`#2E1E63`, `#8F8478`, `#6B4A52`):**
  reserved for the ambient background gradient only. They never appear on
  typography, borders, or any foreground UI element.
- **Pure black (`#000`):** a deliberate exception to the surface being
  near-black rather than true black, scoped to one continuous cinematic
  passage: the scroll-controlled blackout that closes the identity intro's
  footage (`.intro-blackout`), and the five scenes that build out of it
  (`#identity`, `#about-me`, `#skills`, `#availability`, `#contact`) — all
  sharing the exact same black so the whole passage reads as one
  uninterrupted surface, never a cut, all the way to the page's last pixel.
  `--ink` remains the surface color for the one true standard content
  section left (`#work`); this exception doesn't extend there. There is no
  separate `<footer>` anymore — `#contact` is the page's final element.

## Typography

Five families, each with exactly one job. A reader should be able to name the
role from the typeface alone before reading the words.

- **Poster (Bebas Neue):** the shout — hero name, project titles. Oversized,
  condensed, always regular weight (never bold-on-bold with size).
- **Display (Fraunces, italic by default, light):** the caption voice —
  project subheads, and (as of a second art-direction pass) `#about-me`'s
  editorial passage. Editorial, quiet, never used for anything clickable.
  `#about-me` is the one deliberate exception to "always italic": upright/
  `font-style:normal` there, large-scale (`clamp(1.3rem, 2.4vw, 1.85rem)`),
  left-set in an offset column rather than centered (see Components, About Me
  redesign) — a first pass tried moving this passage to Inter sans entirely
  and centered-italic-Fraunces both read wrong for different reasons (too
  generic/UI-flat, and too quote/poem-like); upright Fraunces in a
  non-centered composition is what actually reads as an editorial statement
  rather than either extreme. Don't reintroduce italic here even though the
  family is back — that combination is what caused the original complaint.
- **Body (Inter):** running copy. The only family that optimizes for
  paragraph reading over character.
- **UI label (Geist):** interactive labels and nav — the "product" register,
  distinct from the "editorial" register above.
- **Mono (IBM Plex Mono):** numerals, timestamps, tags, section indices —
  always uppercase, always letter-spaced. The contact-sheet register.

Sizes are fluid (`clamp()`), not a fixed scale, because the layout is
viewport-driven rather than breakpoint-driven. Trust modest ratios: the poster
headline is large, but body and label sizes stay close together — the
contrast comes from family and case, not from extreme size jumps.

## Layout

Page margins breathe with the viewport (`--edge`, `clamp(20px, 5vw, 64px)`)
rather than snapping to fixed breakpoints. The nav/frame chrome holds a
constant height (`44px`) regardless of scroll or section, so the "frame"
around the content never shifts — only what's inside it changes.

Internal spacing is not yet a strict numeric scale; treat `xs/sm/md/lg/xl`
above as the intended rhythm for anything new, rather than inventing one-off
values.

## Elevation & Depth

Flat. Hierarchy comes from surface/paper contrast and from the blurred
ambient gradient sitting behind everything — not from drop shadows, card
elevation, or glass/blur on foreground chrome. (The prior glass-morphism
experiment was deliberately removed — don't reintroduce translucent blurred
panels on interactive surfaces.)

## Shapes

Two registers, no in-between:

- **Circular** (`rounded.full`) for anything mechanical/chrome — nav dots,
  cursor rings, small icon frames.
- **Near-sharp** (`rounded.sharp` 3px / `rounded.media` 4px) for cards, media,
  and containers — architectural, not soft.
- **Pill** (`rounded.pill` 20px) exists for exactly one thing: small mono
  meta-chips/tags. It is not a general button radius.

Never introduce a mid-soft radius (8–16px) — it sits between these two
registers and reads as generic SaaS, not editorial.

## Motion

Motion is the clearest signal of "premium" here, more than any single color
or font. Two curves cover the entire site:

- `signature-ease` (`cubic-bezier(.76,0,.24,1)`): the cinematic decelerate.
  Used for scroll reveals, nav transitions, the hero→project-page
  clone-and-grow transition. Slow in, settles hard — never bounces, never
  overshoots.
- `transform-ease` (`cubic-bezier(.22,1,.36,1)`): a snappier variant for
  carousel/card transforms that need to feel physically thrown, not just
  faded.

Guidance:

- Hover/interactive feedback: ~300ms.
- Scroll reveals (opacity + translateY): ~600–800ms, `signature-ease`.
- The project-page transition is the site's signature moment: multiple
  properties (position, size, shadow) animate together on `transform-ease`
  over ~550ms, so a card visibly grows into the overlay rather than cutting.
- Nothing animates with plain `ease`/`linear` where the outcome should feel
  cinematic — reach for the two curves above, not a new one.
- `prefers-reduced-motion` already collapses all animation/transition to
  none (see `css/style.css`); any new motion must respect this, not just the
  motion that already existed.

## Components

- **Nav frame:** fixed 44px chrome, mono labels, circular dot/ring accents.
- **Meta chip:** small pill (20px radius), mono label, used for tags/metadata
  only — never for primary actions.
- **Media card:** near-sharp radius (4px), no shadow; hover state changes
  filter/box-shadow subtly, never lifts with a shadow.
- **Section numeral / index label:** mono, `primary` color, precedes every
  section heading — the site's recurring "frame counter" motif. `#work` (`01`)
  is now the *only* section that still has one. The cinematic identity intro
  (`#about`) and the five scenes from there through the end of the page
  (`#identity`, `#about-me`, `#skills`, `#availability`, `#contact`) are all
  deliberate exceptions: none has a visible section head, same as the hero —
  full-bleed cinematic set-pieces, not standard content sections. `#contact`
  used to carry `02`/`03` numeral chrome of its own before its redesign into
  the closing Flowing Menu scene; don't reintroduce a numeral there without
  updating this line.
- **Scroll-controlled scene transition:** the identity intro's footage ends on
  an empty sky, and rather than cutting to the next section, continued scroll
  pulls a full-bleed pure-black overlay (`.intro-blackout`) from transparent
  to opaque — overlapped with the last ~30% of the frame-scrub itself (well
  past the footage's own baked reveal) rather than as a separate stage after
  it, so the darken reads as earlier and needs no scroll distance of its own
  — still inside `#about`'s own pin, so there's no pin/unpin boundary
  mid-transition — holds briefly at fully black (one short, deliberately
  brief beat, not a long pause), then hands off to `#identity`, which opens
  already black. Every stage is a direct, reversible function of scroll
  position, no timers, same discipline as the volumetric titles below.
- **Stagger-build + group-exit scene** (`#identity`, `#about-me`, `#skills`,
  `#availability`, see `js/scenes.js`): the pattern these four scenes share.
  Each line of content (a heading, a fact, a sentence, a card) has its own
  scroll window and stagger-builds in top to bottom — never the whole block
  fading at once — holds fully assembled long enough to read, then the entire
  content container (not the individual lines) fades/blurs/lifts out
  together as one unit before the next scene's own build begins. That
  container-level group exit is what sells "one continuous scene," not four
  stacked sections — never make an individual line exit on its own once
  this pattern is in use elsewhere. `#identity` and `#about-me` used to be one
  combined scene; they were split so the name could be sized as its own
  focal moment without a wall of body copy sharing the frame, and so the
  About Me passage gets a hold proportional to how much of it there actually
  is to read, rather than sharing a hold budget with the facts above it.
- **Split Text line:** a vanilla-CSS take on React Bits' Split Text
  (https://reactbits.dev/text-animations/split-text), used for every
  plain-text line inside the stagger-build scenes above (headings, the name,
  the About Me sentences) — each word gets its own tiny cascade window
  within its line's own window, so a line "types itself in" word by word
  rather than fading as one flat block. Structured label/value content (fact
  rows, skill cards, availability items) deliberately skips this and reveals
  as a whole block instead — splitting a "label: value" row word-by-word
  reads as noise, not signal. Don't apply Split Text to anything that isn't
  prose.
- **Section-scoped ambient reveal:** `#identity`'s background reuses the
  site-wide `.ambient-blob` mechanism (see Elevation & Depth) rather than
  inventing a new gradient language for one section — the same narrow,
  deliberate exception to "one fixed ambient canvas" that `#hero-prism`
  already set a precedent for. `#about-me` gets its own, *different* ambient
  treatment (`.about-me-rays`, see below) rather than reusing `.ambient-blob`
  — a second scoped exception, explicitly requested, not a loosening of the
  rule. `#skills`/`#availability` still have none: one ambient exception per
  section is the limit, and two consecutive glowing sections (`#identity` →
  `#about-me`) is already the ceiling for how often this repeats back to
  back — don't add a third in `#skills`.
- **About Me redesign — no heading, upright-Fraunces editorial type, masked
  ambient rays, soft text bloom** (`#about-me`, see `css/style.css`'s ABOUT ME
  block): explicit art direction broke this one passage from several rules
  that hold everywhere else on the site, each documented here so a future
  pass doesn't "fix" them back:
  - No visible heading (the sr-only `<h2>` is the only "About Me" label left)
    — the copy itself is the composition's focal point.
  - Body copy left-set in an offset column (`.about-me-copy`, `margin-left`
    a clamped percentage, not centered) rather than the centered-block
    convention every other scene here uses — the asymmetric negative space is
    the art direction, not an oversight.
  - Set in upright (non-italic) Fraunces at a large editorial scale — see
    Typography for why this landed here after an Inter-sans pass and a
    centered-italic-Fraunces starting point both read wrong.
  - `.about-me-line` carries a restrained multi-layer `text-shadow` bloom
    (hairline white edge, two low-opacity `--accent-tint` rings, one very
    soft wide `--violet` halo for extra depth) — text stays `--paper` white,
    this only adds felt-not-noticed depth. This is **not** the `.shiny-text`
    component and doesn't count against its two-use ceiling (see Do's and
    Don'ts) — a static ambient bloom is a different, more restrained category
    of effect than the animated gradient-fill/specular-sweep `.shiny-text`
    is. Don't reach for `.shiny-text` here even so; this section's glow is
    intentionally quieter.
  - `.about-me-rays`: a vanilla-CSS take on React Bits' Side Rays
    (https://reactbits.dev/backgrounds/side-rays) — two heavily blurred conic
    wedges converging from the top-right corner, tinted with the existing
    `--accent-tint`/`--violet-tint` (no new hues), opacity ≤0.16, drifting on
    a slow rotate+scale loop. Same "reimplement the effect in vanilla
    CSS/JS, don't pull in the library" convention as Split Text and Shiny
    Text below. `mask-image` confines it to a soft ellipse behind the text
    column rather than letting it read across the full section — edges of
    the section stay pure black on purpose, so the light reads as coming
    from behind the typography, not from the page itself, and the section
    doesn't feel visually disconnected from the black canvas around it.
- **Skill confidence ring** (`#skills`, see `.skill-ring`): a radial
  stroke-dasharray ring, not a linear progress bar — deliberately, since a
  resume-style bar reads as a rating out of a checklist rather than a
  considered signal. Ring fill is tied to the same scroll progress driving
  its card's own entrance, so it fills in as the card arrives. Each software's
  brand color is allowed to appear in exactly two places on its card — a
  heavily blurred, low-opacity glow behind the logo badge, and the ring's
  stroke — never as a flat color block, per the Colors section's "used so
  rarely it stays meaningful" spirit extended narrowly to this one component.
- **Contact scene — Flowing Menu** (`#contact`, see `.flow-item`/`.flow-marquee`
  in `css/style.css`, `js/flow-menu.js`): the page's final scene, replacing
  the old numbered "Let's talk" section and `<footer>` entirely. A vanilla
  CSS/JS take on React Bits' Flowing Menu
  (https://reactbits.dev/components/flowing-menu) — source read directly from
  its GitHub repo before porting, same reimplement-don't-import convention as
  Split Text/Shiny Text/Side Rays. Four always-visible rows (Poster-family
  labels); hovering (desktop) or tapping (touch) reveals a marquee band
  sliding in from whichever edge — top or bottom — the cursor entered
  nearest, carrying that platform's logo and handle/email looping
  horizontally, `signature-ease` throughout. Each row's marquee background is
  a soft, low-alpha gradient in that platform's own brand colors over a pure
  `#000` base — a second explicit brand-color exception alongside the Skill
  ring above (same "used so rarely it stays meaningful" spirit): never the
  source's flat white marquee, never fully saturated, always restrained.
- **Fast Travel — radial Option Wheel** (`#fast-travel`, see the FAST TRAVEL block in `css/style.css`,
  `js/fast-travel.js`): the site's only navigation, fixed at the viewport's left-center, shown/hidden
  in lockstep with `#site-header`. Started as an *additional* quick-nav alongside the header's own
  Work/About/Contact link list; once it covered every destination, the header nav was removed
  entirely (not hidden) and the bottom frame bar's "SCROLL XX%" readout went with it in the same
  pass — `#site-header` now holds only the logo. By default shows only the plain "Fast Travel" label
  (Geist, matching the removed header nav's own type role) plus one small `--accent` dot; hovering
  (desktop) or tapping (mobile/tablet) opens seven destinations fanned around it. A vanilla-CSS/JS
  take on React Bits' Option Wheel
  (https://reactbits.dev/components/option-wheel), reimplemented rather than pulled in — same
  "port the effect, don't import the library" convention as Split Text/Shiny Text/Side
  Rays/Flowing Menu above. Two deliberate departures from the source, both because the trigger sits
  at the left edge rather than in open space:
  - Items fan across a right-opening arc (`--ft-arc`, ~168° desktop / ~195° mobile — widened from an
    initial ~150°/190° pass once a seventh item made the original spacing feel tight) rather than a
    full 360° ring — a full ring would clip off the left edge of the viewport. Only `scale`/`opacity`
    animate between closed/open; each item's angle and radius stay constant, so the reveal reads as
    items growing out from the trigger along a fixed arc, not repositioning.
  - "Premium" comes from this site's own vocabulary, not glass/blur/drop-shadow — the Elevation &
    Depth rule against additive shadows/glass on foreground chrome still applies here. Depth is one
    restrained ambient glow behind the wheel (`.fast-travel__glow`: blurred, low-opacity, `--accent`
    only, invisible until open) — a fourth instance of the same narrow, scoped "blurred glow behind
    an interactive element" exception already granted to the Skill ring, `.about-me-rays`, and the
    Flowing Menu's marquee gradients (see their own bullets). No card, panel, or box ever appears
    behind an item — just the trigger's own dot motif repeated smaller per item, and plain Geist
    labels directly on the canvas.
  - Each destination auto-maps to an existing section (My Projects → `#work`, Who I Am → `#about`
    — the identity intro's own baked "WHO I AM" reveal — Identity → `#identity` — name + the
    Age/Education/Degree/Current Status facts only, a deliberately separate destination from About
    Me's own prose scene right after it — About Me → `#about-me`, Software & Skills → `#skills`,
    Open For → `#availability`, Social Media → `#contact`, whose Flowing Menu already carries the
    real LinkedIn URL). Selecting one runs a custom scroll on the site's own `signature-ease`, not
    the browser default — and, for the four destinations that land inside a scroll-scrubbed
    sticky-pinned *scene* (`#identity`/`#about-me`/`#skills`/`#availability`, all built by
    `js/scenes.js`), lands partway into that scene's own track, inside its "hold" window (after
    every line has built in, before its group-exit begins) rather than at the track's raw top, which
    would otherwise show a scene still at opacity:0. `#about` is the deliberate exception: "Who I
    Am" always resets to that track's literal top (frame 0 of the Blender scrub, entry veil fully
    opaque) rather than landing mid-sequence — chosen specifically so this destination re-plays the
    same opening a first-time visitor sees, not a jump into the timeline. These landing points are
    plain literals in `js/fast-travel.js`, kept in manual lockstep with `js/scenes.js`/
    `js/intro-scroll.js`'s own range/exitStart constants — the same kind of manual lockstep those two
    files already keep with their CSS track heights, not a new fragility.
  - **Hover forgiveness**: `.fast-travel__hit-zone`, a large invisible circle centered on the exact
    same anchor point the items themselves radiate from (so it inherently spans the trigger and every
    item's own reach, with no dead space between), is the primary fix for "the wheel closes while
    moving toward an item" — geometry first, not just a timer. It's the *first* child inside
    `.fast-travel__wheel`, so items painted after it in the DOM still win hit-testing over their own
    pixels and stay independently clickable; only the gaps between items fall through to it. Its
    `pointer-events` only turn on once `.open`, so it never shadows ordinary page content while
    closed. A 300ms close-delay debounce (`CLOSE_DELAY` in `js/fast-travel.js`) sits behind that as a
    second line of defense for whatever the geometry doesn't catch (an overshoot past the circle, a
    fast diagonal flick) — belt-and-suspenders, not either/or.
- **Volumetric scroll title:** a three-phase emerge → hold → pass-through
  treatment for type that needs to read as physically present in a scrubbed
  scene, not pasted over it — used for the identity intro's name/role/school
  lines. Driven directly by scroll position every frame (no CSS transitions,
  so it reverses exactly on scroll-up): blur 20px→0 and a slight upward
  settle on entry, a brief near-static hold at full clarity, then blur
  0→16px with scale continuing past 1 as it exits, selling "the camera
  passed through it" rather than a flat fade. Reuses existing values rather
  than inventing new ones — the same `perspective(1600px)` and ~6°
  `rotateX` settle the hero name already uses. Scoped to one use so far;
  don't reach for it as a generic reveal-on-scroll utility (`.reveal` still
  owns that job) — it's specifically for type meant to feel embedded in a
  moving scene.
- **Shiny text:** the gradient-fill/specular-sweep treatment on `.hero-name`,
  factored into a standalone `.shiny-text` class so it can be reused rather
  than redefined. Exactly two uses on the whole site — the Hero name and the
  identity scene's repeated "KAAN ACAR" — is the ceiling, not a floor; the
  Software & Skills and Open For headings earn hierarchy from Poster-family
  scale/tracking instead, and About Me has no heading at all (see Components,
  About Me redesign) so the question doesn't apply there. Don't add a third
  use without removing this line first. `#about-me`'s own soft `text-shadow`
  bloom (see Components) is a deliberately different, quieter category of
  effect and isn't a third use.

## Do's and Don'ts

- **Do** treat the ambient background as the only place gradients, blur, and
  the tertiary/ambient hues are allowed to live.
- **Do** keep every numeral, timestamp, and tag in mono, uppercase, tracked.
- **Do** reach for `signature-ease` or `transform-ease` for anything that
  should feel premium; don't invent a third curve without a specific reason.
- **Do** respect `prefers-reduced-motion` for every new animation, no
  exceptions.
- **Don't** add a second accent color to a single component — primary and
  secondary don't appear together.
- **Don't** use Bebas Neue or Fraunces italic outside their one assigned
  role (poster headline / editorial caption, respectively). `#about-me`'s
  upright (non-italic) Fraunces is the one sanctioned exception to "always
  italic" — don't add italic back there, and don't use upright Fraunces
  anywhere else without updating this line first.
- **Don't** introduce drop shadows, glass/blur panels, or gradients on
  foreground UI chrome (nav, buttons, cards) — depth is tonal, not additive.
- **Don't** use a mid-soft border radius (8–16px) anywhere; it's circular or
  near-sharp, nothing in between.
- **Don't** add a hero-style glow, shine sweep, or shimmer to more than one
  moment per page — scarcity is what makes the existing shiny-text accent
  read as intentional rather than decorative noise. (`#about-me`'s quiet,
  static `text-shadow` bloom is a different, more restrained category of
  effect — see Components — and isn't governed by this rule.)
- **Don't** silently widen the type or color system to solve a one-off
  layout problem — if the existing tokens can't express something, that's a
  signal to revisit the layout, not to add a token.
