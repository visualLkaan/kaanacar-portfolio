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

## Typography

Five families, each with exactly one job. A reader should be able to name the
role from the typeface alone before reading the words.

- **Poster (Bebas Neue):** the shout — hero name, project titles. Oversized,
  condensed, always regular weight (never bold-on-bold with size).
- **Display (Fraunces, italic, light):** the caption voice — about-page copy,
  project subheads. Editorial, quiet, never used for anything clickable.
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
  section heading — the site's recurring "frame counter" motif.

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
  role (poster headline / editorial caption, respectively).
- **Don't** introduce drop shadows, glass/blur panels, or gradients on
  foreground UI chrome (nav, buttons, cards) — depth is tonal, not additive.
- **Don't** use a mid-soft border radius (8–16px) anywhere; it's circular or
  near-sharp, nothing in between.
- **Don't** add a hero-style glow, shine sweep, or shimmer to more than one
  moment per page — scarcity is what makes the existing shiny-text accent
  read as intentional rather than decorative noise.
- **Don't** silently widen the type or color system to solve a one-off
  layout problem — if the existing tokens can't express something, that's a
  signal to revisit the layout, not to add a token.
