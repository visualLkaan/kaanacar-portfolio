# Project TODO / Session Log

Working log for the kaan-acar-portfolio site. Written at the end of a session that touched
the loader, the hero/global background, and a full rebuild of the Work section. Read this
before starting the next session.

## Completed this session (2026-07-30, part 3): Fast Travel becomes the site's *only* navigation --
header Work/About/Contact removed, bottom-bar scroll-% readout removed, a 7th "Identity" destination
added

Direct follow-up to part 2 below (same day). User was satisfied Fast Travel worked and asked for
convergence: fold "Identity" (name + facts, separate from the About Me prose scene) in as a new
destination, then delete the two navigation surfaces Fast Travel had made redundant -- the header's
own Work/About/Contact link list, and the bottom frame bar's "SCROLL XX%" readout -- rather than
leaving them alongside it.

- **New "Identity" destination** (`index.html`, `js/fast-travel.js`): inserted between "Who I Am"
  and "About Me" in both the visual order and the `--i` values (0-6 now, was 0-5), targeting
  `#identity` -- the first black section right after the Blender cinematic (name + Age/Education/
  Degree/Current Status only), explicitly distinct from `#about-me`'s own prose passage. Landing
  point: `t=0.66` inside `identity-scroll-track` (range 1972, exitStart 0.688) -- this scene's own
  hold window is unusually narrow (only 0.043 wide, per `js/scenes.js`'s own comment on why its hold
  was cut so short in an earlier session), so the margin on either side of 0.66 is tighter than the
  other destinations get, by necessity of the scene itself rather than a looser landing choice here.
- **Arc widened for the 7th item**: `--ft-step`'s divisor moved `5 -> 6` (six gaps for seven items,
  was five for six) and `--ft-arc` opened up `150deg -> 168deg` desktop / `190deg -> 195deg` mobile,
  `--ft-radius` `170px -> 182px` desktop / `126px -> 134px` mobile -- reasoned to keep roughly the
  same per-item angular/pixel spacing as the 6-item version rather than letting the extra item
  compress everything, not measured against a real render.
- **Header nav removed entirely** (`index.html`, `css/style.css`): `<header id="site-header">` now
  contains only the `<a class="logo">` -- the `<nav><ul>` of Work/About/Contact links, and its
  corresponding `nav ul`/`nav a`/`nav a::after`/`nav a:hover::after` CSS, are gone, not hidden.
  `header`'s own `justify-content:space-between` (meaningless with a single child now) was dropped
  too. Fast Travel's own doc comments (top of `js/fast-travel.js`, the FAST TRAVEL block in
  `css/style.css`, the DESIGN.md Components bullet) updated to stop describing it as "additional,
  alongside the header nav" now that it's the only nav on the page.
- **"SCROLL XX%" readout removed**: the `<span id="scroll-pct">` in `#frame-bottom` (`index.html`)
  and its updating IIFE in `js/script.js` ("Scroll progress in bottom frame bar") are both deleted,
  not just hidden -- `#frame-bottom` now holds only "ISTANBUL, TR". No replacement was requested or
  added; the bottom frame bar is intentionally asymmetric against the top bar's two labels now, a
  direct consequence of removing the scroll UI outright rather than an oversight.
- Verified: `node --check` on both touched JS files, CSS brace balance (288/288), confirmed
  `scroll-pct`/`<nav>` are gone from `index.html`, confirmed all seven `data-target` hashes
  (`#work`/`#about`/`#identity`/`#about-me`/`#skills`/`#availability`/`#contact`) resolve to a real
  id in the document, zero duplicate ids. **Still no live browser check** -- `mcp__claude-in-chrome`
  failed to attach a tab again this session. The one thing most worth a real look: whether the
  widened arc actually gives seven items comfortable, non-overlapping spacing at real viewport
  widths (especially the ~760px mobile breakpoint), and whether `#identity`'s tight 0.043-wide hold
  window is forgiving enough in practice given the custom scroll's own settle time.

## Completed this session (2026-07-30, part 2): Fast Travel refinements -- hover-forgiveness
geometry, two destination-landing fixes, bigger hit targets

Direct follow-up to part 1 below (same day). Navigation itself worked; user flagged four polish
items: the wheel still occasionally closed while moving from the trigger toward an item; About Me
should land squarely on the fully-built, already-centered composition, "not before or after it";
Who I Am should always reset the Blender sequence to frame 0 ("exactly like the first website
visit"), not land mid-timeline; and each wheel item's hover target should be a bit more forgiving.

- **Hover-forgiveness bug, root-caused (not just patched with a longer delay)**: the trigger's own
  painted box and the nearest wheel item can sit 100px+ apart (the arc's radius) -- `mouseleave`
  fired on `#fast-travel` the instant the cursor left the trigger, before reaching an item, closing
  the wheel mid-transit even though `mouseenter` correctly re-fired once the cursor landed on an
  item (mouseenter/mouseleave key off DOM ancestor-chain membership, not continuous screen coverage).
  Fixed at the geometry level, not just the timer: a new `.fast-travel__hit-zone` (`index.html`,
  `css/style.css`) is one large invisible circle centered on the exact same anchor the items
  themselves radiate from, sized past the outermost item's reach -- there is now no empty space to
  cross between trigger and wheel. It's the first child inside `.fast-travel__wheel` so items
  painted after it in the DOM still win hit-testing over their own pixels (stay independently
  clickable); its `pointer-events` only turn on once `.open`, so it never shadows ordinary page
  content while closed. The 300ms `CLOSE_DELAY` debounce from the previous pass (bumped 200->300ms
  per this session's ask) stays as a second line of defense for whatever the circle doesn't catch,
  not a replacement for fixing the geometry.
- **Bigger hover targets**: the trigger's own clickable box grew via `padding:20px 16px` offset by
  a matching `margin:-12px -12px` -- the padding increase (not the full new padding value) is what
  the negative margin cancels, so the visible dot+label sit exactly where they did before and
  `#fast-travel`'s own auto-height (which the wheel/glow's `top:50%` anchor is computed against)
  doesn't shift either; net a 24px-taller/24px-wider invisible hit box with zero visual movement.
  Each `.fast-travel__item`'s own padding grew `6px 4px` -> `12px 16px` -- simpler, no compensating
  margin needed there, since items are already self-centered on their circle point via their own
  `translate(-50%,-50%)`, so growing the box symmetrically doesn't move it.
- **Who I Am -> #about now resets to frame 0**: `TRACK_TARGETS['#about'].t` in `js/fast-travel.js`
  changed `0.42 -> 0`, i.e. the literal top of `intro-scroll-track` -- `targetY = trackTop + 0*range`
  -- which reproduces a first-time-visitor's exact state (frame 0 drawn, all three titles hidden,
  entry veil fully opaque), not a mid-sequence moment. Previously this landed just past the video's
  own baked "WHO I AM" reveal (~frame 336); that was a reasonable first guess but the user was
  explicit this destination means "start over," not "jump to a specific frame."
- **About Me landing point retuned for margin, not just repositioned**: `TRACK_TARGETS['#about-me'].t`
  `0.58 -> 0.54`. `js/scenes.js`'s own stagger constants put that scene's 5th (last) line finishing
  its build at t~0.521 and its group-exit starting at exitStart=0.652 -- a fully-built "hold" window
  only 0.131 wide. Landing at 0.58 (the previous middle-of-hold guess) worked but left only a 0.072
  buffer before the exit; 0.54 lands just past the build finishing (maximum margin on both sides,
  0.019 after build / 0.112 before exit) so a visitor reliably sees the composition "immediately,"
  fully centered, comfortably before any exit motion could begin.
- **`DESIGN.md` updated deliberately alongside this**: the Fast Travel bullet's landing-point
  paragraph corrected to describe `#about` as the deliberate frame-0 exception rather than grouping
  it with the other three "lands mid-hold" destinations, and a new sub-bullet documents the
  hit-zone's geometry-first approach to hover forgiveness (the circle as the primary fix, the delay
  as backup, not either/or).
- Verified: `node --check` on `js/fast-travel.js`, CSS brace balance (292/292), confirmed
  `.fast-travel__hit-zone` present in both `index.html` and `css/style.css`, zero duplicate ids
  introduced. **Still no live browser check** -- `mcp__claude-in-chrome` failed to attach a tab again
  this session, consistent with every session in this file's history. The hit-zone's actual on-screen
  forgiveness (does the circle really cover the full arc at every breakpoint, does 300ms feel
  "premium" rather than laggy) and the two retuned landing points are reasoned from the exact
  constants in `js/scenes.js`/`js/intro-scroll.js`, not measured against a real scroll/hover pass --
  worth a live check when possible.

## Completed this session (2026-07-30): Fast Travel added -- a new, independent radial quick-nav,
left-center of the viewport, alongside (not replacing) the existing header

User asked for a "premium navigation shortcut" modeled on React Bits' Option Wheel
(https://reactbits.dev/components/option-wheel). First check of the request against the actual
code found no existing left-side vertical icon nav anywhere -- only the top `#site-header` (logo +
Work/About/Contact) -- so this was clarified with the user via AskUserQuestion before building:
keep the header exactly as-is, Fast Travel is additive, not a replacement.

- **New component**: `#fast-travel` (`index.html`, right after `</header>`), styled in a new FAST
  TRAVEL block in `css/style.css`, behavior in a new `js/fast-travel.js` (mounted via the same
  lazy-`import()` code-split convention as `js/scenes.js`/`js/intro-scroll.js`/`js/flow-menu.js`,
  shown/hidden in lockstep with `#site-header`'s own three `.show` call sites in `js/script.js`).
  Fixed at the viewport's left-center; by default shows only "Fast Travel" (Geist, matching the
  header nav's own type role) plus one small `--accent` dot.
- **Reimplemented, not imported**, same convention as this project's other React Bits ports (Split
  Text/Shiny Text/Side Rays/Flowing Menu). Two deliberate departures from the source, both because
  the trigger sits at the left edge rather than in open space: items fan across a right-opening
  ~150deg arc (`--ft-arc`) instead of a full 360deg ring (a full ring would clip off the left edge);
  and depth comes from one restrained ambient `--accent` glow behind the wheel rather than
  glass/blur/drop-shadow, since DESIGN.md's elevation rule keeps depth tonal on foreground chrome --
  a fourth instance of the same narrow "blurred glow behind an interactive element" exception
  already granted to the Skill ring / `.about-me-rays` / Flowing Menu marquee. `DESIGN.md` updated
  deliberately alongside this with a new Components bullet documenting both departures.
- **Six items, auto-mapped to existing sections** by reading the actual content, not guessed: My
  Projects -> `#work`, Who I Am -> `#about` (the identity intro's own baked "WHO I AM" reveal, per
  `js/intro-scroll.js`'s own comment -- not `#identity`, which has no heading of its own), About Me
  -> `#about-me`, Software & Skills -> `#skills`, Open For -> `#availability`, Social Media ->
  `#contact`.
- **Custom cinematic scroll, not the browser default**: `js/fast-travel.js` implements its own
  cubic-bezier solver (Newton-Raphson, same technique browsers use internally) for the site's exact
  `signature-ease` (`cubic-bezier(.76,0,.24,1)`), then drives `window.scrollTo` on it via `rAF`.
  Five of the six destinations are scroll-scrubbed, sticky-pinned scenes whose content is only
  fully built partway into their own track -- a bare anchor jump would land on frame 0 of the
  Blender scrub or a scene still at opacity:0. `TRACK_TARGETS` in `js/fast-travel.js` instead lands
  each one inside its own scene's "hold" window (every line built, before the group-exit begins),
  computed from the exact `range`/`exitStart`/stagger constants already in `js/scenes.js`/
  `js/intro-scroll.js` -- kept as plain literals in manual lockstep with those files' own numbers,
  same kind of lockstep those two already keep with their CSS track heights.
- **Social Media / LinkedIn**: per the user's brief, fixed the pre-existing `#contact` Flowing
  Menu's LinkedIn row -- `href="#"` was a deliberate placeholder from the 2026-07-28 part 7 session
  (no URL had been given then) -- to the real profile URL the user provided this session
  (`target="_blank" rel="noopener noreferrer"`, matching the Instagram row's own pattern). Fast
  Travel's own "Social Media" item scrolls to `#contact`, where that real link now lives; no second,
  separate social-links UI was built inside the wheel itself, since the Flowing Menu is already an
  extensible list of rows -- adding another platform later means adding another `.flow-item`, not
  new architecture.
- **Interaction**: hover (desktop, `(hover:hover) and (pointer:fine)`) or click/tap opens the wheel;
  Escape closes and refocuses the trigger; clicking outside closes it; `aria-expanded`/`tabindex`
  are kept in sync so wheel items aren't Tab-reachable while closed. The wheel's own open/close
  motion is plain CSS transitions on `.open`, so the sitewide `*{ transition:none !important }`
  reduced-motion rule already makes it instant with zero extra code; the rAF scroll is explicit
  JS, not CSS, so `js/fast-travel.js` checks `prefers-reduced-motion` itself and jumps instantly
  instead of animating when it's set.
- Verified: `node --check` on `js/fast-travel.js` and the touched `js/script.js`, a CSS
  brace-balance count (290/290), and a script cross-checking every id `js/fast-travel.js` references
  against `index.html` (all resolved, zero duplicate ids introduced). **No live browser check this
  session** -- `mcp__claude-in-chrome` failed to establish a tab group on every retry (`tabs_context_mcp`
  errored each time), same as every session before it per this file's own history; a throwaway Node
  static server was started/killed cleanly again but never got a browser attached. The one thing
  most worth a real look once possible: the radial arc's actual on-screen geometry (item spacing/
  overlap at real viewport widths, especially the ~760px mobile breakpoint's tighter 190deg arc),
  and whether the five computed scroll-hold landing fractions in `TRACK_TARGETS` actually land where
  intended -- they're reasoned directly from `js/scenes.js`/`js/intro-scroll.js`'s own constants,
  not measured against a real scroll.

## Completed this session (2026-07-28, part 7): #contact completely rebuilt as a Flowing-Menu-style
closing scene, replacing the old "Let's talk" section and <footer> entirely

User wanted the whole Contact/footer area gone and replaced with an interaction modeled on React
Bits' Flowing Menu (https://reactbits.dev/components/flowing-menu): four always-visible rows
(Instagram / School Mail / Main Mail / LinkedIn), each revealing a brand-logo marquee on hover/tap
instead of the source's plain text-on-white treatment, over a soft brand-color gradient instead of
white, on a pure-black background with no visible seam from the section above. User dropped a
`last session/` folder with the four logo PNGs and a 10s screen recording of them interacting with
the actual reactbits.dev demo page.

- **Reference verified two ways before building, not guessed**: fetched the component's actual
  source (`FlowingMenu.jsx`/`.css`) directly from `github.com/DavidHDev/react-bits` to get the real
  mechanics (GSAP-driven: marquee slides in from whichever edge -- top or bottom -- the cursor
  entered nearest, `y:±101% -> 0%` on the window plus a counter-sliding inner content layer, a
  separate continuous horizontal auto-scroll via `x:-contentWidth` looped); and extracted frames
  from the user's own recording (`ffmpeg`, already on PATH, same technique used for the two earlier
  screen-recording bug reports this session) to confirm the actual on-page behavior matched the
  source read. Also verified via `ffprobe`/pixel-sampling that all four provided logo PNGs have real
  alpha transparency (Instagram is palette-indexed with a transparent entry, the other three are
  plain rgba) before wiring them in, same diligence as the earlier skill-logo session.
- **`<footer>` removed entirely, `#contact` extended to `background:#000`**: no separate footer
  chrome remains anywhere on the page -- `#contact` is now the page's literal last element, sharing
  the exact same pure black as `#identity`/`#about-me`/`#skills`/`#availability` above it (see
  DESIGN.md Colors) so there's no visible section boundary. The dead `#back-to-top` click handler in
  `js/script.js` was removed along with the button (was already a safe no-op via its own `if
  (!btn) return`, but this was a deliberate full removal, not a toggle, so it was cleaned up too).
- **Ported, not copy-pasted -- two deliberate mechanical departures from the source**, both
  documented inline in `js/flow-menu.js`: (1) the hover-reveal transform and the continuous
  horizontal scroll are split across two separate elements (`.flow-marquee` for the Y
  transition, its child `.flow-marquee__track` for the X keyframe) instead of the source's single
  GSAP-driven element, since a CSS `transition` and `animation` can't cleanly share one element's
  `transform` and this project deliberately keeps GSAP scoped to the loader's crowd canvas only
  (per an earlier session's own note in this file); (2) marquee repetitions are cloned from one seed
  element at init (`buildTrack`, 10 repeats x 2 groups, animated exactly -50% for a seamless loop)
  rather than the source's resize-aware dynamic recalculation -- simpler, safe for content this
  short. The reveal itself replicates the source's real subtlety: entering near the top of a row
  slides the marquee in from the top, entering near the bottom slides it from the bottom, and
  leaving mirrors whichever edge the cursor exits through -- computed via `getBoundingClientRect`
  same as the source's `findClosestEdge`. A `transition:none` + forced-reflow step handles the case
  the source solves with GSAP's `.set()`-then-`.to()`: jumping instantly to the new entry edge
  before animating in, so re-entering from the opposite edge never sweeps across the whole row.
- **Brand-color gradients, not the source's flat white marquee**: each row's marquee background is
  a `linear-gradient` in that platform's own colors (Instagram pink/purple/orange, Teams
  blue/indigo, Gmail blue/red/yellow, LinkedIn deep blue) at low alpha (0.24-0.5) over a `#000`
  base -- muted, never at full brand saturation. Framed and documented in `DESIGN.md` as a second
  explicit brand-color exception alongside the Skills section's existing per-card glow precedent,
  not a general loosening of "no extra colors."
- **Content**: Instagram -> `https://www.instagram.com/kaanaccr/` (constructed directly from the
  handle the user gave, not invented) opens in a new tab; School Mail -> `mailto:kaan.acar@
  bahcesehir.edu.tr`; Main Mail -> `mailto:acarkaan768@gmail.com`; LinkedIn's `href="#"` is a
  deliberate placeholder -- no profile URL was given, and none was guessed, per this project's own
  standing rule against inventing URLs. Flagged clearly to the user rather than silently fabricating
  one.
- **Mobile**: hover swapped for tap via a `(hover: hover) and (pointer: fine)` media query check at
  init -- first tap on an unrevealed row shows its marquee without navigating (and closes any other
  open row), a second tap navigates normally; tapping anywhere outside `.flow-item` closes whatever
  is open. Reduced motion needed zero special-casing in the JS (unlike `js/scenes.js`) -- the
  sitewide `*{ animation:none !important; transition:none !important; }` rule already stops both the
  continuous marquee scroll and the reveal transition, leaving instant, non-animated show/hide.
- **`DESIGN.md` updated deliberately alongside this**: the Colors pure-black exception list now
  includes `#contact` and notes there's no separate footer anymore; the Section numeral bullet
  corrected (`#contact` no longer carries a numeral, `#work`'s `01` is the only one left on the
  page); a new Components bullet documents the Flowing Menu port and its brand-color exception,
  cross-referenced against the Skill ring's existing precedent.
- Verified: `node -c` on all four JS files (including the new `js/flow-menu.js`), CSS brace balance,
  duplicate-id check, confirmed every `assets/contact/*.png` path referenced in `index.html` matches
  an actual copied file, confirmed no `<footer>` element or `contact-email`/`contact-links` CSS
  survives anywhere. **Still no live browser access in this environment** -- the hover/tap
  interaction itself (the part most worth seeing in motion) is code-verified and reasoned from the
  fetched source + the user's own recording, not re-screenshotted. A live check of the actual hover
  feel -- transition timing, whether the brand gradients read as "elegant" rather than "muddy" over
  black, logo sizing inside the marquee -- is the natural next step once possible.

## Completed this session (2026-07-28, part 6): #about-me art-direction refinement -- rays masked to
a spotlight behind the text, typeface reverted from Inter back to upright Fraunces, text bloom
deepened slightly. CSS-only, nothing structural changed

Direct follow-up to part 5's full About Me redesign. User confirmed the direction was close but
flagged three specific things, explicitly "refine, don't redesign": the Side Rays background was
reading as a full-section wash that disconnected the section from the rest of the black canvas
(wanted it masked into a soft spotlight confined behind the text, edges staying pure black); the
Inter Light typeface from part 5 didn't feel as premium/luxurious as what was there before and
should be restored; and the text's own glow should get slightly more depth, still subtle.

- **`.about-me-rays` masked into a spotlight** (`css/style.css`): added
  `mask-image`/`-webkit-mask-image: radial-gradient(ellipse 58% 62% at 40% 50%, #000 0%, #000 22%,
  rgba(0,0,0,.5) 45%, transparent 72%)` to the existing rays container. The gradient's own color
  stops reach fully transparent at 72% of its defined radius (which itself is only 58%/62% of the
  section box), so the fade completes well inside the viewport on every screen size -- edges stay
  guaranteed pure black, not just visually faint. Center positioned at 40%/50% to sit roughly behind
  where `.about-me-copy`'s offset column actually renders (computed from the layout's own math, not
  guessed), so the light reads as emanating from behind the typography specifically. Nothing else
  about the rays (color, opacity, blur, drift animation) changed.
- **Typeface reverted**: `.about-me-line`'s `font-family` moved back from Inter to `var(--display)`
  (Fraunces) -- but kept **upright** (`font-style:normal`), not italic. This is a deliberate
  synthesis, not a straight revert: the user's original complaint two sessions ago was specifically
  about *centered italic* Fraunces reading like "a memorial message, a quotation, or a poem" --
  since the composition is no longer centered (left-set offset column, from part 5) and italic is
  still off, Fraunces' own editorial character can come back without reintroducing that problem.
  Explained this reasoning back to the user rather than silently picking one reading of an
  ambiguous "restore the previous font" instruction. Font-size/line-height/letter-spacing/layout
  are byte-identical to part 5, per "keep all current spacing, animation and composition."
- **Text bloom deepened slightly**: `.about-me-line`'s `text-shadow` gained a fourth, very soft, wide
  layer (`0 0 110px rgba(91,79,224,.06)`, using the existing `--violet` hue) and the existing three
  layers' opacities nudged up modestly (0.18/0.14/0.06 -> 0.2/0.18/0.09) for "increase the feeling
  of depth slightly" -- still no new colors, still well short of anything neon/heavy.
  - `DESIGN.md` updated deliberately alongside this (not silently): Typography's Display bullet now
  documents the upright-Fraunces exception and the reasoning for why it landed there (both the
  Inter and the original centered-italic-Fraunces attempts are named as the two things that read
  wrong, for different reasons); the Do's-and-Don'ts Fraunces-italic rule now carves out this one
  sanctioned upright exception; the Components "About Me redesign" bullet's typography/rays notes
  were corrected to match (no more stale "Inter Light" reference) and the rays note now mentions
  the mask explicitly.
- Verified: `node -c` on all three JS files (untouched this part, no JS changes needed since this
  was pure CSS), CSS brace balance, and direct regex checks confirming `.about-me-line` uses
  `var(--display)` + `font-style:normal` and `.about-me-rays` carries the new `mask-image`. No
  HTML/JS structure changed at all this part -- no id/class renames, so no cross-file reference risk
  to re-check. **Still no live browser access in this environment** -- code-verified, not
  screenshotted; the mask's exact visual softness/positioning is the one thing most worth a real
  look once possible.

## Completed this session (2026-07-28, part 5): #about-me redesigned as an editorial statement --
no heading, Inter Light typography, a soft text bloom, and a vanilla-CSS Side Rays background.
Scoped strictly to this one section, nothing else touched

With the part-4 rendering bug fixed and About Me actually visible, the user asked for a full visual
redesign of just this section: the centered italic-Fraunces paragraph read as "a memorial message,
a quotation, or a poem," not a premium portfolio moment. Explicit constraints: no other section may
change, keep the exact text and the exact existing scroll-reveal mechanic/timing feel, remove the
visible heading entirely, move to a modern sans in the editorial-magazine register (Apple/Awwwards/
Studio Freight/Locomotive/COS were the named references), add a subtle text bloom (no neon/RGB/heavy
shadow), and add React Bits' Side Rays (https://reactbits.dev/backgrounds/side-rays) as an ambient
background for this section only, color chosen to fit the site.

- **Heading removed entirely** (`index.html`): the `<h3 id="line-about-heading">About Me</h3>` is
  gone, not hidden -- only the `sr-only` `<h2>` landmark remains for accessibility. `js/scenes.js`'s
  `aboutMeScene` dropped the corresponding `line-about-heading` lineConfig.
- **Typography rebuilt, not just recolored**: `.identity-sentence`/`.identity-about` (renamed
  `.about-me-line`/`.about-me-copy` -- confirmed via grep these classes were used nowhere else
  before renaming) moved from Fraunces italic/centered to **Inter Light (300)** at
  `clamp(1.3rem, 2.4vw, 1.85rem)`, left-aligned, in an **offset column**
  (`margin-left:clamp(0px, 6vw, 90px)`, `max-width:680px` inside a wider `1200px` content box) --
  asymmetric negative space instead of a centered block, the actual "art-directed, not a plain
  paragraph" move. Added Inter weight 300 to the Google Fonts request (`index.html`'s existing
  `Inter:wght@400;500;600` -> `Inter:wght@300;400;500;600`) since nothing in the project had loaded
  that weight before. `DESIGN.md`'s Typography section updated: Display (Fraunces italic) no longer
  lists "about-page copy" as one of its uses; Body (Inter) now notes this large-scale editorial
  exception explicitly.
- **Soft text bloom** (`.about-me-line`'s `text-shadow`): a hairline white edge
  (`0 0 1px rgba(255,255,255,.18)`) plus two low-opacity rings in `--accent-tint` (`#7C93FF`, an
  existing, previously-unused-in-CSS primary-tint token) at 24px/6% and 48px/... -- deliberately
  restrained, no color shift on the glyphs themselves (`color:var(--paper)` unchanged, still white).
  Confirmed and documented in `DESIGN.md` that this is a *different, quieter* category of effect
  than `.shiny-text` and doesn't count against that component's explicit two-use ceiling.
- **`.about-me-rays`**: a vanilla-CSS reimplementation of React Bits' Side Rays -- fetched the actual
  component source from `github.com/DavidHDev/react-bits` (a WebGL/OGL shader: two colored ray cones
  from a corner, animated via a fragment shader) to understand the real mechanics rather than
  guessing from the name, then ported the *visual result* (not the shader) into two blurred
  `conic-gradient` pseudo-elements anchored at the top-right corner (the source's own default
  `origin`), tinted with the existing `--accent-tint`/`--violet-tint` tokens (no new hues), opacity
  0.09-0.16, drifting on a slow (48s/64s, reversed) rotate+scale keyframe -- automatically frozen by
  the sitewide `*{ animation:none }` reduced-motion rule, zero extra code needed. This is the same
  "reimplement the effect in vanilla CSS/JS, don't pull in the library" convention this codebase
  already established for Split Text and Shiny Text, now documented as such in `DESIGN.md`.
- **`DESIGN.md` updated deliberately alongside this** (not silently): Typography's Display/Body
  bullets (above), the Components "Section-scoped ambient reveal" bullet (now `#about-me` also has
  one, a second *distinct* exception, not a loosening), a new "About Me redesign" Components bullet
  documenting all four departures from the site's usual conventions in one place so a future session
  doesn't "fix" them back, and both the Shiny Text bullet and its Do's-and-Don'ts entry updated to
  clarify the new text bloom doesn't count against that component's ceiling.
- **Confirmed nothing else changed**: `.identity-heading` (still shared by the Software & Skills and
  Open For headings) was left in place untouched, only its explanatory comment corrected to stop
  referencing the now-deleted `.identity-sentence`. Every other scene's CSS/JS/content is
  byte-identical to before this part.
- Verified: `node -c` on all three JS files, CSS brace balance, an id/trackId/contentId
  cross-check between `js/scenes.js` and `index.html`, confirmed the new `range:2151`/`exitStart:
  0.652`/stagger values in `js/scenes.js` match `.about-me-scroll-track`'s CSS height exactly (both
  recomputed from the prior 6-line pass to preserve the exact same per-sentence cascade width and
  hold/exit pixel durations -- only the heading's own removal changed the total, nothing was
  re-timed, per "keep the existing scroll animation"). **Still no live browser access in this
  environment** -- this is code-verified and reasoned from the fetched Side Rays source, not
  screenshotted. A live scroll-through (or another screen recording) is the natural next check,
  particularly for how the offset column and rays actually look together at real viewport widths.

## Completed this session (2026-07-28, part 4): found and fixed the REAL reason About Me looked
"missing" -- a genuine rendering bug, not a content/ordering/pacing problem

User pushed back a third time insisting About Me was still missing despite part 3's direct file
proof that the section, order, and exact text were all correct in the code. Rather than re-editing
already-correct content again, asked how they were viewing it -- they came back with a screen
recording (`MAIN PROBLEM/*.mp4`, dropped in the repo root). `mcp__claude-in-chrome` was still
unavailable in this environment, but `ffmpeg`/`ffprobe` (already on PATH) let this session extract
the actual video frames at 4fps and read them as images -- the first real look this whole set of
sessions has had at how the site actually renders, previously always blocked.

The frames showed something no prior structural check could have caught: `#identity` renders
correctly (name + all 4 facts visible), then a long stretch of pure black with the scrollbar
visibly moving and *nothing* appearing, then a hard cut straight to a Skills card fading in --
confirming the About Me content was never painting at all, not a pacing/ordering issue.

- **Root cause, found by re-reading `js/scenes.js`'s `revealWords()` against `css/style.css`**:
  `revealWords()` (used for every `mode:'words'` line -- name, all three section headings, every
  About Me sentence) only ever sets `opacity`/`filter`/`transform` on the individual word `<span>`
  children it creates via `splitWords()` -- it never touches the parent line element itself.
  `.identity-heading` and `.identity-sentence` both had `opacity:0` hardcoded directly on that
  parent element in CSS. Since CSS opacity compounds down the render tree, a parent frozen at
  `opacity:0` renders its entire subtree invisible forever, regardless of what the child words'
  own opacity does -- so the About Me heading and all 5 sentences (and, less visibly since their
  sections still show content below via block-mode reveals, the "Software & Skills" and "Open For"
  headings too) were painting at permanent zero opacity. `.identity-name` (the one 'words'-mode
  line that *did* visibly work in the recording) never had this bug, because its CSS rule never set
  `opacity:0` on the parent in the first place -- word-level opacity alone was always sufficient,
  which is exactly the proof this fix leans on.
- **Fix** (`css/style.css`): removed the `opacity:0` declaration from both `.identity-heading` and
  `.identity-sentence`, matching `.identity-name`'s already-correct pattern. Nothing else changed --
  not the reveal functions, not any scene's range/exitStart/stagger math from part 3, not the
  content or section order, all of which were already right. The individual words still start
  hidden (their own opacity is set by `revealWords()` on the very first animation frame, before
  first paint), so there's no flash-of-visible-text regression.
- **This one fix resolves three symptoms at once**: the About Me passage will now actually build in
  and hold instead of leaving a silent black gap; the "Software & Skills" heading and "Open For"
  heading (same bug, same class, not previously flagged by the user but broken all the same) will
  now render too.
- Verified: CSS brace balance, and a regex check confirming `opacity:0` no longer appears on either
  selector. **Could not re-verify in an actual browser** -- `mcp__claude-in-chrome` failed on retry
  again this session, same as every session before it. Frame-extraction via `ffmpeg` only works
  against an existing recording, not a live page, so this fix is code-verified and reasoned from the
  video evidence, not re-screenshotted. **If this still doesn't look right, another screen recording
  covering the #identity -> #about-me -> #skills handoff would be the fastest way to confirm or
  rule this out.**

## Completed this session (2026-07-28, part 3): holds slashed (not the reveals), sky darkens sooner,
Identity pushed larger again, About Me content replaced with the user's exact final copy

Direct follow-up to part 2. User confirmed the overall cinematic style is now close to right and
explicitly said **don't touch animation speed** -- the word-cascade reveals, the blur/translateY
easing, `SCENE_LERP` -- all of that should stay exactly as slow and elegant as it already is. The
actual complaint is the *dead* scroll: the hold after a scene finishes building and before the next
one starts. Also: darkening should start even sooner, the post-blackout pause should be tiny, the
name still isn't dominant enough, and About Me needed to use the user's own final paragraph (split
into 5 sentences here, not the 8 written last session).

- **Every scene's hold cut hard, builds/exits left byte-for-byte the same pixel length**: for each
  scene, computed the OLD build-phase and exit-phase pixel widths first (e.g. identity's build was
  1276px, exit 616px), picked a much smaller hold px (identity: 308px -> 80px), then solved backward
  for a new `range`/`exitStart`/stagger `base`/`step`/`span` that reproduces those same build/exit
  pixel widths on the smaller total range -- verified with a small script, not eyeballed. Net: every
  line's own word-cascade takes exactly as much scrolling as it did before (the "beautiful slow
  reveal" is untouched), only the static waiting around it shrank. `identity` 2200->1972px (hold
  308->80), `about-me` recomputed for its new 6-line content at 3400->2303px (hold 1377->280),
  `skills` 2600->2226px (hold 494->120), `availability` 1600->1338px (hold 352->90). `js/scenes.js`
  and `css/style.css` kept in exact lockstep (`range` must equal the CSS track's extra height, or
  scroll position and content desync).
- **Sky-to-black starts sooner again** (`js/intro-scroll.js`): `DARKEN_START_T` 0.7 -> 0.55, so the
  darken now overlaps the scrub's last 45% instead of 30% -- still needs zero scroll distance of its
  own (reaches full black exactly as the frame-scrub itself finishes, same mechanism as part 2).
- **Post-blackout hold cut to near-nothing**: `.intro-scroll-track`'s extra post-scrub distance
  250px -> 80px, directly answering "wait only a very small amount of scroll" before #identity
  begins.
- **Identity pushed larger again**: `.identity-name` `clamp(4.4rem,15vw,11.5rem)` ->
  `clamp(4.6rem,18vw,14rem)` -- now clearly, deliberately exceeds the Hero name's own 10.5rem
  ceiling (this scene has nothing else sharing the frame with it). `.identity-content` widened
  1140px -> 1320px, facts strip padding/gaps/font-sizes bumped again so the whole composition uses
  more of the canvas, not just the name in isolation.
- **About Me content replaced with the user's exact provided paragraph**, split at sentence
  boundaries into 5 `.identity-sentence` lines (was 8 invented sentences last session) -- the
  rendered prose is character-for-character what was given, just structured as separate elements so
  each sentence still gets its own stagger window per the existing Split Text pattern. `js/scenes.js`
  updated to 6 lines (heading + 5 sentences) instead of 9.
- Verified structurally again: `node -c` on all three touched JS files, CSS brace balance, an
  id/trackId/contentId cross-check between `js/scenes.js` and `index.html` (all resolved), confirmed
  no leftover `line-sentence-6/7/8` references anywhere, and confirmed by direct code read that
  `revealWords`/`revealBlock`/the easing functions/`SCENE_LERP` are byte-identical to before this
  session -- only `buildScene()`'s own call-site numbers and `DARKEN_START_T` changed. Cumulative
  scroll-distance reduction from the original (pre-any-of-this-work) baseline is now ~44.7% (21,900px
  -> ~12,119px), computed directly. `mcp__claude-in-chrome` was not retried this session (already
  failed on every retry across parts 1 and 2) -- **a live scroll-through remains the important next
  step**, specifically to confirm the much-shorter holds still feel like a deliberate beat rather
  than an abrupt cutoff, and that the larger 14rem name doesn't crowd the facts row at mid-range
  viewport widths.

## Completed this session (2026-07-28, part 2): whole cinematic sequence rebalanced -- ~35% less
total scroll distance, sky-to-black starts earlier and needs no scroll distance of its own, About
Me split into its own scene in the correct order, Identity redesigned much larger

Direct follow-up to part 1 below (same day) -- user said the part 1 pass didn't match what they
wanted: still far too much scrolling end-to-end (not just around #identity), the sky-to-black
transition starts too late, the post-blackout hold before #identity appears is too long, the name
is still too small, and -- the one real bug -- the About Me passage got merged *into* #identity in
part 1 instead of becoming its own section, so the required Identity -> About Me -> Skills ->
Availability order didn't actually exist.

- **Total scroll distance cut ~35% end-to-end** (every `*-scroll-track` height, `js/intro-scroll.js`
  `SCROLL_RANGE`, and every `range:` in `js/scenes.js`, all kept in lockstep): old total extra
  scroll across the whole sequence was 21,900px (intro 7,900 + identity 5,400 + skills 5,200 +
  availability 3,400); new total is 14,250px (intro 4,450 + identity 2,200 + about-me 3,400 +
  skills 2,600 + availability 1,600) -- squarely inside the requested 30-40% range, computed and
  verified with a small script rather than eyeballed.
- **Sky-to-black reworked, not just shortened** (`js/intro-scroll.js`): previously the blackout only
  started ramping *after* the full 800-frame scrub finished (`rawPx > SCROLL_RANGE`), needing a
  further 1000px just for the ramp plus a 500px hold on top -- 1500px of pure extra scroll with
  nothing new to look at beyond a darkening screen. Replaced `DARKEN_RANGE` with `DARKEN_START_T`
  (0.7): the darken now rises across the scrub's own last 30% (`(targetT - 0.7) / 0.3`), reaching
  fully black exactly when the frame-scrub itself finishes -- overlapped with footage that's already
  empty sky by that point, so it needs zero scroll distance of its own. `.intro-scroll-track`'s CSS
  height dropped from `100svh + 6400px + 1500px` to `100svh + 4200px + 250px`: `SCROLL_RANGE` itself
  cut 6400->4200 (still ~5px/frame at 800 frames, the single biggest lever on total page scroll
  length) and the post-black hold cut 500->250px, directly answering "the black pause should last
  only a brief cinematic moment."
- **Identity split into two scenes** (`index.html`, `css/style.css`, `js/scenes.js`): part 1
  incorrectly merged the About Me passage into `#identity-content`, so it never appeared as a
  distinct step in the sequence. Now `#identity` holds only the name + 4 facts (5 lines, its own
  `identity-scroll-track`, range 2200), and a new `#about-me` section/track (range 3400) sits
  directly after it holding the heading + 8 sentences -- giving the required Identity -> About Me
  -> Software & Skills -> Availability order for real. `#about-me` follows the same build-hold-exit
  mechanic as the other three scenes and deliberately has no ambient-blob background of its own
  (`#identity` already spent that one-per-passage exception, per DESIGN.md).
- **Identity composition redesigned, not just resized**: `.identity-name` pushed from a
  4.2-8.8rem clamp to `clamp(4.4rem, 15vw, 11.5rem)` (line-height tightened 1 -> 0.95) -- now
  matches/exceeds the Hero name's own 10.5rem ceiling, deliberately, since this scene has nothing
  else sharing the frame with it anymore. `.identity-facts` rebuilt from a narrow centered vertical
  stack into a horizontal divided strip (mono label over value, hairline `border-left` between
  columns, `.identity-content` widened 800px -> 1140px) so it actually uses the section's width
  instead of sitting as a small column in the middle of a big empty canvas; collapses back to a
  plain vertical stack under 640px where dividers would wrap awkwardly.
- **`DESIGN.md` updated deliberately alongside this** (not silently): the "Scroll-controlled scene
  transition" bullet now describes the overlapped darken instead of a separate post-scrub ramp; the
  "Stagger-build + group-exit scene" and "Section-scoped ambient reveal" bullets now list four
  scenes (`#identity`, `#about-me`, `#skills`, `#availability`) instead of three, with a note on why
  identity/about-me were split; the Colors section's pure-black exception list and the numeral-skip
  note in Components were both updated to match.
- Verified structurally again, not in a live browser: `node -c` on all three touched/new JS files, a
  CSS brace-balance check, a script cross-checking every `id`/`trackId`/`contentId` string
  `js/scenes.js` references against `index.html` (all resolved, zero duplicate ids), confirmation
  that the four scene tracks appear in the correct DOM order, and the scroll-distance-reduction math
  above computed directly rather than estimated. `mcp__claude-in-chrome` still failed to establish a
  tab group in this environment on every retry (same as parts 1 and every session before it) -- a
  throwaway Node static server was started/killed cleanly again but never got a browser attached.
  **A live scroll-through is still the important next step**, specifically to confirm: the
  overlapped darken doesn't read as abrupt at the exact 0.7 threshold, `#identity`'s new facts strip
  doesn't look cramped/uneven at odd mid-range viewport widths, the tighter overall pacing still
  feels cinematic rather than rushed, and whether the new range numbers (2200/3400/2600/1600) want
  further tuning once someone actually scrolls it.

## Completed this session (2026-07-28, part 1): #identity composition scaled up, pacing tightened, About Me
rewritten as a longer personal design philosophy

Direct follow-up to the previous session's #identity/#skills/#availability build. User felt the
identity block read as visually small/lost on the full-bleed canvas, the scroll distance before
#skills felt too long, and asked for a longer About Me passage written as a personal philosophy
(not resume bullets) covering 7 specific points.

- **Typography/spacing scale-up** (`css/style.css`, `#identity` only -- `#skills`/`#availability`
  untouched): `.identity-name` `clamp(2.6rem,9vw,5.2rem)` -> `clamp(4.2rem,13vw,8.8rem)` (still
  below the Hero name's `10.5rem` ceiling, so it reads as a strong callback, not a competing
  focal point). `.identity-facts` gap/margin, `.identity-fact__label`/`__value` font-size,
  `.identity-heading` font-size/margins, and `.identity-sentence` font-size/line-height all bumped
  proportionally so the hierarchy (name > facts > heading > body) is preserved, just larger
  end-to-end. `.identity-content` max-width `720px` -> `800px` for a less cramped composition at
  the new type scale.
- **About Me rewritten** (`index.html`): the previous 6 sentences replaced with 8, written as a
  first-person design philosophy rather than a resume list, explicitly covering the user's 7
  requested points (continuous self-development beyond university, exploring other creative
  industries/technologies, learning has no finish line, every project is a chance to learn
  something new, enjoying experimenting with/improving workflows, creativity + technical
  problem-solving combined, the goal being memorable/meaningful/visually-refined digital
  experiences). New elements `#line-sentence-7`/`#line-sentence-8` added inside `.identity-about`.
- **Pacing retuned** (`js/scenes.js`, `css/style.css`): `identityScene`'s `range` `7000` -> `5400`px
  and `exitStart` `0.78` -> `0.75`, stagger `step`/`span` `0.038`/`0.09` -> `0.032`/`0.08` to fit
  the now-14 lines (was 12) into a tighter build. Net effect: a snappier per-line cascade *and*
  meaningfully less empty scroll distance between the identity build finishing and #skills
  beginning, while the build-hold-exit proportions (and the group-exit mechanic itself) are
  unchanged. `skills`/`availability` scene ranges were left as-is -- not what was flagged.
- Verified structurally, not in a live browser: `node -c` on all three touched JS files, a CSS
  brace-balance check, and a script that cross-checked every `id`/`trackId`/`contentId` string
  `js/scenes.js` references against `index.html` (all resolved, zero duplicate ids, confirmed 8
  `line-sentence-*` ids present). `mcp__claude-in-chrome` failed to establish a tab group again in
  this environment (`tabs_context_mcp` errored on every retry, same as every prior session's note)
  -- a throwaway Node static server was started/killed cleanly (port confirmed freed via
  `netstat`) but never got a browser attached to it. **Next session (or the user testing locally)
  should scroll through #identity end-to-end** to confirm the new name/type scale doesn't overflow
  at narrow viewports, the 8-sentence About Me still reads as an unhurried cascade rather than
  rushed at the tighter 0.032 step, and whether `range:5400`/`exitStart:0.75` actually feels right
  or wants further tuning -- reasoned numbers, not measured against real scroll feel.

## Completed this session (2026-07-27, part 2): the placeholder #reveal section replaced with
three real cinematic scenes (#identity/about, #skills, #availability) -- real content, a new
stagger-build + Split-Text + group-exit reveal engine, and real skill-logo assets

Continuation of part 1 (below), same day. User wanted the cinematic experience to keep going past
the blackout: a calm black pause, then the identity/about content builds itself in (not a
traditional About section), then Software & Skills, then Availability -- everything scroll-
controlled, reversible, no hard cuts, "one continuous scene" not stacked pages. Explicitly not a
one-shot: three design calls were clarified with the user first via AskUserQuestion before writing
code (see below), since they intersected existing DESIGN.md rules.

- **Resolved conflicts with the user before building:**
  1. DESIGN.md bans a second shiny-text moment per page (Hero's `KAAN ACAR` already uses it) but
     the user asked for shine on "important headings and my name." User chose: name only (one
     moment, matching the existing scarcity rule), section headings get hierarchy from Poster-scale
     typography instead.
  2. Initial plan was to reuse the identity intro's own "rotate through center" title mechanism for
     the About text. User rejected this explicitly: wanted the *whole* identity block (name, facts,
     About Me sentences) to stagger-build top-to-bottom as ONE accumulating composition, hold fully
     assembled, then the entire block exit *together* as one unit -- not sentence-by-sentence
     rotation. Skills should follow "the same cinematic philosophy" immediately after.
  3. No real logo assets existed yet for the 6 software skills; user chose to provide the actual
     files rather than accept monogram placeholders -- see below, they arrived mid-session.
- **`css/style.css`'s shiny-text refactor**: extracted the gradient/sweep treatment out of
  `.hero-name .row` into a standalone `.shiny-text` class (byte-identical computed styles for the
  Hero -- confirmed by keeping `.row` for its own layout role and moving only the gradient/animation
  rules). `index.html`'s hero spans gained `class="row shiny-text"`; the new `#identity`'s "KAAN
  ACAR" is the only other place it's used. DESIGN.md's Components section now documents this as the
  hard ceiling ("don't add a third use without removing this line first").
- **New reveal engine, `js/scenes.js`** (new file, not folded into `js/intro-scroll.js` --
  deliberately: this content has nothing to do with the Blender footage or its frame-loading
  concerns, so it's mounted independently from `js/script.js`). Generalizes into a reusable
  `buildScene()`/`stagger()` pair used identically for all three scenes:
  - Every line of content gets its own scroll window (`stagger()` computes `start`/`end` per line
    index with deliberate overlap so consecutive lines cascade rather than step).
  - Plain-text lines (name, headings, About Me sentences) are split into words at build time
    (`splitWords`) and each word gets its own tiny cascade sub-window within its line's own window
    (`revealWords`) -- a vanilla-CSS take on React Bits' Split Text
    (https://reactbits.dev/text-animations/split-text). Structured content (fact rows, skill cards,
    availability items) reveals as a whole block instead (`revealBlock`) -- word-splitting a
    "label: value" row would read as noise, confirmed against the user's own "About text should
    split" ask being specifically about prose, not data rows.
  - Once a scene's own scroll position passes `exitStart`, the *container* (not individual lines)
    fades/blurs/lifts out together as one unit, reaching fully hidden by the track's own end --
    this is what makes `#identity` -> `#skills` -> `#availability` read as one continuous scene
    rather than three stacked sections, and is the piece that was rebuilt after the user's
    clarification #2 above.
  - Skill cards additionally get a `makeRingUpdater()` closure wired onto their line entry: each
    ring's stroke-dasharray/dashoffset is computed from the card's own `data-score` and tied to the
    exact same per-line progress driving its opacity, so the ring visibly fills in as the card
    arrives rather than snapping in already-complete.
  - Reduced motion: the whole module no-ops immediately (`if (reducedMotion) return`); every track
    collapses to `100svh` and every line/word defaults fully visible via `css/style.css`'s own
    `@media (prefers-reduced-motion: reduce)` rules, same opt-out convention as every prior scene.
- **Content, written this session** (`index.html`):
  - Identity facts: Age 21, Education Bahçeşehir University, Degree Visual Communication Design,
    Current Status Starting 3rd Year.
  - About Me: 6 sentences, professional-but-personal tone per the user's brief (continuous
    self-improvement beyond university, exploring new creative technology, daily learning,
    technical+creative growth together, experimenting with workflows, seeking better/modern
    solutions) -- confident phrasing, no bullet-point feel in the final prose.
  - Software & Skills: Blender 5/10, After Effects 7/10, Premiere Pro 7/10, Adobe Illustrator 8/10,
    Claude Code 9/10, Figma 7/10 -- each a `.skill-card` with a circular logo badge (soft blurred
    glow tinted in that software's own accent color behind it), a name label, and the confidence
    ring above, not a progress bar.
  - Availability: "Open For" + Internships / Freelance Projects / Full-Time Opportunities.
- **Skill logo assets**: initially wired to expect user-provided SVGs at `assets/skills/*.svg` with
  an `onerror`-driven fallback (a colored-glow circle + two-letter monogram) in case files were
  never provided. Mid-session the user said they'd added official assets -- they actually landed at
  `./logo assest/` (note: literal folder name, typo + space, not `assets/logo-assets/` as described)
  as **PNGs, not SVGs**: `blender logo.png`, `after effects logo.png`, `premier pro logo.png`,
  `adobe-illustrator-seeklogo.png`, `claude-seeklogo.png`, `figma logo.png`. Verified each file
  (PNG dimensions + color type) before wiring: all have real alpha channels (transparent-background
  logo marks, not flattened square icons), confirming they'd sit cleanly inside the circular glow
  badge via `object-fit:contain`. Copied (not moved -- originals untouched) into
  `assets/skills/{blender,after-effects,premiere-pro,illustrator,claude-code,figma}.png` (clean
  kebab-case, same convention as every prior asset-drop session) and updated `index.html`'s `<img>`
  `src`s from the placeholder `.svg` paths to these real `.png` ones. The monogram-fallback markup
  and CSS were left in place as a safety net (`onerror` still degrades gracefully) rather than
  removed, since it costs nothing to keep and protects against any future path going stale.
- **`DESIGN.md` updated deliberately alongside this** (not silently): the shiny-text ceiling (two
  uses total, name-only going forward), the stagger-build + group-exit scene pattern, the Split
  Text line component (and its explicit non-use on structured content), the skill confidence ring
  component (brand color allowed in exactly two narrow spots per card, never a flat block), and a
  correction to the "#reveal" placeholder references (renamed throughout to `#identity`/`#skills`/
  `#availability`, now three numeral-less cinematic set-pieces instead of one).
- **Not verified in a live browser this session either** -- `mcp__claude-in-chrome` was not
  available in this environment (same limitation as part 1). Verified instead via: `node -c` on all
  three touched/new JS files, a CSS brace-balance check, a duplicate-id check across `index.html`,
  and a cross-check that every element id `js/scenes.js` references by string actually exists in
  the HTML (29/29 resolved). **Scrolling through the real page locally is the important next step**
  -- specifically to check: the identity block's 12 lines don't visually overflow a short viewport
  before the exit phase begins, the per-word Split Text cascade reads as elegant rather than jittery
  at real frame rates, the skill cards' grid wraps sensibly at mobile widths, and whether the
  chosen scroll distances (`IDENTITY_RANGE=7000`, `SKILLS_RANGE=5200`, `AVAILABILITY_RANGE=3400` in
  `js/scenes.js`) feel unhurried or need retuning -- all first-pass numbers, not measured against
  real scroll feel.

## Completed this session (2026-07-27, part 1): Hero->Blender visual continuity (entry veil) + the
Blender footage's own empty-sky ending now bleeds into a scroll-controlled blackout, followed by
a new placeholder-content #reveal section that builds itself back up from scroll alone

Two related asks in the same session, both about making the site read as one continuous cinematic
scroll rather than stacked, independently-cutting sections.

**Part 1 -- Hero/Work -> Blender entry veil:** user felt the cut from the dark Hero/Work canvas
into the identity intro's Blender footage (which opens on a bright white-cloud/blue-sky frame) read
as "entering another page." Added `.intro-entry-veil` (`index.html`, `css/style.css`,
`js/intro-scroll.js`): a radial-gradient scrim (`--ink` + `--hero-indigo`, the same hue the site's
own ambient blobs already use, not a new color) sitting between the canvas and the existing
`.intro-bg-overlay` vignette, full opacity at the very first frame, eased to 0 (via the module's
existing `easeOutCubic`) over the footage's first ~8% (`VEIL_FADE_FRACTION`) -- a pure function of
`posF`, written every frame like the volumetric titles already are, so it reverses exactly on
scroll-up. Nothing about the Hero, the 800-frame render, the titles, or the baked "WHO I AM"/pink-
jacket reveal was touched.

**Part 2 -- sky-to-black + cinematic reveal system:** user wanted continued scrolling during the
footage's own empty-sky ending to gradually darken the sky to pure black (not a cut), hold briefly
on black, then have a next section slowly build itself out of the dark -- ambient background first,
placeholder content after -- entirely scroll-controlled, no timers, content itself explicitly out of
scope ("do not design the final content yet").

- **`.intro-scroll-track`'s CSS height** gained a further 1500px (`calc(100svh + 6400px + 1500px)`)
  past the 6400px that plays the actual 800-frame sequence -- deliberately still the *same* track/
  pin as the frame-scrub, specifically so the sky-to-black moment never has its own pin/unpin
  boundary. Collapses to `100svh` under `prefers-reduced-motion` same as before (untouched by this
  change, the extra distance is motion-only).
- **New `.intro-blackout`** (`index.html`, inside `#about`, above the titles): a literal `#000` --
  not `--ink` -- full-bleed div, `opacity:0` by default. `js/intro-scroll.js` now tracks the track's
  *raw* (unclamped) scroll px alongside the existing clamped frame-scrub `targetT`; once that raw
  value passes `SCROLL_RANGE` (i.e. the footage has been scrubbed all the way to its last frame),
  `darkenTargetT` ramps 0->1 over a further `DARKEN_RANGE = 1000`px, lerped into `darkenCurT` the
  same way `curT` already is, then written straight to the blackout's opacity. The remaining 500px
  of the track's extra height is pure scroll distance where `darkenTargetT` is already clamped at 1
  -- the "cinematic hold" needed no extra code, just more track to scroll through while nothing
  changes. Alpha-compositing a flat black over the footage's own sky-blue final frame naturally
  produces the requested "deeper blue -> almost black -> pure black" sweep with zero manual color
  keyframing. `display:none` under reduced motion (that visitor's static single frame never had a
  sky-blue ending to darken to begin with).
- **New `#reveal` section** (`index.html`, `css/style.css`, own `.reveal-scroll-track`/1800px pin,
  same mechanism as `#hero-scroll-track`/`#about`'s track), placed right after `.intro-scroll-track`
  and before `#contact`. Opens already pure black (matching the blackout's held end-state, so the
  hand-off between the two independent tracks has no visible seam) and builds itself back up in two
  scroll-driven layers, both computed in `js/intro-scroll.js`'s existing rAF loop against this
  track's own scroll position (`revealCurT`, same lerp-toward-target pattern as everything else
  here):
  - `.reveal-bg` (opacity/scale 0.92->1/blur 10px->0, eased) fades in first, fully in by 45% of the
    track's scroll range (`REVEAL_BG_END`).
  - `.reveal-content` (opacity/translateY 28px->0) starts at 35% (`REVEAL_CONTENT_START`) and
    finishes by 100%, overlapping the background's own tail so the two beats cascade rather than
    stepping.
  - **`.reveal-bg`'s three blobs deliberately reuse the site-wide `.ambient-blob` class** (plus new
    `.reveal-blob`/`.reveal-blob-1/2/3` modifiers for position/size/color, reusing `--hero-indigo`/
    `--violet`/`--hero-rose`) rather than inventing a new gradient system -- `js/script.js`'s existing
    mouse-parallax loop (`document.querySelectorAll('.ambient-blob')`, generic over `data-depth`/
    index, no changes needed) picks them up automatically since they're static HTML present at load,
    so the drift/parallax is free; only the fade-in itself is new, scroll-driven, and lives on the
    parent `.reveal-bg` (each blob keeps a fixed relative opacity, so the group fades as one
    composition rather than three separate writes).
  - `.reveal-content` currently holds exactly one placeholder line ("More to come.", `.reveal-
    placeholder`) -- explicitly not final copy. Real content (software/skills/services/availability/
    open-for-work) is a future session's scope.
  - Reduced motion: track collapses to `100svh`, `.reveal-bg`/`.reveal-content` default to fully
    visible via CSS media query (no JS reveal logic runs for that visitor, consistent with how the
    titles/veil/blackout all already opt out the same way).
- **`DESIGN.md` updated deliberately alongside this** (not silently) since two genuinely new patterns
  were introduced: pure `#000` as a one-off cinematic exception to the surface's usual near-black
  `--ink` (Colors), and the section-scoped reuse of `.ambient-blob` for `#reveal` plus the whole
  scroll-controlled-blackout-then-build mechanic (Components) -- both framed as narrow, explicitly-
  scoped exceptions in the same spirit as `#hero-prism`'s existing precedent, not a loosening of the
  "one ambient canvas" / "no new colors" rules generally. Also updated the existing "numeral sequence
  skips 01->03" note to account for `#reveal` being a third full-bleed cinematic set-piece with no
  visible section head (flagged that this may need revisiting once `#reveal` gets real content and
  plausibly becomes a numbered section).
- **Not verified in a live browser this session** -- `mcp__claude-in-chrome` failed to establish a
  tab group in this environment (`tabs_context_mcp` errored on every retry), so this was checked via
  `node -c` syntax verification and careful re-reading of the full diff (scroll-math clamping,
  reduced-motion opt-outs, z-index/stacking order, the `.ambient-blob` reuse actually being generic
  over arbitrary blob count) rather than an actual scrolled-through screenshot pass. **Next session
  (or the user testing locally) should scroll through the real footage end-to-end** to confirm the
  darken/hold/reveal timing (`DARKEN_RANGE=1000`, the 500px hold, `REVEAL_RANGE=1800`,
  `REVEAL_BG_END=0.45`, `REVEAL_CONTENT_START=0.35`) actually reads as unhurried/cinematic rather than
  too fast or too slow -- these are reasonable first-pass numbers, not measured against real scroll
  feel yet.

## Completed this session (2026-07-11, part 9): typography composition tuned against a new visual reference (loader/reference.png), grounded in this site's actual crowd geometry rather than the reference's literal proportions

User added `loader/reference.png` (a WELCOME/to my/PORTFOLIO mockup: huge lead words spanning
~85-86% of frame width, sitting with only a hairline gap above a short crowd band) and asked to
refine the typography composition to match its visual impression -- explicitly not to recreate the
design, not to touch the crowd, motion, timing, or hero transition.

Measured the reference precisely (via `pngjs`, per-row light-pixel bounding boxes) rather than
eyeballing: WELCOME/PORTFOLIO each span ~85% of the 1701px-wide frame; the block runs from ~18% to
~77% of the 924px-tall frame; the crowd's tallest heads start right at ~78-81%, i.e. almost no gap.

First attempt matched those proportions directly (`clamp(4.5rem,24vw,18rem)` lead, `translateY`
retuned) -- and badly overlapped this site's actual crowd. Root cause, confirmed by sampling
`#loader-canvas`'s pixel content directly (12 samples over 6s at a 900px-tall viewport): this
crowd's heads typically reach up to ~467-476px, i.e. the crowd occupies roughly the bottom **48-52%
of the viewport**, vs. only ~19% in the reference image. The reference's crowd band is short; this
site's crowd (Skiper 39, unmodified per every prior session's instructions) is much taller. Matching
the reference's text-to-frame ratio literally either crushed the top margin to ~10px or drove
PORTFOLIO deep into the crowd (verified via screenshot -- heavy occlusion, multiple faces obscured).

Landed instead on the largest lead size that clears this actual crowd cleanly at typical viewport
widths, positioned tight above it (only the same kind of incidental single-peep graze the reference
itself has, confirmed by screenshotting 3 separate crowd-random-states):
- `css/style.css` `.loader-type-line--lead`: `clamp(3.2rem,12vw,9.5rem)` (original) ->
  `clamp(3.58rem,13.4vw,10.64rem)` (part 8) -> `clamp(3.7rem,15vw,11.25rem)` (this part) -- a
  further ~5.7% bump on top of part 8's, on top of part 8's own +12%.
- `.loader-type-line--sub`: scaled by the same ratio throughout, now
  `clamp(1.21rem,3.25vw,2.19rem)`, preserving the exact original min/preferred/max-to-lead ratio
  (hierarchy explicitly required to stay identical).
- `#loader-type`'s `transform`: `translateY(-10vh)` (part 8) -> `translateY(-9vh)` (this part) --
  net effect at a 1400x900 test viewport: WELCOME's top landed at 17.8% down (the reference's own
  top proportion is 17.9% -- close by design, this is the one reference proportion that *was*
  achievable given the smaller block), PORTFOLIO's bottom at ~64%, clearing the crowd's typical
  ~52% ceiling with a deliberate small margin rather than the reference's zero-gap.
- Added `white-space:nowrap` to `.loader-type-line`: not present before, needed once sizes got
  large enough that a mid-range viewport could plausibly wrap a word onto two lines; `#loader` has
  `overflow:hidden` already so any rare excess-width clips cleanly at the frame edge, never scrolls.
- Nothing else touched -- `js/script.js` untouched again this part; crowd, entrance/reveal timing,
  easing, stagger all byte-identical.
- Verified headless (Playwright/Chromium, same throwaway static server + `pngjs` for the reference
  analysis, both torn down after): iterated three size/position combinations, measuring actual
  rendered rects each time via `getBoundingClientRect`/computed style rather than guessing, and
  screenshotting each to catch what the numbers alone would have missed (the first two attempts
  measured "correctly" against the reference's own ratios but were visibly wrong once rendered
  against this crowd). Final config screenshotted at 3 different crowd-random-states (minor,
  reference-like graze in 2 of 3, clean in the third), at a mobile viewport (390x844, confirmed no
  wrapping/overflow via `scrollWidth` vs `clientWidth`), mid-entrance (confirms per-character
  stagger motion untouched), and one run that carried past the hold into the actual reveal/hero
  transition (confirmed still fires correctly, unaffected by this session).

## Completed this session (2026-07-11, part 8): final typography composition adjustment -- moved the whole WELCOME/to my/PORTFOLIO stack up and scaled it up, layout only

User reported too much empty space above the typography and asked for two static layout changes,
explicitly not animation/timing/easing: move the whole composition up by ~8-12% of viewport
height, and increase the typography scale by ~10-15%, keeping the WELCOME/to my/PORTFOLIO
hierarchy identical.

- `css/style.css`:
  - `#loader-type` gained `transform:translateY(-10vh)` -- a static container-level offset, the
    midpoint of the requested 8-12vh range. This is independent of the per-character entrance
    transforms GSAP drives on each `.loader-char` span (those animate in local space and are
    unaffected by the parent's static offset), and composes correctly with the reveal timeline's
    own `scale` tween on this same element (GSAP decomposes the existing computed transform matrix
    -- including this translateY -- the first time it touches the element, so the offset survives
    the later push-in).
  - `.loader-type-line--lead` (WELCOME/PORTFOLIO) font-size clamp raised from
    `clamp(3.2rem, 12vw, 9.5rem)` to `clamp(3.58rem, 13.4vw, 10.64rem)`, and
    `.loader-type-line--sub` ("to my") from `clamp(1.05rem, 2.6vw, 1.85rem)` to
    `clamp(1.18rem, 2.91vw, 2.07rem)` -- both scaled by the same ~12% factor (within the requested
    10-15%) so the lead/sub size ratio, and therefore the hierarchy, is unchanged.
  - Nothing else touched: no changes to `js/script.js` at all this part -- `playTypeEntrance()`,
    `playReveal()`, stagger/duration/easing constants, and `LINE_START` are byte-identical.
- Verified headless (Playwright/Chromium against the same throwaway static server as part 7,
  torn down after): confirmed via computed style that `#loader-type`'s resolved transform was
  exactly `matrix(1,0,0,1,0,-90)` at a 900px-tall viewport (i.e. exactly -10vh), and that the
  lead/sub font-sizes resolved to `170.24px`/`33.12px` against a prior `152px`/`29.6px` baseline --
  both a ~12% increase, confirming the shared scale factor held. Screenshotted mid-hold (fully
  assembled, opacity still `1`) to confirm the new higher/larger position reads correctly, and
  mid-entrance (~1.5s in) to confirm WELCOME/"to my" settle cleanly at the new position/scale while
  PORTFOLIO is still mid-stagger -- i.e. the per-character motion itself is untouched, only its
  static container position/scale changed. Note for a future pass, not acted on since it's outside
  this session's "layout only" scope: at the larger scale + higher position, PORTFOLIO's lower
  edge now sits closer to/overlapping a couple of crowd heads at the hold frame -- worth a look if
  a future request touches this composition again.

## Completed this session (2026-07-11, part 7): two final typography-loader timing tweaks -- start ~1s earlier, hold the assembled composition longer. Crowd, typography style and motion design untouched.

User asked for exactly two numeric adjustments, nothing structural: (1) the WELCOME/to my/PORTFOLIO
entrance should begin about 1 second sooner, (2) once fully assembled it should hold, perfectly
still and readable, for ~1.5-2s before the reveal transition starts (it must not begin
fading/transitioning immediately after assembly finishes).

- `js/script.js`: `CROWD_LEAD_MS` (the delay from crowd-render-start to `playTypeEntrance()`)
  changed from `1600` to `600` -- exactly a 1s reduction, per the explicit "~1 second earlier" ask.
  `HOLD_MS` (the delay from the char-entrance timeline's `onComplete` to `playReveal()`) changed
  from `1800` to `2000` -- already inside the requested 1.5-2s window, nudged to the top of it for
  a safety margin so the hold reads as unambiguously "held," not borderline-short.
- Nothing else in the file touched: crowd logic, char stagger/duration/easing, `LINE_START`
  offsets, and the reveal timeline's own tween durations are byte-identical to before this session.
- Verified in a headless Playwright session against a local static server (no dev server in this
  static-site repo, so a throwaway Node `http` server + Playwright/Chromium were used and torn
  down afterward): sampled `#loader-type`'s computed opacity every 50ms across the full loader
  lifecycle. Typography opacity left `0` almost immediately after the crowd-render/load baseline
  (consistent with the new short 600ms lead, vs. a clearly longer wait under the old 1600ms value).
  Screenshotted mid-hold (t=4.2s from load) with `#loader-type` opacity still exactly `"1"` and
  `innerText` reading exactly `"WELCOME\nto my\nPORTFOLIO"` -- confirms the composition sits fully
  assembled and static well into the hold window rather than already fading. Killed the scratch
  server by its exact PID (`taskkill /PID <pid> /F`) after confirming via `netstat` no listener
  remained on the port.

User reported the loader still showed a static "WELCOME TO MY PORTFOLIO" during the 0-2.5s
crowd-only window (part 5's own goal), only starting to animate afterward. Real bug, not a
perception issue: `#loader-type`'s 3 `.loader-type-line` divs hold plain, immediately-visible text
straight from `index.html`, and `playTypeEntrance()`'s `splitIntoChars()` (which replaces that raw
text with hidden, individually-animated `.loader-char` spans) only runs once `CROWD_LEAD_MS`
elapses -- meaning the raw static text was fully visible for the entire 2.6s lead-in, then got
swapped out for the (correctly hidden-then-animated) char spans. Nothing in the CSS ever hid the
container itself.

- `css/style.css`: added `opacity:0` as `#loader-type`'s own base state, so the container --
  including whatever raw text is inside it before JS ever touches it -- is invisible from the very
  first frame of page load, not just once `playTypeEntrance` gets around to hiding individual
  chars.
- `js/script.js`'s `playTypeEntrance()` restructured into two explicit passes rather than doing
  split+hide+reveal interleaved per line: pass 1 splits *every* line into chars and pins each one
  to its hidden pre-animation state (opacity/offset/rotation/scale/blur) with no tweens started
  yet; only after all lines are fully prepared does pass 2 reveal `#loader-type` itself
  (`gsap.set(typeLayer, {opacity:1})`) and then build the GSAP timeline. This makes "never show
  anything before every character is already primed to animate" true by construction, not just
  true because JS happens to run synchronously before the browser's next paint (which was
  technically also sufficient with the original interleaved version, but far less obviously
  correct to read -- restructured for clarity, not just to fix a real visible bug).
- Verified headless: sampled `getComputedStyle(#loader-type).opacity` and
  `.loader-char` count every 200ms across the entire lead window -- opacity read exactly `"0"` with
  0 chars at every single sample from ~1.1s through ~3.1s, then flipped to exactly `"1"` with all 20
  chars present in the same sample where it first changed (i.e. an atomic reveal, not a gradual or
  early one); screenshotted mid-lead-window (crowd only, zero text, confirmed visually) and the
  first frame after chars appear (already mid-motion, not static). Killed the scratch server by its
  exact PID, confirmed via `netstat` the port was freed. Nothing else in the file was touched --
  confirmed the diff is exactly the one CSS property and the `playTypeEntrance` restructure.

## Completed this session (2026-07-11, part 5): typography-only refinement -- richer per-character motion, size hierarchy, slower/delayed timing. Crowd untouched.

User confirmed part 4's two-independent-systems split was the right direction but asked for 5
specific refinements to the typography layer only, explicit that the crowd must not change at
all: (1) delay type entrance ~2-3s so the crowd is on screen alone first, (2) a real size
hierarchy -- "WELCOME"/"PORTFOLIO" dominant, "to my" much smaller and lighter (and lowercase, per
how they wrote it), (3) slow the whole entrance to ~3-4s, (4) replace the flat per-line fade with
a genuinely richer motion (per-letter timing, position offsets settling naturally, soft rotation,
subtle scale, overshoot-and-settle, layered animation, rich GSAP easing), (5) a 1.5s final hold.

- **Crowd code (createPeeps/resetPeep/normalWalk/createPeep/initCrowd/addPeepToCrowd/
  removePeepFromCrowd/render/resize) is byte-for-byte identical to part 4** -- confirmed by only
  ever editing the file from the `// ==== Typography` comment onward, plus one single added line
  inside `init()` (see below). Nothing above that boundary was touched.
- **Per-character split**: `playTypeEntrance()` now calls a new `splitIntoChars()` that explodes
  each line's text into one `<span class="loader-char">` per non-space character (spaces become a
  plain, unanimated literal space) so every letter can move independently -- "WELCOME" = 7
  independently-animated chars, "to my" = 4 (t/o/m/y), "PORTFOLIO" = 9.
- **Layered, two-tween-per-line motion**: each character gets a deterministic (sine-hash, not
  `Math.random` -- same house rule as the rest of this file) starting offset (`x`/`y`), rotation,
  and scale, then two concurrent GSAP tweens animate it back to neutral at the same stagger: one
  for opacity+blur (`power4.out`, a clean "focus pull"), one for position/rotation/scale
  (`back.out(1.6)`, giving genuine overshoot-and-settle) -- these run at different durations so the
  visual "settle" doesn't happen all at once, which is what makes it read as designed rather than
  a stock fade/slide.
- **Size/weight hierarchy via CSS, not JS**: `index.html`'s 3 lines now carry
  `.loader-type-line--lead` (WELCOME/PORTFOLIO, `clamp(3.2rem,12vw,9.5rem)`, full opacity) or
  `.loader-type-line--sub` ("to my", authored lowercase this time, `clamp(1.05rem,2.6vw,1.85rem)`,
  wide letter-spacing, `opacity:0.5`) -- lead lines also get a longer/slower per-character duration
  (1.3s vs 0.85s) than the sub line, so the dominant words feel visibly weightier in motion too,
  not just in size.
- **Cascading, overlapping line timing**: `LINE_START = [0, 0.6, 1.55]` (seconds) rather than a
  flat per-line stagger -- "to my" starts before "WELCOME" fully finishes and "PORTFOLIO" starts
  before "to my" finishes, so the three lines cascade into each other instead of arriving strictly
  one-after-another. Total entrance (first char starting to last char settled) is ~3.29s, inside
  the requested 3-4s window.
- **Real bug found and fixed while verifying the delay requirement**: the original
  `setTimeout(playTypeEntrance, CROWD_LEAD_MS)` was a module-level call, meaning its 2.6s countdown
  started from *script-parse time*, not from when the crowd actually became visible (the sprite
  sheet still had to fetch+decode first) -- under slow/uncached network conditions this could give
  the crowd anywhere from a few hundred ms to nearly the full 2.6s of "alone" time, unreliably.
  Moved the `setTimeout` call inside `init()` (right after `gsap.ticker.add(render)`), so it's now
  anchored to the actual moment the crowd starts rendering, guaranteeing the "~2-3s alone" request
  holds regardless of load time. Caught this by first getting a suspiciously-short measured gap in
  testing, then confirmed the fix with ground-truth `performance.now()` timestamps read directly
  from the page (bypassing Node-side polling round-trip noise, which was itself misleading in an
  earlier measurement attempt -- logged so the same false alarm doesn't get chased again next
  time).
- `HOLD_MS` raised from 1300 to 1500 per the explicit "~1.5 seconds" ask; the cinematic reveal
  transition itself (`playReveal`, camera push-in + type/crowd fade + background dissolve
  concurrent with hero/header's own CSS fades) is unchanged from part 4.
- Verified end-to-end (scratch server + Playwright, real `assets/loader/peeps.png`): screenshotted
  the crowd-alone lead-in (zero text yet), first-letter-arriving (visibly different per-letter
  blur/rotation/scale mid-flight, not synchronized), "to my" fully settled small/light while
  "PORTFOLIO" is still a barely-visible ghost about to cascade in, and the full held composition
  (clean, centered, "WELCOME"/"PORTFOLIO" dominant, "to my" small and light between them, ordinary
  unmodified crowd still walking underneath); confirmed entrance-to-reveal-trigger timing
  (~4.796s measured) matches the authored constants exactly (3.29s entrance + 1.5s hold);
  `reducedMotion:'reduce'` still hides the loader instantly with hero/header shown immediately;
  zero console/page errors throughout. Killed the scratch server by its exact PID, confirmed via
  `netstat` the port was freed.

## Completed this session (2026-07-11, part 4): crowd-forms-text redirect logic fully reverted -- crowd and typography split into two completely independent systems

User rejected part 3's "every peep eventually settles into the phrase" approach outright: "This is
not the behavior I want... never move, redirect, recycle, or pull the walking people into the
center... keep the original CrowdCanvas behavior exactly as it was." Root complaint: the crowd
should be pure ambient background (infinite loop, no interruption, no formation), and "WELCOME TO
MY PORTFOLIO" needed to be a completely separate visual layer with its own animation, not built
out of the peeps at all.

- **`js/script.js`'s Loader IIFE was cut back to a literal, unmodified port again**: removed
  `settlePeep`, `buildTargetQueue`, `onFormationComplete`, `SETTLE_SCALE`, the `formScale` field
  and its center-shrink logic in `createPeep`'s `render`, and `onPeepWalkComplete`'s
  redirect-to-target branch -- `addPeepToCrowd`'s `onComplete` callback is back to exactly what
  the source does: `removePeepFromCrowd(peep); addPeepToCrowd();`, unconditionally, forever. No
  `targetQueue`/`settledCount`/any per-peep state beyond what the original component ever had.
  This also fully resolves last part's flagged ~20-23s reveal-time problem, since nothing gates on
  crowd state anymore.
- **New independent typography layer**: `#loader-type` (`index.html`, inside `#loader` but a
  sibling of `#loader-canvas`, not connected to it in any way) holds 3 static
  `.loader-type-line` divs ("WELCOME"/"TO MY"/"PORTFOLIO"), styled via plain responsive CSS
  (`clamp()` font-size, matching the hero's own stacked-line/`--poster` treatment) -- no canvas
  text-mask sampling, no coordinate math shared with the crowd at all.
- **Its own GSAP entrance**: `playTypeEntrance()` starts 400ms after the crowd is already on
  screen (`CROWD_LEAD_MS`), animates all 3 lines from `{opacity:0, y:40, blur(10px)}` to fully
  visible with `power4.out` easing and a 0.15s stagger between lines -- a premium blur+rise reveal,
  fully deterministic (no dependency on any crowd/peep timing).
- **Reveal timing is now fixed and predictable**: lead-in (400ms) + staggered entrance (~1.2s
  total) + a 1.3s hold + the ~1.15s cinematic transition (kept from part 2/3, now animating
  `typeLayer` instead of canvas-formation state) adds up to roughly 3.1-3.6s end to end, confirmed
  by measurement (`revealMs` sampled at 3571ms in one run) -- consistent and fast, replacing the
  previous version's randomness-driven 20+ second worst case entirely, as a direct side effect of
  removing the "wait for the last straggler peep" gate rather than a deliberate timing fix on its
  own.
- The cinematic reveal itself (`playReveal`) keeps the same structure part 2 built and part 3
  reused: a GSAP timeline doing a slight scale-up + fade on the type layer, a fade on the canvas,
  and a fade on `#loader` itself, all running concurrently with `hero`/`header`'s own CSS
  opacity transitions (triggered at t=0 of the timeline, not after it) -- confirmed still reads as
  one continuous cross-dissolve, not a hard cut.
- `css/style.css`: added `#loader-type`/`.loader-type-line` (flex-centered overlay, `z-index:2`,
  above the canvas). No other CSS touched.
- Verified end-to-end (scratch static server + Playwright, real `assets/loader/peeps.png` in
  place): screenshotted the crowd-only lead-in (peeps walking, zero text yet), the staggered type
  entrance mid-flight (first line sharp, later lines still blurring in), the full held phrase
  (crisp, centered, fully readable "WELCOME / TO MY / PORTFOLIO" floating above a completely
  ordinary, unmodified, still-recycling crowd), and the transition; confirmed via `grep` that zero
  references to `settlePeep`/`targetQueue`/`formScale`/`buildTargetQueue`/`onFormationComplete`
  remain anywhere in the file; `reducedMotion:'reduce'` still hides the loader instantly with
  hero/header shown immediately; zero console/page errors throughout. Killed the scratch server by
  its exact PID, confirmed via `netstat` the port was freed.

## Completed this session (2026-07-11, part 3): downloaded the real sprite sheet, attempted to fix formation legibility + added a cinematic transition -- both later reverted/replaced in part 4 above, logged here for continuity

User said not to wait for the sprite sheet: found and verified the actual original asset (fetched
the CodePen `zadvorsky/pen/xxwbBQV`'s compiled JS directly -- credited in `skiper39.tsx`'s own
header comment -- confirming `https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/open-peeps-sheet.png`,
`rows:15, cols:7`, exactly matching what part 2 had already wired up) and downloaded it to
`assets/loader/peeps.png` (380,568 bytes, 3600x2268px, divides cleanly into 15x7 at 240x324px/cell
-- this file and its provenance are unaffected by part 4's revert, still in place). No code changes
were needed for this step since part 2's `config` already pointed at that exact path/grid.

Seeing the real art exposed a real bug in part 2's formation logic: peeps render at literal native
sprite-cell size (240x324px) with no scaling, so the coarse global-stride sampling only ever
produced 2-3 usable target points -- an illegible scatter, not text. Reported this with screenshots
rather than silently calling it done.

- Rewrote `buildTargetQueue` to allocate targets per-character (proportional to each character's
  own ink-pixel area, with a floor so thin letters aren't skipped) instead of one global stride,
  and added a `formScale`-driven shrink-into-place on `settlePeep` (peeps scaled to ~11% of native
  size once settling, so many could trace one letter-stroke). This measurably fixed the
  catastrophic case (3 legible-ish rows appeared, matching the phrase's word-count-per-line) but,
  verified with the real art, still didn't reach "clean, clearly readable" -- illustrated character
  icons don't merge into crisp letterforms at achievable counts/density, a medium limitation, not
  a tuning miss. Reported this honestly with screenshots and 3 options rather than picking one
  unprompted.
- Also surfaced a second, independent problem while verifying: total reveal time was ~20-23s and
  run-to-run variable, because reveal was gated on literally every one of ~105 peeps completing
  its own walk (the source's own `xDuration=10` with `timeScale` randomized 0.5-1.5x means a single
  peep can take up to ~20s) -- flagged rather than silently shortened, since the source's own
  timing was explicitly meant to be preserved.
- Also built the first version of the cinematic reveal transition (camera push-in + crowd fade +
  background dissolve via a GSAP timeline running concurrently with the hero/header's own CSS
  fades) -- this part worked well and was verified with a burst-captured mid-transition screenshot
  showing a genuine cross-dissolve, and survived into part 4 essentially unchanged (just retargeted
  from the canvas-formation state to the new independent type layer).
- User's response to all of this: reject the entire crowd-forms-text premise outright regardless of
  how well-tuned it got -- see part 4 above for the full revert and the two-independent-layers
  rebuild that replaced it.

## Completed this session (2026-07-11, part 2): loader thrown out and rebuilt again, this time as a faithful port of a provided source file, not a from-scratch reinterpretation

User explicitly rejected continuing on part 1's build (below): "stop working on the current loader
implementation... completely discard the current loader and everything related to it... do not
try to improve, extend, or reuse the existing loader." They then dropped `loader/skiper39.tsx` (a
React + GSAP component, "Skiper 39 Crowd Canvas" -- an Open Peeps-based crowd sim, MIT-ish/
attribution-license per its own header comment) with strict instructions: use it as the actual
foundation, preserve its interaction/animation quality/timing/motion/behavior as closely as
possible, do not recreate the effect from memory, do not reinterpret unless required for
compatibility. Read the full (single) file before writing anything. Two things needed the user's
own call before starting, since the source component is an infinite ambient loop with no "done"
state and this had to become a loader with one: confirmed keep-video-or-not and how the loader
should end. Answers: drop `assets/intro.mp4` entirely (match the source as-is, crowd is the whole
show), and no fixed timer / no click-to-enter -- "when the crowd has fully assembled into the
final composition, hold ~1-1.5s, then transition... if necessary, extend the original
implementation with a completion state while preserving the original animation quality and
behavior." That "final composition" is the same text goal from part 1 (`WELCOME` / `TO MY` /
`PORTFOLIO`), now built from actual ported peep-walk mechanics instead of geometric shapes.

- **Part 1's entire particle-morph rebuild was discarded wholesale**, not edited -- the Loader IIFE
  in `js/script.js`, the loader markup in `index.html`, and the LOADER block in `css/style.css`
  were all replaced outright, per "do not keep or reuse any logic from the existing loader unless
  required for integration."
- **Real GSAP added this time, self-hosted** (`assets/vendor/gsap/gsap.min.js`, core build only, no
  plugins needed -- pulled via `npm pack gsap` and copied in, same self-host-no-CDN convention
  already established for `assets/vendor/pdfjs`). This reverses part 1's own "no GSAP, matches
  house style" reasoning -- deliberately, because this session's instructions explicitly prioritize
  fidelity to the provided source over this codebase's own animation-library-free preference, and
  GSAP's core is a plain UMD script tag with zero framework/bundler dependency, so there was no real
  compatibility blocker forcing a hand-rolled reimplementation of its easing/ticker.
- **`js/script.js`'s Loader IIFE is a direct, de-Reactified port** of the source: `resetPeep`,
  `normalWalk`, `createPeep`, `createPeeps`, `initCrowd`, `addPeepToCrowd`, `removePeepFromCrowd`,
  `render`, `resize`, `init` are the source's own logic verbatim, translated out of React
  (`useEffect`/`useRef`/props -> plain functions/module state, no cleanup-on-unmount since this
  loader never remounts) but not otherwise altered -- including keeping the source's own
  `Math.random()` calls (`randomRange`, direction/offset in `resetPeep`, walk `timeScale`, the
  `initCrowd` progress seed). This deliberately overrides this file's usual "no Math.random,
  deterministic" rule for this one component, per the explicit instruction not to reinterpret the
  source's own behavior.
- **The one addition on top of the port is the "completion state"** (`settlePeep`,
  `buildTargetQueue`, `onFormationComplete`): when a peep's `onComplete` fires after its first walk,
  it's redirected onto an assigned point (sampled from an offscreen render of the 3-line phrase,
  same fillText+getImageData+even-subsample technique as part 1's, rewritten fresh rather than
  reusing part 1's functions) instead of always recycling -- until every point has a peep settled
  on it (`targetTotal` reached), at which point a fixed `HOLD_MS = 1250` timer fires, then the
  existing reveal wiring (`loader.classList.add('hide')`, `hero`/`header` `.show`, `loader.remove()`)
  runs, identical in spirit to every prior loader version's reveal step.
- **Structure/markup**: `index.html`'s `#loader` is now just `<canvas id="loader-canvas">`, sized
  `position:absolute; bottom:0; height:90vh` matching the source's own `absolute bottom-0 h-[90vh]
  w-full` (crowd walks a "ground band," not full-bleed top-to-bottom). Kept the site's existing
  dark `--ink` background rather than the source's demo-page `bg-white` -- background color is
  styling, not interaction/motion/timing, so this was treated as a "necessary for integration"
  adaptation (a white flash loader would clash badly with an otherwise all-dark site), not a
  reinterpretation of the animation itself. The demo wrapper's own decorative "Croud Canvas" label
  span was not ported -- that's the source file's own showcase-page chrome around the reusable
  `CrowdCanvas` component, not part of the component/effect itself.
- **`assets/intro.mp4` is no longer referenced anywhere** (per the user's own choice to drop the
  video). The file itself was left on disk untouched, not deleted -- removing a binary asset
  outright is a destructive, hard-to-reverse action the user didn't explicitly request; they can
  delete it themselves once satisfied.
- **Blocked on one real asset, by design**: the source draws slices of a sprite sheet
  (`all-peeps.png`, a 15x7 grid of Open Peeps characters) that doesn't exist in this project. User
  said they'd provide it next. Wired the loader to `assets/loader/peeps.png` (rows:15, cols:7,
  matching the source's own defaults -- both are one-line constants in `config` at the top of the
  Loader IIFE if the real sheet uses a different grid) and added a `img.onerror` fail-open path
  (loader hides instantly, hero/header show) so the site isn't stuck behind a loader that can never
  load its image -- confirmed this actually engages cleanly right now, since the file legitimately
  doesn't exist yet.
- Verified headless (scratch static server + Playwright): with no sprite sheet present, the
  fail-open path is what actually runs -- GSAP itself loads fine, loader hides, hero/header show
  immediately, zero page errors (only the expected 404 for the not-yet-provided image). Then,
  specifically to exercise the ported mechanics before the real art exists, generated a throwaway
  15x7 synthetic sprite sheet (simple colored circle+rectangle "peeps," built with a Playwright
  canvas script, never written into the project -- copied into `assets/loader/peeps.png` only for
  the duration of this test, then deleted again immediately after) and reran: crowd populates
  immediately and densely along the bottom band exactly like `initCrowd`'s "flood the whole crowd
  at once, staggered by random walk-progress" mechanic is supposed to (not a gradual trickle-in);
  peeps visibly walk with the bob motion; individual peeps get pulled out of the walking flow into
  fixed points, visibly building a columnar formation over time; the full sequence (walk -> assemble
  -> hold -> reveal) completed end-to-end in ~8.3s with zero console/page errors, `loader.remove()`
  confirmed (element gone from the DOM), hero/header shown; `reducedMotion:'reduce'` still hides the
  loader instantly with zero animation, same as every prior version. ~8s total is noticeably longer
  than the old ~7.25s video-driven loader -- a direct, unforced consequence of faithfully keeping the
  source's own `xDuration = 10` (10s per walk cycle) rather than shortening it, flagged here rather
  than silently tuned away. Killed the scratch server by its exact PID, confirmed via `netstat` the
  port was freed; confirmed `assets/loader/` is empty again (real asset still pending).
- **Still needed from the user**: the actual `peeps.png` (or equivalently named/pathed) sprite sheet
  dropped at `assets/loader/peeps.png`, at which point the fail-open path stops engaging and the
  real crowd renders. Final legibility of "WELCOME / TO MY / PORTFOLIO" as a peep-formed formation
  (letter size relative to each peep's own native, unscaled sprite-cell resolution -- ported
  verbatim from the source, which draws every peep at literal sprite-cell pixel size with no
  responsive scaling) can only really be judged once that real art is in place; may need `rows`/
  `cols`/target-count tuning at that point, flagged as a likely next step, not a bug.

## Completed this session (2026-07-11): loader rebuilt as a particle crowd that assembles into "WELCOME / TO MY / PORTFOLIO"

User scoped this session strictly to the loader ("treat the loader as an isolated component... if a
change would require touching another system, stop and ask first") and pasted a React + GSAP
reference component (`Skiper 39` "Crowd Canvas" — a spritesheet of walking figures drifting across
a canvas forever) asking for its *interaction quality* adapted into this site's own architecture,
replacing the old single-word shape-to-glyph morph with elements that assemble into 3 lines of
text. The reference's actual behavior (infinite ambient walk-cycle, no assembly logic at all) is
not what was wanted, so the "converge into text" mechanic itself was designed fresh; two decisions
that forked the implementation were confirmed with the user first rather than assumed: keep
`assets/intro.mp4` as the backdrop (not a video-free canvas-only loader), and have the particles
snap into real crisp typeset text at the end (not stay as a loose particle formation).

- **No GSAP added** — adapted to the existing house style instead (matches why `flubber`/`opentype`
  were ripped out of this codebase in an earlier session in favor of native WAAPI/rAF): the new
  system is plain canvas 2D + `requestAnimationFrame`, no new dependency, no new vendor file.
- Replaced the old 9-shapes-morph-into-"PORTFOLIO" system in the Loader IIFE (`js/script.js`) with
  a particle field (`PARTICLE_COUNT = 340`) that walks in from alternating screen edges (crowd-style
  entrance, adapted from the reference's own left/right split), converges via `easeInOutCubic` onto
  points sampled from an offscreen render of `WELCOME` / `TO MY` / `PORTFOLIO` (the exact technique
  behind most "particle text" effects: `fillText` to an offscreen canvas, read back opaque pixel
  coordinates via `getImageData`, evenly subsample down to the particle count), then crossfades into
  real DOM `.loader-line` text (new, in `#loader-word`) using the same "shape fades / real glyph
  fades in" crossfade idea the old version already used, just applied to the whole particle field at
  once instead of per letter. Particles reuse the loader's own existing 5-shape vocabulary
  (square/circle/triangle/hexagon/pentagon) and existing accent/violet CSS color variables (resolved
  to real color strings via `getComputedStyle`, since canvas can't read `var()` directly) — a
  deliberate adaptation to "current architecture, styling," not the reference's human-figure
  spritesheet (no new binary asset was needed or added).
- **No `Math.random` anywhere** (existing house rule — every prior session's animation is
  byte-identical on reload): per-particle entry delay/walk path/bob phase/size all come from a fixed
  sine-based hash of the particle's index (`hash01`), a generalization of the old hand-authored
  9-entry `LETTERS` array to the couple-hundred-particle scale, where enumerating each one by hand
  isn't practical — same reproducibility guarantee, different mechanism, documented inline as such.
- **Same overall timing envelope as before, only what happens inside it changed**: the old sequence
  budgeted every letter fully resolved by `MORPH_END = 6000ms`; the new choreography (entry spread +
  walk + converge + settle hold + crossfade) completes by `SEQUENCE_END = 4800ms`, still comfortably
  inside that original budget, leaving the same kind of calm hold before `BLACKOUT_AT = 7250ms` (the
  measured, unchanged start of the video footage's own fade-to-black) fades the text out exactly as
  the old `watchForBlackout` mechanism always did — that function, the `video.addEventListener(
  'ended', ...)` reveal-hero/header/remove-loader wiring, and the `reducedMotion` instant-skip path
  are all untouched.
- `css/style.css`'s `LOADER` block: added `#loader-particles` (the new canvas, `z-index:2`) and
  `.loader-line` (replacing the old `.loader-letter`/`.loader-shape`/`.loader-glyph` rules, which are
  gone); `#loader-word` now starts at `opacity:0` and holds the 3 stacked lines, styled plain
  `var(--paper)` white in `var(--poster)` (Bebas Neue) — matching the hero's own `KAAN`/`ACAR` stacked
  row treatment rather than the old per-letter rainbow coloring, for a cleaner "premium" reveal.
  `index.html` gained exactly one new element inside `#loader`: `<canvas id="loader-particles">`.
- **Nothing outside the loader was touched** — confirmed by scope, not just by intent: the only
  edits were inside `#loader`'s own markup, the CSS file's `LOADER` section, and the Loader IIFE in
  `js/script.js`. The carousel, Work section, project galleries, ambient background system, nav, and
  typography are byte-identical to before this session.
- Verified with a scratch static server + Playwright: anchored screenshots precisely on the real
  DOM signal (`.loader-line` appearing, i.e. the moment `buildScene` actually runs) rather than
  wall-clock guesses off video-autoplay timing, which had thrown off an earlier round of screenshot
  timing during this same session (video autoplay starts before Playwright's own load-detection
  resolves, so "time since I detected the video playing" undercounts real elapsed time — a test-
  harness lesson, not a product bug). Confirmed: the particle cloud visibly reads as legible
  "WELCOME / TO MY / PORTFOLIO" text right before the crossfade; the crossfade itself shows crisp
  type fading in over the residual particle glow; the end state is clean typeset text; `word`
  computed opacity is `1` after the crossfade and `0` again once video time crosses `BLACKOUT_AT`,
  matching the old fade-out behavior exactly; `reducedMotion: 'reduce'` still hides the loader
  instantly and shows hero/header with zero animation; a 390×844 mobile viewport renders all 3 lines
  legibly with real headroom (widest line ~139px against an available ~335px); zero console/page
  errors in every pass. Killed the scratch server by its exact PID, confirmed via `netstat` the port
  was freed.

## Completed this session (2026-07-10, part 4): added "UNKNOWN PLACE" (Book Cover), plus a new filesystem-free auto-discovery gallery mechanism

User dropped a `reference8/` folder with `main photo8.pdf` (1-page cover: green-gradient
"UNKNOWN PLACE" title card, Bahcesehir University credit, "KAAN ACAR / VISUAL COMMUNICATION
DESIGN") and `photo1.jpeg` (a sci-fi book-cover poster — UFO, astronaut in a purple helmet, deep
space/nebula background — with the same "UNKNOWN PLACE" title, formatted like a real book cover).
Explicit new requirement this time, different from every prior PDF project: the gallery must stay
data-driven such that dropping `photo2`, `photo3`, etc. into the folder later needs **zero code
changes** — the existing `extraImages` convention (a hardcoded array) doesn't satisfy that, and
this static, buildless site has no server-side directory listing to enumerate files with.

- Copied `main photo8.pdf` → `assets/projects/unknown-place/unknown-place.pdf` and `photo1.jpeg` →
  `assets/projects/unknown-place/photo1.jpeg` (originals in `reference8/` untouched, kebab-case
  project id per convention). Added one `PROJECTS` entry (`id: 'unknown-place'`) appended after
  `fight-club-titles`, preserving existing project order. Title/category read directly off the
  cover/poster text: `title: 'UNKNOWN PLACE'`, `category: 'Book Cover'` (matching `white-noise`'s
  category, since `photo1.jpeg` is structurally a book-cover poster, not a generic plate).
- **New capability**: `autoImages` (a per-project opt-in field) + two new top-level functions,
  `probeImageExists()` and `loadAutoImageSequence()` (`js/script.js`, just above
  `loadPdfGalleryItems`). Given `{ dir, prefix, start, extensions }`, it probes
  `<dir><prefix><n>.<ext>` for each extension via a real `<img>` load/error event (no fetch/HEAD
  needed), starting at `start` and incrementing until an index matches none of the extensions —
  that gap is treated as the end of the sequence, so the result is always exactly the contiguous
  run of files that currently exist, in filename order. Wired into `loadPdfGalleryItems` as a
  third source after PDF pages and `extraImages` (all three can coexist; `unknown-place` only uses
  the third). Zero changes to `screenItemsFor`, `buildGallery`, `renderPage`, or any other project
  — this is purely additive and opt-in, same pattern as every prior session's new field.
  `unknown-place` sets `autoImages: { dir: 'assets/projects/unknown-place/', prefix: 'photo',
  start: 1, extensions: ['jpeg','jpg','png','webp'] }` and `pdfPagesInGallery: false` (the cover
  PDF is 1 page, cover-only, by design — mirrors `didot-specimen`'s convention even though with
  only 1 page the page-loop would already be a no-op).
- Registered its ambient `wash` pair from the start (same override mechanism as every prior
  PDF/video project, zero changes to `WASH_PALETTE`/`updateWash`/the carousel). Sampled the actual
  rendered cover pixels the same way as `kanye-west`/`breaking-the-grid`/`didot-specimen` (headless
  Chromium + the site's own `pdf.min.mjs`, canvas `getImageData`, bucketed/counted): a saturated
  green field dominates by area (~rgb(0,200,100)/rgb(0,180,100)), with a warm orange-red glow
  blended behind the title text as the clear secondary (~rgb(200,80,20)) — no other hue came close
  in either bucket. Set `wash: ['#0EA355', '#FF6A2E']` — the green base taken almost directly from
  the dominant sample, the orange accent brightened off the sampled glow to match the existing
  pairs' accent lightness band (~62-78% L), same tuning approach used for every prior wash.
- Verified end-to-end with a scratch static server + Playwright (`reducedMotion:'reduce'`): card
  count now 15 (was 14); stepped through all 15 cards via keyboard `ArrowRight` reading
  `--wash-a`/`--wash-b` off `.work-bg__wash` — all 14 pre-existing projects' wash values are
  byte-identical to before, `unknown-place` alone resolves to `rgb(14,163,85)` ->
  `rgb(255,106,46)`; cover renders live from the PDF (`blob:` URL, 1872x1053, real decoded image);
  opened the project and confirmed the gallery has exactly 1 item, the real `photo1.jpeg` URL (no
  PDF pages leaking in); clicking it enlarges it, two `Escape`s returns to the carousel. **Proved
  the actual auto-discovery requirement, not just the code path**: temporarily copied
  `photo1.jpeg` to `photo2.jpeg` in the live asset folder, reran the same Playwright flow, and
  confirmed the gallery now shows both `photo1.jpeg` and `photo2.jpeg` in order with no code
  touched in between — then deleted the temporary `photo2.jpeg` again, restoring the folder to
  exactly `photo1.jpeg` + the PDF. Zero console/page errors throughout (the 404s logged during the
  auto-discovery probe itself — e.g. probing for a `photo2` that doesn't exist yet — are the
  mechanism working as intended, not a bug). Killed the scratch server by its exact PID, confirmed
  via `netstat` the port was freed.

## Completed this session (2026-07-10, part 3): added "FIGHT CLUB — Title Sequence" (Motion / Title Design), reusing part 1/2's video-preview implementation as-is

User dropped a `reference7/` folder with a single file: `Fight Club Title Sequence Final.mp4`
(83.2 MB, 70s, 1920x1080) -- both the carousel preview AND the full project video, per this
request, are meant to be that same one file (unlike `reach`, which had two separate files for
those two roles). Sampled frames across the full duration (`ffmpeg` extraction + the same
headless-Chromium canvas `getImageData` bucketing approach used for the PDF projects, adapted to
JPEGs this time) before doing anything else: it's a hand-made recreation of the "Fight Club"
opening title sequence -- brick-textured "BRAD PITT" title card, a cigarette with "EDWARD..."
(Norton) burned into it, "JARED LETO"/"MEAT LOAF"/"RICHMOND ARQUETTE" cast cards, red grunge
transitions. Dominant colors: black by area as expected, but the single strongest non-neutral
bucket across every sampled frame by a wide margin was a near-pure red (~rgb(240,0,0)) -- no
other hue came close, confirming the sequence's actual black/red identity quantitatively rather
than by eye alone.

- Copied the one source file to
  `assets/projects/fight-club-titles/fight-club-titles.mp4` (original in `reference7/` untouched).
  Added one `PROJECTS` entry (`id: 'fight-club-titles'`) appended after `reach`, preserving
  existing project order. Title/category inferred from the filename and content (none given):
  `title: 'FIGHT CLUB — Title Sequence'` (matching the existing "Name — Descriptor" convention
  already used for `loop`/`launch-film`/`stillwater`), `category: 'Motion / Title Design'`.
- Explicitly reused the `videoPreview` mechanism built in part 1 with zero code changes, per the
  request ("same implementation as the previous video project") -- set both `videoPreview` and
  `video` to the exact same file path. Confirmed this is safe and already handled correctly:
  the hover-preview code only ever calls `.play()`/`.pause()` on the card's own muted `<video>`
  (independent DOM node, decoded/played silently, no `controls`), while `buildVideo()` creates a
  second, separate `<video controls>` element for the opened project page -- the two never
  share playback state, so pointing both fields at one file works exactly like having two
  different files would.
- Registered `wash: ['#4A0A0A', '#F00000']` (deep blood red / vivid pure red) directly from the
  sampled dominant-color evidence above -- same override mechanism as every prior part, zero
  changes to `WASH_PALETTE`/`updateWash`/the carousel.
- Verified end-to-end with the same scratch static-server + Playwright harness: card count now
  14; wash sequence confirms all 13 pre-existing projects' colors are byte-identical to before
  (including `reach`'s, added in part 1) and the new pair appears only at its own index; caught
  and fixed a syntax error from my own edit mid-session (a missing comma between the `reach` and
  `fight-club-titles` entries, which briefly made the whole `PROJECTS` array fail to parse --
  caught immediately via `node --check` against the served `script.js` before any further testing,
  fixed, and re-verified clean); confirmed the preview `<video>` has the correct src, starts
  paused, stays paused when hovered while inactive, plays + loops when hovered while active
  (`currentTime` advancing), and resets to `currentTime: 0` on mouseleave; clicked the card and
  confirmed the project page opens with the real `fight-club-titles.mp4` in a native-controls
  `<video>`; `Escape` returned to the carousel; zero console/page errors throughout. Killed the
  scratch server by its exact PID, confirmed via `netstat` the port was freed.

## Completed this session (2026-07-10, part 2): fixed REACH's full video being invisible behind the "add a src" placeholder

User reported the project video was still missing after part 1 (below) despite `reach`'s `video`
field already pointing at a real, verified file. Re-checked `reference6/` for a third file first
(none — still just the same two from part 1) then re-verified the *existing* wiring end to end
with Playwright, including actually calling `.play()` and confirming `currentTime` genuinely
advanced (1920x1080, duration matched the source exactly, zero errors) — the video was correctly
wired and technically playing the whole time. A screenshot of the opened project page revealed the
real bug: `.project-video__placeholder` (the "Add this project's video..." text) is
`position:absolute`, which always paints above the plain in-flow `<video>` sibling regardless of
DOM order, in a stacking context, per the CSS painting-order layers, permanently masking any real
video underneath it. This was a latent bug in `buildVideo()` since it was first written -- it
simply never had visible consequences before because `reel`/`launch-film` have never had a real
`project.video` src for it to hide.

- One-line, surgical fix in `buildVideo()` (`js/script.js`): the placeholder `<div>` is now only
  appended to the box when `project.video` is absent (`if (project.video) { vid.src = ...} else {
  box.appendChild(ph); }`), matching the placeholder's own stated purpose ("...until a src is
  set"). No CSS changes needed.
- Confirmed zero effect on `reel`/`launch-film`: both still have no `video` field, so the
  placeholder still renders for them, byte-for-byte identical text/markup to before (checked
  directly with Playwright). Confirmed the fix itself with a fresh screenshot of the opened REACH
  project page -- the placeholder text is gone and the actual animation (a hand-drawn knight
  helmet frame, mid-playback) is visible in its place.
- No changes to the carousel, the hover-preview behavior, or the ambient `wash` -- this session's
  fix touched exactly the one `buildVideo()` code path, nothing else in the file.

## Completed this session (2026-07-10): added "REACH" (Animation / Music Video), the first hover-to-play video-preview project

User dropped a new `reference6/` folder containing `main video.mp4` (2.3 MB, 12.9s, 1920x1080)
and `animation music video final.mp4` (37.1 MB, 68.1s, 1920x1080). Inspected both with `ffprobe`/
`ffmpeg` frame extraction (Read tool has no video support, unlike its native PDF support used in
earlier parts) before touching anything: `main video.mp4` is a hand-drawn black-ink-on-white-paper
animatic — an armored gauntlet (lion-crest vambrace) reaching toward a ghostly winged/feathered arm,
a "Creation of Adam" homage, drawn progressively frame by frame; `animation music video final.mp4`
is the finished, full-color version of a broader animated music video (knight helmet, concentric-
circle "hypnotic eye" motifs, silhouetted trees, a crying illustrated figure, a green river/cliff
landscape, the same gauntlet-reaching-to-wing shot in full color) ending on a "KAAN ACAR" title
card. No title was given, so it was inferred from the recurring emotional/visual climax (the
reaching-hands shot, appearing in both files and positioned right before the credits) as
`title: 'REACH'`, `category: 'Animation / Music Video'` (a new category, following the existing
`Motion / Product` / `Motion / Branding` slash-compound naming convention).

- Copied (not merged/converted — these are two separate, already-final video files, unlike the
  PDF-merge projects in earlier parts) `main video.mp4` → `assets/projects/reach/reach-preview.mp4`
  and `animation music video final.mp4` → `assets/projects/reach/reach-full.mp4` (originals in
  `reference6/` untouched). Added one `PROJECTS` entry (`id: 'reach'`, `type: 'video'`) appended
  after `didot-specimen`, preserving existing project order.
- Built a genuinely new capability, since no prior video project actually had a hover-scrubbing
  preview (`reel`/`launch-film` only ever showed a static tone-gradient card with a permanent ▶
  icon, since neither has ever had a real video file registered): a new opt-in `videoPreview` field
  on a `PROJECTS` entry. In `buildProjectCard()` (`js/script.js`), when set, it renders a real
  `<video>` (`.carousel-card__preview`, new CSS in `style.css` mirroring `.carousel-card__cover`)
  instead of a cover image — `muted`, `loop`, `playsInline`, `preload:'auto'`, no `autoplay`
  attribute, so it sits paused on frame 1 until acted on. The static ▶ play-icon overlay is now
  gated behind `!project.videoPreview` so `reel`/`launch-film` keep it unchanged while `reach`
  (which communicates "this is a video" purely through the moving preview itself, per the request)
  never gets one.
- Hover play/pause/loop hooks into the *existing* per-card `mouseenter`/`mouseleave` listeners
  (previously only toggling `.is-hovered`) rather than adding new ones, guarded entirely behind
  `project.videoPreview` so no other card's hover behavior changes: `mouseenter` only calls
  `.play()` (and only after `currentTime = 0`) when the card also currently has the `.is-active`
  class the render loop already maintains for the centered card — hovering an off-center card is a
  no-op, confirmed by test. `mouseleave` always calls `.pause()` + resets `currentTime = 0`,
  regardless of active state, so leaving mid-play snaps back to frame 1 immediately. The native
  `loop` attribute handles "loop while hovered" with zero extra JS. Clicking the card still opens
  the project exactly like every other project (`handleCardActivate` was untouched); the existing
  `buildVideo()` function already read `project.video` into a real `<video src>` with native
  controls whenever it was set — `reel`/`launch-film` simply never set that field, so no changes
  were needed there at all to make `reach`'s full video play on open.
- Registered its ambient `wash` pair from the start (same override mechanism as the three prior
  PDF projects, zero changes to `WASH_PALETTE`/`updateWash`/the carousel). Sampled the *preview*
  video specifically (per the request: "match the dominant colors of the preview video," not the
  full video) by downscaling multiple extracted frames to 1x1px with `ffmpeg` and reading the
  averaged pixel — every sample landed within a few points of `#F5F2F5` (i.e. plain paper white)
  across the entire 12.9s clip, confirming the preview truly carries no hue anywhere. Rather than
  registering a wash indistinguishable from the ambient system's own idle default (`#14141a`,
  which would look like a missing/broken palette next to every other project's visible glow), set
  `wash: ['#1C1A16', '#F0EAD8']` — a deliberate warm ink-black/parchment-cream duotone that mirrors
  what the preview actually shows (black ink, white paper) rather than inventing a color from the
  full video's very different, colorful palette.
- Verified end-to-end with the same scratch static-server + Playwright harness as prior parts:
  card count now 13; wash sequence stepped through all 13 cards, confirming all 12 pre-existing
  projects' `--wash-a`/`--wash-b` are byte-identical to before and `reach`'s pair appears only at
  its own index; confirmed the preview `<video>` has `muted`/`loop` true, no `autoplay` attribute,
  starts `paused`, and has no `.carousel-card__play` sibling; dispatched a `mouseenter` on the card
  *before* rotating it into the active position and confirmed it stayed paused; rotated it active,
  hovered again, and confirmed it started playing (`currentTime` advancing) with `loop: true`;
  dispatched `mouseleave` and confirmed it paused and reset to `currentTime: 0`; clicked the card
  and confirmed the project page opened with the real `reach-full.mp4` in a native-controls
  `<video>`; `Escape` returned to the carousel; zero console/page errors throughout. Killed the
  scratch server by its exact PID, confirmed via `netstat` the port was freed.

## Completed this session (2026-07-09, part 5): fixed DIDOT TYPE SPECIMEN's gallery to show only the JPG, not the PDF's 12 deck pages

Part 4 (below) treated `didot-specimen.pdf` like every other `pdf:`-backed project and let all 12
pages after the cover flow straight into the gallery via `loadPdfGalleryItems`'s normal
`for (p = 2; p <= doc.numPages; p++)` loop. That was wrong for this project specifically: unlike
`kanye-west`/`breaking-the-grid`, whose PDFs really are page-per-gallery-plate spreads, this PDF's
pages 2-13 are a generic case-study deck, not gallery content — only the companion
`didot-type-specimen.jpg` (the actual type-specimen poster) was ever meant to be the gallery.

- Added a new per-project opt-out flag, `pdfPagesInGallery: false`, checked in
  `loadPdfGalleryItems` (`js/script.js`) right before the page-range loop that normally builds
  `pageNumbers` — when set, that loop is simply skipped (`pageNumbers` stays empty), so the
  function falls through to appending `extraImages` only. The cover is untouched by this: it's
  rendered by a separate code path (the `project.pdf` branch around line 854 that always renders
  page 1), so page 1 keeps rendering exactly as before regardless of this flag.
- Defaults to `true` (i.e. undefined === old behavior) when absent, so `kanye-west`,
  `breaking-the-grid`, and `white-noise` — none of which set this flag — are byte-for-byte
  unaffected; this was confirmed, not assumed (see verification below).
- Set `pdfPagesInGallery: false` on the `didot-specimen` PROJECTS entry only. Title, `wash`
  (`['#7B2D8E', '#E020A0']`), `extraImages` (still just
  `assets/projects/didot-specimen/didot-type-specimen.jpg`), and every other field were left
  untouched.
- Verified with the same scratch static-server + Playwright harness used in part 4: card count
  still 12; stepped through all 12 cards' `--wash-a`/`--wash-b` via keyboard `ArrowRight` —
  identical sequence to part 4's run, confirming zero regression to any other project's ambient
  color; opened "DIDOT TYPE SPECIMEN" and confirmed the gallery now has exactly 1 item, whose src
  is the real `didot-type-specimen.jpg` URL (no PDF-rendered blob URLs present); confirmed
  separately that the carousel cover still renders live from the PDF (a `blob:` URL,
  1872x1053px, no console/page errors) — proving the cover path is fully independent of the
  gallery-only flag; click-to-enlarge and double-`Escape`-to-carousel both still work. Killed the
  scratch server by its exact PID, confirmed via `netstat` the port was freed.

## Completed this session (2026-07-09, part 4): added "DIDOT TYPE SPECIMEN" (Typography) PDF project, with its own wash from the start

User dropped a new `reference5/` folder containing `main photo.pdf` (16.8 MB) and `Didot Type
Specimen Final.jpg` (898 KB). Read both files' actual content before touching anything (per house
rule established in part 3): `main photo.pdf` turned out to be a full 13-page deck, not a single
cover slide — page 1 is a purple-gradient title card with a cream "DIDOT / SPECIMEN" wordmark and
a light-grey asterisk mark ("TYPESPECIMEN 2026", Bahcesehir University credit), and pages 2-13 are
a fictional-agency ("Paucek and Lage") case-study deck (creative brief, objective, audience,
components overview, brand background, campaign, creative direction, team bios, timeline,
conclusion, thank-you). `Didot Type Specimen Final.jpg` is a standalone black-background type
specimen poster for the Didot typeface itself — large magenta/pink "DIDOT" headline, a white
italic swash "f", a body paragraph on Firmin Didot and the typeface's history, and full
upper/lowercase + numeral/punctuation glyph sets in alternating pink/white/cream.

- Because `main photo.pdf` is already a complete multi-page PDF (unlike `reference3`/`reference4`,
  which needed merging first), no `pdf-lib` merge step was needed this time — copied it directly
  to `assets/projects/didot-specimen/didot-specimen.pdf` (original in `reference5/` untouched).
  Copied the companion JPG to `assets/projects/didot-specimen/didot-type-specimen.jpg` (renamed
  from the original's spaced filename to match the kebab-case convention used everywhere else in
  `assets/projects/`; content untouched).
- Title/category inferred from the cover and specimen poster text (none were given): cover reads
  "DIDOT SPECIMEN" directly, and the companion poster confirms the subject is the Didot typeface
  itself, so used `title: 'DIDOT TYPE SPECIMEN'`, `category: 'Typography'` (a new category, distinct
  from `kanye-west`'s "Editorial Design" and `breaking-the-grid`'s "Swiss Style"). Added one
  `PROJECTS` entry (`id: 'didot-specimen'`) appended after `breaking-the-grid`, preserving existing
  project order — `pdf:` handles the cover (page 1) + all 12 following pages as gallery items
  automatically (any pages added to this PDF later need zero code changes, same mechanism as every
  other `pdf:`-backed project), and `extraImages: ['assets/projects/didot-specimen/didot-type-specimen.jpg']`
  appends the standalone poster after the PDF pages — same pattern `white-noise` already
  established for its companion mockup image. (Note for next session: unlike PDF *pages*, a brand
  new *loose image file* dropped into `reference5/` later still needs one `extraImages` array line
  added here, exactly like `white-noise` today — there is no filesystem auto-discovery mechanism in
  this static, buildless site, so that one-line edit is the real ceiling of "no code changes.")
- Registered its ambient `wash` pair from the start (per explicit request, same override mechanism
  as `kanye-west`/`breaking-the-grid` — zero changes to `WASH_PALETTE`/`updateWash`/the carousel
  itself). Sampled the actual rendered cover pixels (headless Chromium + the site's own
  `pdf.min.mjs`, canvas `getImageData`, bucketed/counted): dominant tones were all purple/violet
  hues (`~#9018A8`, `~#9048C0`, `~#C060C0`) from the cover's radial gradient, with pale cream text
  a distant secondary. Set `wash: ['#7B2D8E', '#E020A0']` — deep violet base tracking the sampled
  gradient directly, magenta accent chosen (over the literal pale-cream text color, which read as
  too washed-out to work as a deliberate ambient tone) because it matches both the cover's own
  lighter pink-purple gradient stops and the companion specimen poster's dominant magenta "DIDOT"
  wordmark, so the wash reflects the piece's whole visual identity, not just page-1 pixels in
  isolation — same tuning philosophy used for `kanye-west` and `breaking-the-grid` in prior parts.
- Verified end-to-end with a scratch static server + Playwright (headless Chromium,
  `reducedMotion: 'reduce'` to make carousel tweening synchronous/deterministic, same harness as
  parts 2-3): card count is now 12 (was 11); stepped through all 12 cards via focused keyboard
  `ArrowRight` and read `--wash-a`/`--wash-b` off each card's inline style — all 11 pre-existing
  projects' wash values are byte-identical to before, and the new project's wash appears only at
  its own index; entering "DIDOT TYPE SPECIMEN" (via in-page `.click()`, since Playwright's
  viewport-actionability check false-negatives on the 3D-transformed cards) opens the project page
  with exactly 13 gallery items — 12 PDF-rendered blob URLs (pages 2-13, in order) followed by the
  real `didot-type-specimen.jpg` URL last, confirming "PDF pages then loose files, in order"; click
  first gallery image enlarges it; two `Escape` presses returns to the carousel; zero console/page
  errors throughout. Killed the scratch server by its exact PID (`netstat` lookup, targeted
  `taskkill //F //PID`, then re-checked `netstat` showed the port free) — never a blanket process
  kill.

## Completed this session (2026-07-09, part 3): added "BREAKING THE GRID" (Swiss Style) PDF project, with its own wash from the start

User dropped 3 PDFs in a new `reference4/` folder: `main photo3.pdf` (1 page, the title/cover
slide — bright-yellow background, red "KANYE" wordmark, cyan "WEST" wordmark over a cyan wave
graphic, and "BREAKING THE GRID" / "SWISS STYLE" red subtitle text), `break the grid 1. sayfa
final.pdf` (1 page, an American-flag collage spread about the "Through the Wire" single/2002 car
accident story), and `break the grid2 final.pdf` (1 page, a second collage spread — "K" hourglass
mark, a Sistine-Chapel-style reaching hand, "WEST" checkerboard type, a Kanye quote, "Billboard
Hot 100"). Confirmed all 3 page counts by reading each file with the PDF-aware Read tool before
touching anything (none needed pdfinfo/mutool, unavailable in this environment).

- Per the user's "use the first page of the *main* PDF as the cover, then every following PDF
  file's pages, preserving filename order" instructions: merged `main photo3.pdf` (cover) +
  `break the grid 1. sayfa final.pdf` + `break the grid2 final.pdf` (that order — `"...grid 1. ..."`
  sorts before `"...grid2..."` because a space sorts below the digit `2`, so filename order already
  matches the intended 1-then-2 sequence) into one 3-page PDF with `pdf-lib`, same merge approach
  as `kanye-west`. Wrote the result to `assets/projects/breaking-the-grid/breaking-the-grid.pdf`
  (originals in `reference4/` untouched).
- Inferred title/category from the cover art itself (none were given this time, unlike
  `kanye-west`): the cover's own large red text reads "BREAKING THE GRID" with "SWISS STYLE" as a
  subtitle/category label directly beneath it, so used `title: 'BREAKING THE GRID'`,
  `category: 'Swiss Style'` — deliberately not reusing the title "KANYE WEST" even though this
  deck is also about Kanye West, since that title already belongs to the `reference3` project and
  the cover's own branding foregrounds "BREAKING THE GRID" as this piece's actual name. Added one
  `PROJECTS` entry (`id: 'breaking-the-grid'`, `pdf:` only, no `extraImages` — no standalone image
  files in `reference4`), appended after `kanye-west` to preserve existing project order.
- Registered its ambient `wash` pair from the start (per explicit request, using the same
  override mechanism built for `kanye-west` in part 2 — `updateWash` already checks
  `PROJECTS[idx].wash` before falling back to the index-cycled `WASH_PALETTE`, so this needed zero
  changes to the ambient system itself). Sampled the actual rendered cover pixels (headless
  Chromium + the site's own `pdf.min.mjs`, canvas `getImageData`, bucketed/counted, not guessed):
  dominant tones were a bright yellow field (`~#FFF078`, by far the largest area) and a saturated
  cyan (`~#00C0F0`, the "WEST" wordmark/wave graphic — ~9x more pixels than the cover's minor red
  accent, so cyan was picked as the accent over red). Set
  `breaking-the-grid.wash = ['#E0A800', '#00C0F0']` — a deepened/saturated gold standing in for the
  pastel-yellow field (raw sampled yellow was too close to white to read as a deliberate ambient
  color, so darkened it the same way `kanye-west`'s crimson was tuned off its raw sample) paired
  with the cyan taken almost directly from the sample.
- Confirmed (reading `css/style.css` and the ambient-background IIFE in `js/script.js`) that
  particles and the mouse-reactive drift already ride the same `.work-bg__wash` layer and its
  `--wash-a`/`--wash-b` custom properties for every project — there is no separate per-project
  color path for particles/vignette to wire up; registering `wash` is the whole mechanism, exactly
  as instructed ("do not modify the ambient system itself").
- Verified headless (Node static server + Playwright, `prefers-reduced-motion: reduce` to make
  the ring's tween instant so wash reads didn't need timing guesses): 11 cards in the carousel (was
  10). Stepped through all 11 with keyboard arrows reading `.work-bg__wash`'s literal (non-animated)
  inline `--wash-a`/`--wash-b` values — the other 10 projects matched their pre-existing values
  byte-for-byte (`kanye-west` still `#8B1220`/`#FF5252`), `breaking-the-grid` alone resolved to
  `#E0A800`/`#00C0F0`. Cover renders from PDF page 1 (`naturalWidth: 1872`, confirmed a real
  decoded image, not broken/blank); clicking the card opens the project page with 2 gallery images
  (PDF pages 2 and 3, in order); clicking a plate enlarges it (`.gallery-item.enlarged` present);
  two Escapes returns to the carousel. No console errors. Cleaned up the scratch server by its
  specific PID only (never a blanket `taskkill /IM node.exe`).

## Completed this session (2026-07-09, part 2): fixed KANYE WEST's ambient wash color

User reported the carousel's background wash didn't match the KANYE WEST cover (deep
crimson/dark red artwork) when it became the active card. Root cause: `updateWash(idx)`
(`js/script.js`) always derives the ambient color by cycling `WASH_PALETTE` on the project's
plain array index (`idx % WASH_PALETTE.length`) -- with 10 projects and a 10-entry palette,
`kanye-west` (index 9) landed on `WASH_PALETTE[9]`, a blue, purely by coincidence of position,
with no relation to its actual cover art.
- Added a minimal per-project escape hatch rather than touching the palette/cycling system
  itself: `updateWash` now checks `PROJECTS[idx].wash` first and only falls back to the
  `WASH_PALETTE` cycle if it's absent -- every other project has no `wash` field, so their
  behavior (and the crossfade mechanism itself, the `--wash-a`/`--wash-b` `@property` transition)
  is provably unchanged.
- Sampled the real cover PDF's rendered pixels (via a headless-Chromium page importing the
  site's own `pdf.min.mjs` and reading `canvas.getImageData`, not guessed) to ground the color
  choice: dominant tones were near-black through `#560002`/`#6f0000` to a brighter `#a30100`/
  `#a80103` red streak. Set `kanye-west.wash = ['#8B1220', '#FF5252']` -- a deep-crimson base and
  bright-red accent tuned to the same base/accent lightness range as the other 10 hand-authored
  `WASH_PALETTE` pairs (base ~30-55% L, accent ~62-78% L), so it blends into the existing set
  stylistically instead of looking like an outlier.
- Verified headless: clicked through all 10 carousel cards and read the live computed
  `--wash-a`/`--wash-b` values off `.work-bg__wash` for each -- the other 9 projects' values are
  byte-identical to the unmodified `WASH_PALETTE` cycle, `kanye-west` alone now resolves to
  `rgb(139,18,32)` -> `rgb(255,82,82)`. No console errors, no carousel-logic changes.

## Completed this session (2026-07-09): added "KANYE WEST" (Editorial Design) PDF project

User dropped 3 PDFs in a new `reference3/` folder: `main photo2.pdf` (a 1-page title slide,
"KANYE WEST — Making the Grid"), `kanye final1.pdf` (1-page, magazine pages 2-3 spread), and
`kanye final2.pdf` (1-page, pages 4-5 spread) — three separate single-page exports of one
editorial layout deck, not three unrelated files (confirmed by reading each with the PDF-aware
Read tool before touching anything). The existing `pdf`-backed project convention (see
`white-noise`, below) only supports one `pdf:` path per project, so merged the 3 files into one
ordered PDF with `pdf-lib` (cover, then the two spreads, in that order) rather than adding a
multi-file variant of the mechanism — kept the code path identical to `white-noise`'s, zero JS
changes needed. Copied the merged file to `assets/projects/kanye-west/kanye-west.pdf` (originals
in `reference3/` untouched); added one `PROJECTS` entry (`id:'kanye-west'`, category `'Editorial
Design'`, `pdf:` only, no `extraImages` — reference3 had no standalone jpg/png to append).
Verified headless (Playwright against a local static server): 10 cards now in the carousel (was
9), the new card's cover renders from PDF page 1, clicking it opens the project page with 2
gallery images (PDF pages 2 and 3, in order) captioned `01/02`/`02/02`, clicking a plate enlarges
it, Escape/✕ closes back to the carousel. No console errors. Per the existing `pdf` mechanism's
whole point: dropping a 4th page into `kanye-west.pdf` later will make it appear in the gallery
automatically, no code change required.

## Completed this session (2026-07-08, part 5): real 3D camera rebuild (not a rotateY rectangle)

User pushed back hard on part 4: "the cards look like flat rectangles rotating... the ApeChain
cards feel like huge physical screens floating in space... the difference is the camera." Gave
explicit numeric requirements (55-70deg neighbor tilt, 2-5deg X tilt, dramatically increased
perspective, more spacing/recession, atmospheric depth). Root cause of the "flat" feeling: the
old model used a single `rotateY(angle) translateZ(radius)` compound per card -- which ties "how
far a card has spun" and "how far back it sits" to the *same* number, so you can't push spacing
and rotation independently, and reads flat regardless of perspective tuning.

- **Decoupled position from tilt** (`js/script.js`, `updateDepth()`): each card's transform is
  now `translate3d(xPx,0,zPx) rotateY(visualRotY) rotateX(tiltX) rotateZ(tiltRoll)` -- X spread,
  Z recession, and visual rotateY are each computed independently from the card's angular
  distance from front (`absD`), not baked into one rotateY+translateZ pair. New `stageMetrics()`
  function (replaces the old `ringRadius()`) derives `maxXSpread`/`maxRecede`/`frontBoost`/
  `rotMultiplier`/`perspective` from card width, recomputed in `buildRing()` and on resize.
- **rotMultiplier is derived, not hardcoded**: `62 / angleStep`, so one ring-step away always
  reads as ~62deg (center of the requested 55-70 range) *regardless of how many projects exist*
  (angleStep varies with count) -- verified directly via `el.style.transform` inspection: 45deg
  true angle (8-card ring) renders as exactly 62deg.
- **Active card floats toward the user**: a `frontBoost` term (peaks at `absD=0`, tapers to 0 by
  half a ring-step away) pushes only the near-front card forward in Z, magnifying it slightly via
  perspective. This deliberately reverses part of an earlier fix -- part 3 recentered the ring
  specifically to keep the front card at zero magnification (avoiding a blur bug); this session's
  user ask ("closer to camera, physically larger") explicitly wants some front-card magnification
  back. Kept modest (~1.1-1.15x, tuned via `size.width*0.14`) rather than the old uncontrolled
  ~1.7x -- a deliberate, bounded trade-off, not a reintroduced bug.
- **Per-card jitter**: fixed `tiltX`/`tiltRoll` computed once per card index (deterministic
  sine, no `Math.random`) so cards read as naturally floating rather than mathematically
  identical, per the request -- even the active/front card gets a small residual tilt.
- **Atmospheric depth**: `filter: brightness() saturate() blur()` and a `--shadow-o` custom
  property (consumed in `.carousel-card__inner`'s box-shadow) all computed from the same depth
  factor `t` used for opacity/scale -- distant cards are simultaneously dimmer, softer-shadowed,
  and blurred, not just faded.
- **Removed** `ringRadius()`, the `radius` variable, `ring.style.transform` (the ring container
  itself no longer transforms at all -- every card computes its own absolute position), and the
  CSS `.carousel-card__inner.is-hovered` rule (hover is now folded into the same per-frame
  filter/scale computation via a `c.hovered` flag on the card record, since inline `filter` set
  every frame would otherwise always beat that CSS class).
- **Real bug found and fixed while verifying**: after this rewrite, `test-3-level.js`'s
  click-to-open check started failing (`#project-page open after click: false`). Traced with
  full instrumentation (logging into the fly-in clone's WAAPI `anim.onfinish`) and confirmed the
  animation *does* complete and the project page *does* open -- just not within the test's
  existing 1500ms wait. This is the same headless-environment rAF/animation throttling found in
  part 3 (rAF ran at ~18fps instead of 60fps in this Playwright/CDP environment), likely worse
  now since every frame recomputes a heavier per-card transform+filter string for all 8 cards.
  Not a product bug -- confirmed by waiting 6s instead of 1.5s, at which point it passed cleanly.
  Bumped the relevant test waits to 4000ms. If a similar "click doesn't seem to do anything"
  result shows up again in this test harness, try a longer wait before assuming a regression.
- Verified headless: camera geometry inspected directly via `el.style.transform` (not just
  screenshots) -- confirmed `translate3d`/`rotateY`/`rotateX`/`rotateZ` values match the
  requested ranges; full 3-level flow (open/enlarge/close/back), scroll-trap, drag, reduced
  motion, and mobile viewport all still pass with the new geometry.

## Completed this session (2026-07-08, part 4): carousel motion/background polish pass

User supplied a reference video (`references/reference for motion and background.mp4`) of a
premium 3D-wheel site and asked for its *interaction/motion quality* — explicitly not its
branding/colors/contour-line texture — reproduced on top of the existing Level-1 carousel.
Analyzed the actual video frame-by-frame with `ffmpeg`/`ffprobe` (not guessed) before building
anything; confirmed: cards fill most of the viewport, the background genuinely blends between a
project's colors (both old and new visibly present mid-transition, never a hard cut), lower-left
info text updates early/live rather than waiting for settle, and the scene has constant subtle
drift even at rest.

- **Bigger cards**: `cardSize()` in `js/script.js` now targets ~70-90% of the viewport
  (was ~46-78%) and `.carousel-viewport` grew to `min(76vh,780px)` (was `56vh`/`560px`) to match.
  Removed the baked-in `.carousel-card__face` title/category caption from each card (redundant
  with the new info panel below, and the reference doesn't bake text onto its cards either).
- **Dynamic background wash** (`.work-bg`/`.work-bg__wash` in `css/style.css`): a fixed
  full-viewport layer using `@property --wash-a`/`--wash-b` (registered as `<color>`) so the
  browser natively interpolates the color over a CSS `transition` — no WAAPI/manual crossfade
  needed, and it genuinely blends (verified: sampled `rgb(59,79,214)` blue → `rgb(125,80,133)`
  purple mid-transition → `rgb(195,82,48)` orange, a real intermediate hue, not a jump). Added a
  dedicated `WASH_PALETTE` (top of `js/script.js`, alongside `TONE_PALETTE`) for this: the
  existing `TONE_PALETTE` pastels are nearly indistinguishable from each other by design (light
  card-gradient backgrounds), which made an early version of the wash barely change between
  projects — `WASH_PALETTE` reuses the same hue families but pushed far more saturated for a
  moody dark-background glow. Only visible while `#work` is in the viewport (IntersectionObserver
  toggles `.work-bg.in-view`).
- **Particle layer** (`.work-particle` — dot/ring/diamond, 26 of them, deterministic
  sine/cosine placement, no `Math.random`, matching this file's house rule): gentle idle drift +
  mouse-parallax scaled per-particle `depth`, plus a subtle twinkle. A small `rotateX/rotateY`
  camera tilt on `.carousel-viewport` reads the *same* lerped cursor position as the particles,
  so background/particles/camera move as one connected system rather than separate effects.
- **Lower-left info panel** (`.carousel-info`: number/title/category/year): new. Tracks
  whichever card is nearest the front *live*, via a single `syncActiveIndex()` called every
  `render()` frame (drag/wheel/keys/autoplay all flow through the same check) — not just on
  click, matching the reference's eager updates. **Real bug found and fixed here**: the text sat
  directly on cards with no scrim, so on light-colored placeholder cards (e.g. `wayfinding`) the
  white info text was almost unreadable. Fixed with a `radial-gradient` vignette anchored at the
  panel's own bottom-left corner (not a hard-edged linear gradient — that looked like a visible
  box) that guarantees contrast regardless of the card underneath.
- Replaced the old small `updateGlow()`/`.carousel-glow` (a blur behind the ring specifically)
  with the above — same underlying idea (crossfade to the active project's colors) but much
  bigger and using native color interpolation instead of a two-stage WAAPI opacity dip.
- **Testing note for next session**: verifying "wheel outside the carousel scrolls the page" with
  a real `page.mouse.wheel()` at a heuristically-"empty" coordinate is now flaky in Playwright,
  because cards are large enough that many candidate points sit close to a card's edge, and
  there's a small gap between querying `elementFromPoint` and the actual dispatch (worse if
  idle-autoplay is mid-rotation). This was run down with a deterministic
  `dispatchEvent(new WheelEvent(...))` test targeting `.carousel-viewport` directly instead of a
  found coordinate — confirmed the app logic itself is correct (a non-card-targeted wheel event
  is correctly ignored, no rotation). Don't chase this further as a product bug if it flakes
  again; it's a test-harness limitation (synthetic events also can't trigger native scroll at
  all, trusted-or-not), not the scroll-trap fix itself.

## Completed this session (2026-07-08, part 3): split into a real 3-level architecture

The single dual-mode ring built earlier the same day (see "part 2" below) turned out not to
match what the user actually wanted: they explicitly said the carousel and a project's own
case-study content must be **two genuinely separate views** — "think of the carousel as a
homepage, think of clicking a project as entering a case study" — not the same ring rebuilt with
different cards. Restructured into three distinct levels:

- **Level 1 — `#work-carousel`** (unchanged visually): the 3D ring now *only* ever shows the 8
  `PROJECTS` covers. It never rebuilds itself. Clicking a card no longer morphs its own content —
  it triggers a cinematic clone-and-grow transition (`flyIntoProject()`, revived from this
  project's original pre-carousel `openProject()` fly-in — clone the clicked cover, animate it to
  fill the viewport with a brightness pulse, then reveal the page below) while the ring
  simultaneously rotates to center that card in the background, so it's already settled there
  when the user comes back.
- **Level 2 — `#project-page`** (new, in `index.html`): a full-viewport overlay, structurally
  revived from the original (pre-carousel) `#project-view` modal this session had deleted, now
  scoped specifically to case-study content. For `type:'image'` projects it's an ordered
  horizontal `.gallery-track` of the project's own images/placeholders in exact source order
  (`screenItemsFor()`, now a top-level function so both the carousel and this module can use it);
  for `type:'video'` it's the clean video+supporting-grid page. The ✕ button or Escape closes it
  and returns focus to the carousel card that opened it.
- **Level 3 — enlarged image**: clicking any gallery image grows it via the same FLIP
  expand/collapse pattern used throughout this project; Escape or the scrim returns to the
  gallery (level 2), a second Escape returns to the carousel (level 1).
- Removed entirely from the carousel: `mode`/`screens`, `buildScreenCard`, `morphToMode`,
  `openProjectScreens`, `goBack`, the carousel's own `expandItem`/`collapseItem`/`enlargedCard`/
  scrim, and the `.carousel-header`/`.carousel-back`/`.carousel-caption` CSS — all superseded by
  the new project page. `updateGlow()` (the active-project ambient color match) is now driven
  centrally from `rotateToIndex()`'s completion callback instead of the old mode-morph, so it
  still updates on drag-release, wheel-step, keyboard-step, and autoplay-step alike.
- **Bug found and fixed while rebuilding**: `screenItemsFor` was a function local to the carousel
  IIFE; moving gallery-building into a separate, earlier-defined IIFE threw
  `ReferenceError: screenItemsFor is not defined` the first time a project was opened. Fixed by
  promoting it to a top-level function next to `applyTone`.
- Verified headless (Playwright) with real (not synthetic-dispatch) clicks: the carousel shows
  exactly 8 covers and zero gallery items at all times, including while the project page is open;
  clicking a cover opens `#project-page` with `linka`'s 6 images in exact source order
  (`plate-01..06.jpg`, matching `enter 1st..6th.jpg`); clicking an image enlarges it and Escape
  returns to the gallery; a second Escape closes the page and restores focus/rotation on the
  carousel; a video project (`reel`) opens its own clean video page via keyboard navigation; drag/
  wheel/idle-autoplay/ambient-background behavior (from part 2) all still work unchanged;
  reduced-motion opens the project page instantly; mobile viewport renders correctly. No console
  errors in any pass.

## Completed this session (2026-07-08, part 2): Work section replaced with a 3D interactive carousel

The user explicitly asked to remove the entire card-grid + full-viewport `#project-view`
modal/gallery concept (scattered "exhibition", `linka`'s ordered "sequence" filmstrip, and the
video page) and replace it with a large CSS-3D rotating carousel, interaction-inspired by
apechain.com (studied via its actual Next.js/GSAP bundle, not guessed — see below), built with
CSS transforms + JS only, no Three.js/WebGL.

- **One ring component, two modes.** `#work-carousel` (replacing `#work-grid`) is built entirely
  by a new "Work carousel" IIFE in `js/script.js`. `projects` mode rings the 8 `PROJECTS`;
  clicking a card animates the ring to center it, then morphs the same ring into `screens` mode
  (that project's screenshots — real `images` array, placeholder `images` count, or a video +
  `supporting` placeholders for the 2 video projects). A back button / Escape returns to
  `projects` mode at the previously active project. `PROJECTS`/`TONE_PALETTE`/`applyTone` are
  unchanged; only the dead `layout:'sequence'` field was removed from `linka` since the system it
  opted into no longer exists.
- **3D mechanics**: real CSS `perspective` on `.carousel-viewport`, `transform-style:preserve-3d`
  on `.carousel-ring` (rotated as a whole via `rotateY(currentAngle)`), each `.carousel-card`
  placed once via `rotateY(i*angleStep) translateZ(radius)`. Depth (opacity/scale) is a pure
  function of each card's angular distance from the front, recomputed on every rotation write.
- **Interaction, unified via Pointer Events**: drag, wheel, and arrow keys all rotate the same
  `currentAngle` state; release triggers inertia (capped, damped) then an eased snap to the
  nearest card. Clicking a screenshot reuses the site's existing, already-verified
  `expandItem`/`collapseItem` FLIP enlarge/collapse logic almost verbatim.
- **Motion signature adapted from apechain.com's real code**, not its visuals: downloaded and
  grepped their actual Next.js chunks, which confirmed GSAP Draggable + InertiaPlugin
  (`dragResistance`, heavily damped `throwResistance`, `maxDuration:.5`) for their slider and a
  custom WebGL "wheel" for the hero carousel, snapping via `ease:"power2.inOut"` with no
  bounce/elastic anywhere, a `dragTime`-driven micro-zoom while actively dragging, a 5s idle-auto-
  drift, and active-card-driven ambient color. Adapted (not copied) as: `easeInOutCubic` for every
  eased rotation here (same curve family as their `power2.inOut` and their own hand-rolled
  cubic drag-tension formula), capped/damped inertia on both drag and wheel, a small
  `.carousel-viewport.dragging{ transform:scale(.985) }` grab-tension, a 5s idle auto-drift
  (skipped under reduced motion), and a `.carousel-glow` behind the ring that crossfades to the
  active project's own `TONE_PALETTE` colors — scoped entirely inside `#work-carousel`, doesn't
  touch the site-wide `#ambient-bg`.
- Verified headless (Playwright): 8 cards render, first centered; drag and wheel both rotate with
  capped/damped inertia and snap to the nearest card; clicking an off-center project card centers
  it then morphs into that project's screenshots (7 for `stillwater`, 4 = video+3 supporting for
  `reel`); clicking a screenshot enlarges it with the scrim shown; Escape collapses the enlarged
  view then, on a second Escape, returns to the project ring; the explicit Back button does the
  same and restores the previously active project's rotation; full keyboard path (Tab, Arrow
  keys, Enter, Escape) works; a video project's enlarged video slot renders a real `<video>` with
  the existing placeholder-text convention; `prefers-reduced-motion:reduce` opens instantly with
  no tweened rotation; mobile viewport (390×844) renders an appropriately sized ring. No console
  errors in any of the above.

## Completed this session (2026-07-07, part 2): LinkA gallery bug fixes + reorder

User reported three issues after using the `linka` sequence gallery live:

1. **Horizontal scroll didn't work** — `.sequence-track` had `overflow-x:auto` but nothing
   translated a plain vertical mouse-wheel gesture into horizontal movement (browsers don't do
   this automatically the way some expect). Fixed with a `wheel` listener on the track that adds
   `e.deltaY` to `scrollLeft` whenever the vertical component dominates, `e.preventDefault()`ed so
   the page behind doesn't scroll-chain — native Shift+wheel and trackpad horizontal swipe
   (`deltaX`) are left alone since those already move `scrollLeft` on their own. Also added
   click-and-drag scrolling (mousedown/mousemove/mouseup on the track, `cursor:grab`/`grabbing`),
   with a `dragMoved` flag so a drag-release doesn't also fire the item's open-image click.
2. **Real bug: enlarging a second image left the first one stacked on screen instead of cleanly
   replacing it.** Root cause: `expandItem(item, scrim, basePosition)` stored the base position
   with `item.dataset.basePosition = basePosition || 'absolute'`. Sequence-gallery items pass
   `''` (empty string, meaning "flex flow, no inline position") — but `'' || 'absolute'` evaluates
   to `'absolute'` because empty string is falsy in JS. So collapsing *any* sequence item set it
   to `position:absolute` (pulled fully out of the flex row) at its last-known *viewport* pixel
   coordinates, instead of back into flow — the stray absolutely-positioned element then visually
   overlapped whatever was rendered next. Fixed by checking `basePosition !== undefined` instead
   of truthiness. Verified: rect/position of every item before enlarging vs. after a full
   open→close cycle now match, `position` correctly resets to `''`, and opening a different image
   afterward shows exactly one `.enlarged` element at the right index.
3. **Reordered `PROJECTS`** so `linka` is the first entry — it's now the first card in
   "Selected Work" (title still says "Selected Work", not "My Best Work"; nobody has asked to
   rename the section itself, only reposition this card — flag if that rename is actually wanted).

All three fixes verified headless (Playwright): scrollLeft moves on both wheel and drag, `linka`
confirmed first card in `#work-grid`, and the stacking scenario re-tested clean. No console
errors. Note for future debugging in this codebase: `foo || defaultValue` is unsafe wherever `foo`
can legitimately be `''`, `0`, or `false` — use an explicit `!== undefined` (or similar) check
instead. This exact pattern (`basePosition`) is the only one of its kind in `script.js` currently,
but worth checking for if this file grows more optional-string-arg functions.

## Completed this session (2026-07-07, part 1)

### Focus-trapping for `#project-view`
- Tab/Shift+Tab now cycle within the open project dialog instead of leaking focus to the page
  behind it. Implemented in the existing `document.addEventListener('keydown', ...)` in the
  "Project view" IIFE (`js/script.js`), alongside the existing Escape handling.
- Bug caught during verification: the first attempt filtered focusable elements with
  `el.offsetParent !== null`, which unconditionally excludes `position:fixed` elements per spec —
  that silently dropped `#project-view-close` (itself `position:fixed`) from the trap, so
  Shift+Tab from the close button escaped to the page behind instead of wrapping. Fixed by
  filtering on `el.getClientRects().length > 0` instead, which reflects real visibility
  regardless of position scheme.
- Verified headless (Playwright, `reducedMotion:'reduce'`): open dialog → close button gets
  initial focus → Shift+Tab from close button wraps to the last focusable element inside the
  dialog → Tab from there wraps back to the close button → normal mid-dialog Tab still moves
  forward → Escape still closes and returns focus to the triggering card. No console errors.
- This closes out item 4 of "Next implementation steps" below.

### First real project media: "LinkA" replaces the "Nightshift" placeholder
- User supplied real case-study images in `references/` (`main page.jpg` + `enter 1st.jpg`…
  `enter 6st.jpg`, all 1024×577 / 16:9) for an actual project: **LinkA**, an e-dating /
  academic-matching app. Copied (not moved — `references/` originals kept) into
  `assets/projects/linka/` as `cover.jpg` + `plate-01.jpg`…`plate-06.jpg`.
- Confirmed with the user before mapping: this content replaces the `nightshift` entry (the only
  existing `UI / UX` category slot) in `PROJECTS` — renamed `id` to `linka`, title to
  "LinkA — E-Dating App", year to 2026 (matches the deck's own cover slide), size `md` → `lg`
  (16:10 card aspect is a much closer match to the real 16:9 content than the old 4:5 `md` card).
- **Data model extended** (`js/script.js`) to support real media alongside the existing
  placeholder-count convention, without touching the other 5 image projects:
  - `cover: '<path>'` — if present, `renderWorkGrid` renders a real `<img class="card-cover">`
    over the existing tone-gradient `::before` (which now shows through as a brand-tinted
    letterband instead of empty space, since the cover image uses `object-fit:contain` — the
    user was explicit that cropping important content is not acceptable).
  - `images` **as an array of paths** (instead of a placeholder count number) — signals real
    per-plate media. Existing projects are untouched; their `images` is still just a number.
  - `layout: 'sequence'` — opts a project into a new ordered horizontal filmstrip
    (`buildSequenceGallery` + `.sequence-track`/`.sequence-item` in `style.css`), as opposed to
    the default freeform scattered/parallax exhibition (`buildGallery`/`exhibitLayout`), because
    this content is a narrative deck where left-to-right order matters — confirmed with the user
    this should be a per-project opt-in, not a global replacement of the existing gallery style.
  - `expandItem`/`collapseItem` (shared enlarge/collapse FLIP logic) were generalized to accept
    a `basePosition` param (`'absolute'` for the existing scattered layout's items, `''` for the
    new flex-flow sequence items) — previously hardcoded `position:'absolute'` on collapse, which
    would have broken the new flex-based filmstrip by yanking items out of flow on close.
  - Gallery item count is always `project.images.length` for sequence/real-media — there is no
    separate "placeholder slot count" to fall out of sync, so point 5 of the original brief
    ("remove empty slots if not enough images") is satisfied structurally, not by a check.
- Verified headless (Playwright): card renders with the real cover at `card--lg` size, `object-fit:
  contain` box-measured to confirm no cropping (only a ~27px letterband top/bottom from the 16:9→
  16:10 aspect mismatch); clicking the card opens the dialog; gallery renders exactly 6
  `.sequence-item`s in source order; clicking the 3rd opens it enlarged centered with the scrim
  shown; Escape collapses the enlarged plate back into the filmstrip (dialog stays open); a second
  Escape closes the whole dialog. No console errors.
- `README.md`'s "What to personalize" section rewritten to document the `cover` / array-`images` /
  `layout:'sequence'` opt-in fields alongside the original placeholder-count convention.

## Completed previous sessions

### 1. Loader: shape-to-letter morph rebuild
- Replaced the old `flubber`/`opentype` SVG path-interpolation morph (melty/blob look) with a
  DOM + Web Animations API sequence: 9 shapes, one per letter of "PORTFOLIO".
- Every shape/color/entrance-offset is a hardcoded value in the `LETTERS` array
  (`js/script.js`) — no `Math.random`, so the sequence is byte-identical on every reload.
  The three "O"s are always circles on purpose.
- Motion: bouncy entrance (translate/rotate/scale, back-ease) → hold → crossfade shape→glyph.
  All 9 letters finish exactly at `MORPH_END = 6000ms` regardless of stagger.
- Word fade-out is synced to `BLACKOUT_AT = 7250ms`, which was measured from the actual
  `assets/intro.mp4` footage via `ffprobe`/frame extraction (the brief's "~9s" estimate didn't
  match the real footage; the real fade is ~7.0–7.5s).
- Removed now-dead `js/vendor/flubber.min.js` and `opentype.min.js` (and the empty `vendor/`
  dir). `assets/fonts/BebasNeue-Regular.ttf` is no longer referenced by JS (Bebas Neue loads
  from Google Fonts) but the file was left in place.

### 2. Global ambient background (hero → whole site)
- First attempt used `references/background.png` directly as a hero image background — **the
  user rejected this** ("do not use the reference image itself... recreate it procedurally").
  That version was fully removed (including the derived `assets/hero-bg.jpg`, which no longer
  exists).
- Current implementation: `#ambient-bg`, a single `position:fixed` element (first child of
  `<body>`, `z-index:-1`) with a solid near-black base and 4 blurred, low-opacity color blobs
  (`.ambient-blob-1..4`). It exists once for the entire page — never recreated per section —
  so there are no seams when scrolling between sections.
- Motion: one `requestAnimationFrame` loop (in `script.js`) drives every blob's `transform`,
  combining slow per-blob sine/cosine idle drift with a lerped mouse-parallax offset scaled by
  each blob's `data-depth` (0.6–1.6). Mouse tracking is on `window`, so it reacts across the
  whole page, not just the hero.
- Colors were sampled directly from `references/background.png` with `ffmpeg` (pixel probes),
  not guessed: violet-indigo `#1A0A3E`-ish, warm neutral hotspot `#5D6772`/`#757573`, near-black
  edges. These became `--hero-indigo`, `--hero-warm`, `--hero-rose` in `:root`.
- Site-wide dark theme flip (required once sections had to become "transparent" over the
  canvas): `body` background/text swapped (paper↔ink), `--muted`/`--line` redefined for a dark
  base, `#contact`'s separate dark rounded panel removed (it now flows into the same canvas),
  header logo/nav made permanently light (no more scroll-dependent color toggle), grain overlay
  blend mode changed `multiply` → `overlay` so the texture stays visible on near-black.
- Fully respects `prefers-reduced-motion` (blob transform never changes — verified).

### 3. Work section: 8-project immersive exhibition (the big one)
Planned via `EnterPlanMode`/`ExitPlanMode` before writing code (plan file:
`C:\Users\HESAP\.claude\plans\wise-meandering-hopcroft.md`). Mid-plan the user added: **make it
fully data-driven** — folded into the same build.

- **Data model** (`js/script.js`, top of file): a single `PROJECTS` array — 6 `type:'image'`
  projects (`images: N` = plate count) and 2 `type:'video'` projects (`supporting: N` = extra
  media count below the video). Adding/editing a project means editing only this array.
- **Tone system**: `TONE_PALETTE` (10 gradient pairs) + `applyTone(el, i)` sets `--tone-a`/
  `--tone-b` inline per element. No CSS edits are ever needed for a new project's or a new
  gallery plate's placeholder color.
- **Card grid**: `#work-grid` (bento CSS grid, `.card--lg`/`.card--md` spans) is entirely
  generated by an IIFE in `script.js` — `index.html`'s `#work` section is just the empty
  container.
- **Cinematic fly-in**: clicking a card clones its cover, animates it (WAAPI: grow to fill
  viewport + brightness pulse, ~850ms) to simulate "flying into" the project, then reveals
  `#project-view` underneath. Skipped instantly under reduced-motion.
- **Image projects — `.exhibit-track`**: a tall scrollable container; each plate's
  x/y/depth/scale/rotation comes from a **deterministic** sine/cosine function of its index
  (same no-randomness rule as the loader) — organic, non-grid layout that's still reproducible.
  One scroll-driven `rAF` loop applies parallax (speed inversely tied to depth) plus a
  center-focus scale/opacity pulse, using only `transform`/`opacity` writes (no layout thrash).
  Click (or Enter/Space) enlarges a plate in place over a scrim; Escape or another click
  collapses it back into the flow.
- **Video projects**: a clean page — large video slot (placeholder text tells you where to set
  `src`) + a supporting-media strip below. No floating gallery for these, per the brief.
- **Accessibility**: cards and exhibit items are keyboard-focusable (`tabindex`, `role="button"`,
  `aria-label`), Enter/Space activates them, focus-visible outline extended to `.card`/
  `.exhibit-item`, Escape closes "enlarged" then "overlay" in that order, focus returns to the
  triggering card on close, body scroll is locked while the overlay is open.
- Removed the old horizontal drag-to-scroll `#work-track` code and the `[data-tone="N"]` CSS
  rules (superseded by the inline tone system above). `README.md`'s personalization section
  was rewritten to describe the new data-driven model.
- Verified extensively with a headless-Chromium (Playwright) driver script: 8 cards render;
  click → flight → gallery → scroll-parallax → enlarge → double-Escape; full keyboard-only path;
  video project renders with no exhibit-track; reduced-motion opens instantly with no parallax;
  mobile (390×844) collapses to one column.

## Current architecture

```
index.html        Page shell. #work-carousel is an EMPTY container (the homepage 3D ring,
                   covers only). #project-page is a separate EMPTY overlay (case-study gallery/
                   video + enlarge) -- structurally like the old #project-view modal, but only
                   ever holds a project's own content, never the carousel's.
css/style.css      Design tokens (:root), then sections in this order: ambient background,
                   film grain, letterbox frame, loader, nav/header, hero, section labels,
                   work carousel (viewport/ring/card only), project page (head/gallery/video/
                   enlarge), about, contact, footer, responsive, reduced-motion.
js/script.js        One file, a sequence of IIFEs (top to bottom):
                     1. Setup (reducedMotion flag, header/frame refs)
                     2. PROJECTS data + TONE_PALETTE + applyTone() + screenItemsFor()  <- data model
                     3. Loader (shape-to-letter morph)
                     4. Ambient background (mouse-reactive blobs)
                     5. Hero name cursor-reactive gradient
                     6. Letterbox frame retract on scroll
                     7. Scroll-progress readout
                     8. Scroll-reveal (.reveal/.in via IntersectionObserver)
                     9. Project page (level 2/3: gallery/video page, FLIP enlarge, focus trap) --
                        exposes openProjectPage() for the carousel below to call
                     10. Work carousel (level 1: 3D ring build/rotate/inertia/snap/idle-drift/
                         ambient-glow; click triggers the clone-and-grow transition into the
                         project page)
                     11. Back-to-top button
assets/             fonts/BebasNeue-Regular.ttf (unused by JS now, still fine to keep),
                     intro.mp4 (loader footage — actual visible content is a placeholder
                     "FIGHT CLUB" 3D render, needs to be swapped for real footage eventually),
                     projects/linka/ (real production media for the `linka` project — cover.jpg
                     + plate-01..06.jpg, referenced directly from PROJECTS in js/script.js)
references/         User's scratch/inspiration dump — this is where new real project media shows
                     up first (e.g. `main page.jpg` + `enter 1st..6th.jpg` for `linka`, added
                     2026-07-07). Not linked from production HTML/CSS itself; when a project's
                     real media arrives here, copy (don't move — keep the originals) it into
                     assets/projects/<id>/ and wire it into PROJECTS. background.png and the two
                     .mp4 clips already in here are mood-board-only, not tied to any project.
```

## Design decisions (the "why", so we don't re-litigate them)

- **No randomness anywhere.** Loader letters and tone palette assignment are pure functions of a
  fixed index/formula. This was an explicit requirement for the loader and was kept as the house
  style for everything built after it.
- **WAAPI (`.animate()`) for all bespoke motion**, plain CSS `transition` for simple hover/state
  changes, and eased `requestAnimationFrame` loops for continuously-driven values (the carousel's
  rotation tween/inertia). Established by the loader, reused throughout.
- **One fixed background layer for the entire site**, not per-section backgrounds. This was a
  direct, explicit user requirement ("no seams," "one continuous living environment") after the
  first (image-based, hero-only) attempt was rejected. (2026-07-08: the carousel's own
  `.carousel-glow` tint is deliberately scoped inside `#work-carousel`, not a change to this.)
- **Lightweight, no 3D engine.** The Work carousel (2026-07-08) is a real CSS 3D ring
  (`perspective`/`rotateY`/`translateZ`) driven by JS, not Three.js/WebGL, per explicit user
  preference ("if a lightweight solution can create the same feeling, I prefer that") — carried
  over from the original exhibition gallery's same principle.
- **Three genuinely separate levels, not one component wearing different content.** Tried
  building the project detail view as a second "mode" of the same rotating ring (2026-07-08,
  part 2) — the user rejected this explicitly: "clicking a project cover does nothing except
  keep me in the carousel... I do NOT want a simple image viewer... think of the carousel as a
  homepage, think of clicking a project as entering a case study." Rebuilt (part 3, same day) as
  `#work-carousel` (homepage ring, covers only, never rebuilds) → `#project-page` (a real
  full-viewport overlay for that project's own gallery/video) → enlarged image. Don't re-merge
  these back into one ring component; that specific design was tried and explicitly rejected.
- **FLIP-style clone-and-grow** (not real shared-element/View Transitions API, for broader
  compatibility) is used twice: `flyIntoProject()` clones the clicked cover and grows it to fill
  the viewport with a brightness pulse before `#project-page` reveals underneath (this is the
  original pre-carousel `openProject()` fly-in, revived 2026-07-08 part 3 after being removed
  part 2 along with the rest of the old `#project-view` modal — turned out the transition itself
  was right, only its destination needed to change); and the gallery's own image enlarge/collapse
  inside `#project-page`.
- **Fully data-driven Work section.** `PROJECTS` is the single source of truth; nothing about a
  project lives in HTML or CSS. This was an explicit follow-up requirement mid-build and still
  holds across both the carousel and the project page.
- **Placeholder-content convention preserved for everything without real media yet**: every
  gallery item without a `cover`/array-`images` is still a gradient (`TONE_PALETTE`), and a video
  project without a `video` src still shows the same empty-`<video>` instructional-text convention
  inside `#project-page`. `linka` has real media and uses the `cover`/array-`images` fields — see
  README.md's "What to personalize" section for the convention.

## Pending / not yet done

- **Real media**: 7 of 8 projects still have no real images/video (`linka` got its real media
  2026-07-07, see above). The other 5 image projects need real `images` arrays (or a real `cover`)
  added to their `PROJECTS` entries — `screenItemsFor()` in `js/script.js` already renders a real
  `images` array automatically in `#project-page`'s gallery, no other code changes needed; the 2
  video projects need a real `video` src field (read directly by `buildVideo()` in the Project
  page IIFE) and eventually real `supporting` images in place of the placeholder count.
- **Contact section**: Instagram/Behance/LinkedIn/Resume links are still `href="#"`; email is a
  placeholder address.
- **About portrait**: still the gradient placeholder, no real photo.
- **Loader footage**: `assets/intro.mp4` is a placeholder "FIGHT CLUB" 3D render (not the site
  owner's own footage) — needs to be replaced with real intro footage eventually, and
  `BLACKOUT_AT`/`MORPH_END` re-measured against whatever replaces it.
- **Carousel card sizing/spacing** hasn't had a design pass for "does this feel right with real
  photos" — `cardSize()`/`ringRadius()` in `js/script.js` are currently tuned against gradient
  placeholders and `linka`'s 16:9 mockups only; may want to revisit once more real images are in.
- **No deep-linking**: opening a project is pure client-side state (no URL hash), so refreshing
  while a project is open loses that state. This was an intentional scope cut in the original
  Work-section plan, not an oversight — revisit only if the user asks for shareable project links.
- No automated/CI test suite exists — all verification each session was ad hoc Playwright scripts
  run from the scratch directory, not checked into the repo.

## Next implementation steps (suggested order)

1. Get real project media for the remaining 7 projects (images for the 5 remaining image
   projects, video files for the 2 video projects) and add them to the matching `PROJECTS` entry
   in `js/script.js` — a real `images` array or `cover`/`video` field is all `screenItemsFor()`/
   `buildVideo()` need; see README.md's "What to personalize" section. This is the highest-value
   next step since everything else already works end-to-end against placeholders.
2. Swap the About portrait and Contact links/email for real content.
3. Replace `assets/intro.mp4` with real loader footage and re-measure `MORPH_END`/`BLACKOUT_AT`
   against it (same `ffprobe`-frame-extraction method used in an earlier session).
4. ~~Add focus-trapping to `#project-view`~~ — done 2026-07-07 against the original modal; that
   modal was removed 2026-07-08 (part 2) then structurally revived as `#project-page` (part 3),
   focus-trap included from the start this time. Nothing pending here.
5. Once more real photos are in, revisit `cardSize()`/`ringRadius()` in `js/script.js` — they were
   tuned against gradient rectangles, not real imagery.

## Where to continue next session

Item 1 is now partially done: `linka` has real media (2026-07-07), the other 7 projects
(5 image + 2 video) still don't. Check `references/` first each session — that's where the user
drops new project media before it gets copied into `assets/projects/<id>/` and wired into
`PROJECTS`. Items 2–3 (About/Contact content, loader footage) still require assets from the user
that aren't in the repo as of 2026-07-08.

Do not attempt to redesign or rebuild the loader, ambient background, the homepage carousel, or
the project page — all were verified working as-built (screenshots + Playwright checks, most
recently 2026-07-08 part 3) and match this file's description exactly; if something looks wrong in
a live check, treat it as a bug in the existing implementation, not a reason to redo it from
scratch. Specifically: the Work section is now the **three-level** architecture from part 3
(`#work-carousel` homepage ring → `#project-page` case-study gallery/video → enlarged image) —
the single dual-mode ring from part 2 (same day) was an intermediate step the user explicitly
rejected, not the current or a valid alternative design; don't revert to it.

The only remaining non-media item is #5 (carousel sizing pass), which should wait until more real
photos exist across projects generally. Absent new media/content from the user, there is no
further code work to do on the other 7 projects from this TODO — check back with the user for
either real assets or new scope.
