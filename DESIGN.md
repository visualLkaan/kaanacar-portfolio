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
  passage: the five sections that follow `#work` directly (`#identity`,
  `#about-me`, `#skills`, `#availability`, `#contact`) — all sharing the
  exact same black so the whole passage reads as one uninterrupted surface,
  never a cut, all the way to the page's last pixel. `--ink` remains the
  surface color for the one true standard content section left (`#work`);
  this exception doesn't extend there. There is no separate `<footer>`
  anymore — `#contact` is the page's final element.

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
  is now the *only* section that still has one. The five scenes that follow it
  through the end of the page (`#identity`, `#about-me`, `#skills`,
  `#availability`, `#contact`) are all deliberate exceptions: none has a
  visible section head, same as the hero — full-bleed cinematic set-pieces,
  not standard content sections. `#contact` used to carry `02`/`03` numeral
  chrome of its own before its redesign into the closing Flowing Menu scene;
  don't reintroduce a numeral there without updating this line.
- **Direct dark-to-dark scene hand-off:** `#work`'s colored background wash
  fades out via `IntersectionObserver` as it leaves the viewport (see
  `js/script.js`), and `#identity` opens on its own opaque `#000` right after
  it — no bridging transition needed between them, the same "no bridging
  needed" pattern already used between `#availability` and `#contact`. Don't
  reintroduce a scroll-controlled crossfade/blackout between two
  already-dark sections; it was only ever needed to bridge the identity
  intro's bright footage into black, and that footage no longer exists here.
- **Stagger-build + group-exit scene** (`#identity`, `#about-me`, `#skills`,
  `#availability`): the pattern these four scenes share, though `#identity`
  is implemented by its own dedicated `js/identity.js` rather than the
  `js/scenes.js` engine the other three use (see that file's own header
  comment for why — a performance requirement that `#identity` specifically
  never run a permanent per-frame animation loop, so it computes its own
  scroll progress inside a single rAF-throttled scroll/resize listener
  instead of joining `js/scenes.js`'s shared lerp-smoothed loop). Each line
  of content (a heading, a fact, a sentence, a card, or — for `#identity`
  specifically — a single character) has its own scroll window and
  stagger-builds in top to bottom — never the whole block fading at once —
  holds fully assembled long enough to read, then the entire content
  container (not the individual lines) fades/blurs/lifts out together as one
  unit before the next scene's own build begins. That container-level group
  exit is what sells "one continuous scene," not four stacked sections —
  never make an individual line exit on its own once this pattern is in use
  elsewhere. `#identity` and `#about-me` used to be one combined scene; they
  were split so the name could be sized as its own focal moment without a
  wall of body copy sharing the frame, and so the About Me passage gets a
  hold proportional to how much of it there actually is to read, rather than
  sharing a hold budget with the facts above it.
- **Split Text line:** a vanilla-CSS take on React Bits' Split Text
  (https://reactbits.dev/text-animations/split-text), used for every
  plain-text line inside the `js/scenes.js`-driven stagger-build scenes
  (headings, the About Me sentences) — each word gets its own tiny cascade
  window within its line's own window, so a line "types itself in" word by
  word rather than fading as one flat block. Structured label/value content
  (fact rows, skill cards, availability items) deliberately skips this and
  reveals as a whole block instead — splitting a "label: value" row
  word-by-word reads as noise, not signal. Don't apply Split Text to
  anything that isn't prose. `#identity`'s own name uses a related but
  separate technique — see `.identity-new__name` below — character-level
  rather than word-level, and implemented independently in `js/identity.js`,
  not this component.
- **`#identity` stays plain black, no ambient background:** an earlier pass
  gave `#identity` its own section-scoped reuse of the site-wide
  `.ambient-blob` mechanism; removed after it read as an unintended purple
  glow behind the name rather than a deliberate lighting cue. A full rebuild
  followed (`.identity-new*`, `js/identity.js`) that never reintroduced it.
  `#identity` matches `#skills`/`#availability` — plain `#000`, no background
  effect. Legibility for the name against that flat black comes from
  `.identity-new__name`'s own static text-shadow bloom instead (see below) —
  a foreground effect, not a background one. `#about-me` keeps its own,
  *different* ambient treatment (`.about-me-glow`, see below) — the one
  remaining scoped ambient exception to "one fixed ambient canvas" that
  `#hero-prism` set the precedent for. Don't reintroduce a background glow on
  `#identity`/`#skills`/`#availability`: one ambient exception per section is
  already spent by `#about-me`.
- **About Me redesign — centered editorial column, upright-Fraunces type,
  static ambient glow, restrained hierarchy** (`#about-me`, see
  `css/style.css`'s ABOUT ME block): a second art-direction pass, replacing
  an earlier left-offset-column version (kept no visible heading from that
  pass; changed everything about the composition itself), documented here so
  a future pass doesn't "fix" these back to something more generic:
  - Still no visible heading (the sr-only `<h2>` is the only "About Me"
    label left for assistive tech) — instead a tiny, understated visual
    label, `.about-me-label` (mono, uppercase, letter-spaced, `--muted`,
    `aria-hidden` since the sr-only heading already covers accessibility) —
    small and quiet on purpose, never competing with the copy below it.
  - `.about-me-copy` is a **true centered column**, not `text-align:center`:
    the column itself sits on the page's horizontal center via
    `margin:0 auto` at a controlled ~680px reading measure (narrower on
    tablet/mobile, never touching the viewport edges), while every line
    inside it stays left-aligned. This replaced an earlier left-offset,
    off-center version (`margin-left:clamp(...)`) that read as stuck to one
    side rather than composed — don't reintroduce that offset without
    updating this line first.
  - `#about-me` lands the column in the upper-middle of the viewport
    (`align-items:flex-start` plus a `clamp()` top padding, not
    `align-items:center`) so the fixed-height composition reads as flowing
    downward through the generous space below it, rather than sitting
    pinned dead-center.
  - Set in upright (non-italic) Fraunces at a large editorial scale — see
    Typography for why this landed here after an Inter-sans pass and a
    centered-italic-Fraunces starting point both read wrong. The centered
    *column* (not centered *text*) is what keeps this from reading as a
    poem/quote despite being centered on the page — the italic ban and the
    left-aligned-lines-inside-a-centered-column rule both still apply.
  - Very subtle typographic hierarchy: the lead sentence stays full opacity;
    the four sentences after it (`.about-me-line--secondary`) settle at a
    static `opacity:0.84` once revealed — a restrained cue, not a second
    color or size. This is a fixed value, not motion, so it's preserved
    under `prefers-reduced-motion` rather than reset to full opacity with
    everything else (see the reduced-motion media query in that same CSS
    block).
  - `.about-me-line` carries a restrained multi-layer `text-shadow` bloom
    (hairline white edge, two low-opacity `--accent-tint` rings, one very
    soft wide `--violet` halo for extra depth) — text stays `--paper` white,
    this only adds felt-not-noticed depth. This is **not** the `.shiny-text`
    component and doesn't count against its one-use ceiling (see Do's and
    Don'ts) — a static ambient bloom is a different, more restrained category
    of effect than the animated gradient-fill/specular-sweep `.shiny-text`
    is. Don't reach for `.shiny-text` here even so; this section's glow is
    intentionally quieter. `#identity`'s own `.identity-new__name` (see
    `js/identity.js` above) carries the same category of static
    `text-shadow` bloom (a hairline dark edge, a tight near-white spec, one
    soft low-opacity `--violet-tint` ring) for the same reason — legibility
    lift against `#identity`'s flat black now that the section has no
    ambient background of its own (see above) — deliberately *not* layered
    under `.shiny-text`'s own edge/depth shadow the way the previous
    (now-removed) Identity implementation did: this rebuild uses `.shiny-text`
    nowhere at all. Kept deliberately smaller-radius/lower-opacity than
    `.about-me-line`'s own rings even though the type is much bigger:
    `.identity-new__name`'s characters animate their own `filter:blur()`
    during entrance (`js/identity.js`) — a wide/strong glow on that same
    blurred element balloons into a visible soft flash mid-entrance instead
    of staying felt-not-noticed.
  - `.about-me-glow`: one static `radial-gradient`, nothing else. Replaced an
    earlier `.about-me-rays` (a vanilla-CSS take on React Bits' Side Rays,
    https://reactbits.dev/backgrounds/side-rays — two heavily blurred conic
    wedges drifting on a slow rotate+scale loop) that read as too much
    motion/weight for what should be a barely-there depth cue, and risked
    the same "unintended purple glow" failure mode the old (now-removed)
    Identity section's own ambient blob produced — see "`#identity` stays
    plain black" above. `--hero-indigo` (the site's own darkest ambient hue,
    already used in the site-wide ambient gradient — see Colors) at
    `rgba(46,30,99,0.16)` fading to fully transparent well inside the
    section's own edges, so top/bottom/left/right stay pure black regardless
    of viewport size. No blur filter, no pseudo-elements, no `animation`, no
    `@keyframes` — one paint, forever; don't reintroduce continuous motion or
    a second hue here without updating this line first.
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
    only, invisible until open) — a third instance of the same narrow, scoped "blurred glow behind
    an interactive element" exception already granted to the Skill ring and the Flowing Menu's
    marquee gradients (see their own bullets; `.about-me-glow` is a related but separate "ambient
    background" exception, not this one — see its own bullet). No card, panel, or box ever appears
    behind an item — just the trigger's own dot motif repeated smaller per item, and plain Geist
    labels directly on the canvas.
  - Each destination auto-maps to an existing section (My Projects → `#work`, Identity →
    `#identity` — name + the Age/Department/Status lines only, a deliberately separate destination
    from About Me's own prose scene right after it — About Me → `#about-me`, Software & Skills →
    `#skills`, Open For → `#availability`, Social Media → `#contact`, whose Flowing Menu already
    carries the real LinkedIn URL). Selecting one runs a custom scroll on the site's own
    `signature-ease`, not the browser default — and, for the four destinations that land inside a
    scroll-scrubbed sticky-pinned *scene* (`#identity`/`#about-me`/`#skills`/`#availability` — the
    latter three built by `js/scenes.js`, `#identity` by its own `js/identity.js`, see Components),
    lands partway into that scene's own track, inside its "hold" window (after every line has built
    in, before its group-exit begins) rather than at the track's raw top, which would otherwise
    show a scene still at opacity:0. These landing points
    are plain literals in `js/fast-travel.js`, kept in manual lockstep with `js/scenes.js`'s own
    range/exitStart constants — the same kind of manual lockstep that file already keeps with its
    CSS track heights, not a new fragility.
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
- **Shiny text:** the gradient-fill/specular-sweep treatment on `.hero-name`,
  factored into a standalone `.shiny-text` class so it can be reused rather
  than redefined. Exactly one use on the whole site — the Hero name — is the
  ceiling, not a floor; the Software & Skills and Open For headings earn
  hierarchy from Poster-family scale/tracking instead, and About Me has no
  heading at all (see Components, About Me redesign) so the question doesn't
  apply there. `#identity`'s name used to be a second use; the rebuilt
  `.identity-new__name` (see Components) deliberately doesn't reach for
  `.shiny-text` at all — its earlier gradient-fill treatment is exactly what
  produced the "purple ghost" artifact this rebuild exists to avoid, and its
  own static `text-shadow` bloom is the same quieter category `#about-me`
  already uses (see below), not a shiny-text use. Don't add a second use
  without removing this line first. `#about-me`'s own soft `text-shadow`
  bloom (see Components) is a deliberately different, quieter category of
  effect and isn't a second use — nor is `#identity`'s own, for the same
  reason.

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
  read as intentional rather than decorative noise. (`#about-me`'s and
  `#identity`'s own quiet, static `text-shadow` blooms are a different, more
  restrained category of effect — see Components — and aren't governed by
  this rule.)
- **Don't** silently widen the type or color system to solve a one-off
  layout problem — if the existing tokens can't express something, that's a
  signal to revisit the layout, not to add a token.
