// ---- Setup ----
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// same hover/pointer convention already established elsewhere on this site (fast-travel.js,
// flow-menu.js) -- computed once here and reused by the loader crowd density and hero-frame
// tiering below. A landscape iPad can report an innerWidth well past this file's own 1024px
// tablet/desktop split (a 12.9" iPad Pro reports 1366px in landscape) despite being the exact same
// memory-constrained device as its own portrait orientation (1024px) -- raw viewport width alone
// can't tell "wide landscape tablet" apart from "wide desktop browser window," but pointer type
// reliably can: a real desktop keeps a fine/mouse pointer no matter how its window is sized, while
// every iPad orientation reports a coarse one.
var isCoarsePointer = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
var header = document.getElementById('site-header');
var fastTravel = document.getElementById('fast-travel');
var frameTop = document.getElementById('frame-top');
var frameBottom = document.getElementById('frame-bottom');

// ---- mobile-only: kick off palette extraction for the Work carousel's very first project (the
// same 'linka' lookup buildMobileWork() below uses) the instant this file runs, in parallel with
// the loader -- not gated behind afterLoader()'s own idle-callback trickle, which could otherwise
// still be queued up several idle slices later, well after the visitor has already scrolled from
// Hero into Projects. getProjectPalette() caches by project id (js/project-data.js), so
// buildMobileWork()'s own later call just reuses this same in-flight/resolved promise -- this
// never blocks anything, it only starts the work earlier so it has already resolved by the time
// the Hero -> Projects scroll transition actually happens (see mobileUpdateWash() below).
// PROJECT_MEDIA_MOBILE_TIER (js/project-data.js) is the exact same coarse-pointer +
// smaller-of-width/height tier check used everywhere else on this site -- desktop's own palette
// extraction (the 3D ring's updateWash()) is untouched and still only ever runs on demand there.
if (PROJECT_MEDIA_MOBILE_TIER) {
  (function () {
    var initial = PROJECTS.filter(function (p) { return p.id === 'linka'; })[0] || PROJECTS[0];
    if (initial) getProjectPalette(initial);
  })();
}

// ---- Loader-gated startup ----
// While the loader is on screen, its own crowd canvas + GSAP typography timeline should be the
// only thing spending frame budget -- everything below that isn't needed for the loader itself or
// for the hero it dissolves into (background effects, Prism, the Work carousel, Scenes, Flow Menu,
// Fast Travel, scroll-reveal observers, video preview elements) is registered here via
// `afterLoader()` instead of running immediately, and only actually starts once the loader IIFE
// below calls `markLoaderDone()` -- which it does the instant `loader.remove()` fires (or
// synchronously, right away, under prefers-reduced-motion/no-gsap/sprite-load-failure, since in
// those paths there's no loader animation competing for frames in the first place). Deferred work
// is then trickled out one callback per idle slice (requestIdleCallback, falling back to
// setTimeout) rather than run as one synchronous burst the moment the loader disappears -- so
// mounting Prism, building the carousel, etc. never collapses into a single dropped frame either.
var loaderDone = false;
var loaderDoneCallbacks = [];
// `{ priority: true }` puts fn at the front of the queue instead of the back -- used by exactly
// one caller (#work-carousel, see below): #work is the very next section after the hero, and its
// project cover images are what visitors actually wait on, so it deserves first crack at idle
// time over strictly-lower-the-fold mounts (identity/about-me/skills/flow-menu/fast-travel), not
// last (its previous position, dead last in registration order for no functional reason).
function afterLoader(fn, opts) {
  if (loaderDone) { fn(); return; }
  if (opts && opts.priority) loaderDoneCallbacks.unshift(fn);
  else loaderDoneCallbacks.push(fn);
}
function scheduleIdle(fn) {
  if (window.requestIdleCallback) { requestIdleCallback(fn, { timeout: 500 }); }
  else { setTimeout(fn, 0); }
}
function markLoaderDone() {
  if (loaderDone) return;
  loaderDone = true;
  var callbacks = loaderDoneCallbacks;
  loaderDoneCallbacks = [];
  function runNext() {
    if (!callbacks.length) return;
    callbacks.shift()();
    scheduleIdle(runNext);
  }
  scheduleIdle(runNext);
}

// ---- Prism-ready signal ----
// Lets other deferred, non-critical Hero work (currently: the mobile/tablet hero-frame-sequence
// continuation, see the "Hero background" section below) wait for Prism's own WebGL init --
// context creation through its first render, the single most expensive moment in that pipeline --
// to actually finish, rather than trusting afterLoader() queue order. Registration order alone
// isn't a reliable signal here: Prism's mount is gated behind two dynamic import()s of its own
// (prism-bg.js, and prism-bg.js's own import of three.module.min.js) that none of the other
// deferred mounts have, so its real execution timing can land later than queue position would
// suggest, even overlapping with something registered well after it.
// Resolves immediately whenever Prism was never going to mount at all (reducedMotion, no
// #hero-prism element, or the import itself failing) -- see the Prism mount block below -- so
// nothing waiting on it can ever hang.
var prismReady = false;
var prismReadyCallbacks = [];
function afterPrism(fn) {
  if (prismReady) { fn(); return; }
  prismReadyCallbacks.push(fn);
}
function markPrismReady() {
  if (prismReady) return;
  prismReady = true;
  var callbacks = prismReadyCallbacks;
  prismReadyCallbacks = [];
  callbacks.forEach(function (fn) { fn(); });
}

// ---- Work: fully data-driven project model ----
// PROJECTS itself, the tone/wash palettes, the pdf.js pipeline, and the cover/wash-color loaders
// (getProjectMainImageEl/getProjectPalette, both mobile/tablet-gated -- see
// PROJECT_MEDIA_MOBILE_TIER) all now live in js/project-data.js, loaded before this file --
// shared with the standalone mobile/tablet project detail pages (project/<id>/index.html,
// js/project-page.js) so neither ever holds a second copy of this data. Add a project by editing
// PROJECTS there only; nothing here needs to change.

// ---- Loader: two completely independent systems sharing one screen. ----
//
// 1) The crowd (`#loader-canvas`): a direct, de-Reactified port of a provided reference
// implementation (Skiper 39 "Crowd Canvas", an Open Peeps-based GSAP piece) -- resetPeep/
// normalWalk/createPeep/createPeeps/initCrowd/addPeepToCrowd/removePeepFromCrowd/render/resize
// below are the source's own logic, translated out of React (useEffect/useRef/props -> plain
// functions/module state) but otherwise byte-for-byte unmodified, including its own use of
// Math.random -- this file's usual "no Math.random" rule is deliberately set aside here per
// explicit instruction to preserve the source's own animation quality/timing/behavior rather than
// reinterpret it. It is a pure ambient background: peeps walk on forever, entering from one edge
// and exiting the other, endlessly recycled, exactly as the source does it. Nothing in this file
// ever moves, redirects, pauses, or removes a peep for any reason other than the source's own
// "recycle once it walks off-stage" behavior. An earlier version of this loader redirected peeps
// into a text formation -- that was explicitly rejected and none of it remains.
//
// 2) The typography (`#loader-type`): a fully separate DOM/CSS layer, positioned above the crowd,
// that fades/blurs in "WELCOME" / "TO MY" / "PORTFOLIO" with its own GSAP timeline, holds, then
// the whole loader (crowd + type together) cinematically dissolves into the revealed hero. It has
// no knowledge of the crowd whatsoever -- no shared state, no coordinate math, nothing -- driven
// purely by its own fixed timing. ----
(function () {
  var loader = document.getElementById('loader');
  var canvas = document.getElementById('loader-canvas');
  var typeLayer = document.getElementById('loader-type');
  var hero = document.getElementById('hero');

  // shared fail-open path: hide the loader and reveal the site exactly as the normal reveal
  // eventually would, without waiting for it. Guarded by the global loaderDone flag (already
  // idempotent -- see markLoaderDone() above) so this is always safe to call more than once or
  // after the loader has already completed normally; whichever happens first wins and every other
  // call becomes a no-op.
  function failOpen() {
    if (loaderDone) return;
    loader.style.display = 'none';
    hero.classList.add('show');
    header.classList.add('show');
    if (fastTravel) fastTravel.classList.add('show');
    markLoaderDone();
  }

  // mobile-only: a genuine browser back/forward navigation landing back on this page -- Safari's
  // native back button, or the in-site back link on project/<id>/index.html, which now uses
  // history.back() (see js/project-page.js) -- must restore the homepage immediately instead of
  // replaying the intro loader from scratch. Detected via the Navigation Timing API's own
  // navigation type rather than a custom "already shown" flag: 'back_forward' is the browser
  // itself reporting that this load is it traversing its own history, which a fresh visit or a
  // reload never report, so this is the actual root cause fix rather than a guess/workaround.
  // Gated by the same coarse-pointer + smaller-of-width/height mobile/tablet convention as every
  // other mobile-tier check in this file -- a fine-pointer desktop browser always skips this and
  // keeps replaying the loader exactly as before.
  var mobileTierWidth = isCoarsePointer ? Math.min(window.innerWidth, window.innerHeight) : window.innerWidth;
  var isMobileTier = isCoarsePointer && mobileTierWidth <= 1024;
  var navEntry = (window.performance && performance.getEntriesByType) ? performance.getEntriesByType('navigation')[0] : null;
  var isBackForwardNav = navEntry ? navEntry.type === 'back_forward'
    : !!(window.performance && performance.navigation && performance.navigation.type === 2);

  if (isMobileTier && isBackForwardNav) {
    failOpen();
    return;
  }

  if (reducedMotion || !canvas || typeof gsap === 'undefined') {
    failOpen();
    return;
  }

  // hard ceiling: guarantees the site is never stuck behind the loader if anything below --
  // sprite decode, GSAP setup, the crowd/typography timelines -- fails in a way not already
  // covered by img.onerror below (a request that stalls and never fires load or error on a flaky
  // mobile connection, an unexpected exception partway through setup, etc). Registered as the very
  // first thing in this path specifically so it's already armed before any of that setup runs.
  // Generous enough to never engage in the normal case -- CROWD_LEAD_MS + the type entrance
  // timeline + HOLD_MS + the reveal timeline already take several seconds together on their own --
  // this is a backstop, not a change to the loader's own timing.
  setTimeout(failOpen, 12000);

  var ctx = canvas.getContext('2d');

  // drop the character sprite sheet here: an R x C grid of equal-size cells, one character per
  // cell (the source's own default asset is Open Peeps' "all-peeps.png", 15x7) -- rows/cols must
  // match whatever sheet is actually placed at this path
  var config = { src: 'assets/loader/peeps.png', rows: 15, cols: 7 };

  // perf: the canvas backing-store resolution, independent of devicePixelRatio. Every peep is
  // drawn at exactly its sprite cell's own native size (see createPeeps()/peep.setRect() below --
  // rectWidth/rectHeight in, peep.width/peep.height out, always equal, never scaled), so the sheet
  // itself already caps how much real detail exists at 1 canvas pixel per CSS pixel -- rendering
  // the backing store any larger (the usual devicePixelRatio "retina canvas" multiplier) just makes
  // the browser raster + composite up to ~4x more pixels for up to 105 peeps every single frame,
  // for zero extra visible detail. The CSS-to-physical-pixel upscale still happens either way; at
  // scale 1 it happens once, for the whole canvas layer, as ordinary GPU layer compositing, instead
  // of once per peep per frame inside this render loop.
  var CANVAS_SCALE = 1;

  // ---- utils (verbatim from the source) ----
  function randomRange(min, max) { return min + Math.random() * (max - min); }
  function randomIndex(array) { return randomRange(0, array.length) | 0; }
  function removeFromArray(array, i) { return array.splice(i, 1)[0]; }
  function removeItemFromArray(array, item) { return removeFromArray(array, array.indexOf(item)); }
  function removeRandomFromArray(array) { return removeFromArray(array, randomIndex(array)); }
  function getRandomFromArray(array) { return array[randomIndex(array) | 0]; }

  // ---- tween factories (verbatim from the source) ----
  function resetPeep(args) {
    var stage = args.stage, peep = args.peep;
    var direction = Math.random() > 0.5 ? 1 : -1;
    var offsetY = 100 - 250 * gsap.parseEase('power2.in')(Math.random());
    var startY = stage.height - peep.height + offsetY;
    var startX, endX;

    if (direction === 1) {
      startX = -peep.width;
      endX = stage.width;
      peep.scaleX = 1;
    } else {
      startX = stage.width + peep.width;
      endX = 0;
      peep.scaleX = -1;
    }

    peep.x = startX;
    peep.y = startY;
    peep.anchorY = startY;

    return { startX: startX, startY: startY, endX: endX };
  }

  function normalWalk(args) {
    var peep = args.peep, props = args.props;
    var startX = props.startX, startY = props.startY, endX = props.endX;
    var xDuration = 10;
    var yDuration = 0.25;

    var tl = gsap.timeline();
    tl.timeScale(randomRange(0.5, 1.5));
    tl.to(peep, { duration: xDuration, x: endX, ease: 'none' }, 0);
    tl.to(peep, { duration: yDuration, repeat: xDuration / yDuration, yoyo: true, y: startY - 10 }, 0);

    return tl;
  }

  var walks = [normalWalk];

  // ---- factory (verbatim from the source, plus applyScale() -- see peepScale() below) ----
  function createPeep(args) {
    var image = args.image, rect = args.rect;
    var peep = {
      image: image, rect: [], width: 0, height: 0, baseWidth: 0, baseHeight: 0, drawArgs: [],
      x: 0, y: 0, anchorY: 0, scaleX: 1, walk: null,
      setRect: function (r) {
        peep.rect = r;
        peep.baseWidth = r[2];
        peep.baseHeight = r[3];
        peep.width = r[2];
        peep.height = r[3];
        peep.drawArgs = [peep.image].concat(r, [0, 0, peep.width, peep.height]);
      },
      // mobile-only draw-size taper (see peepScale()) -- rescales the destination width/height
      // used by render()/resetPeep() below, never the sampling rect above, so the crowd keeps
      // sampling the sprite sheet at full detail and is just composited smaller
      applyScale: function (scale) {
        peep.width = peep.baseWidth * scale;
        peep.height = peep.baseHeight * scale;
      },
      // perf: setTransform(...) + no save/restore instead of save()/translate()/scale()/restore().
      // save()/restore() snapshot the *entire* 2D context state (transform, clip, fillStyle,
      // globalAlpha, shadow props, etc.) on every call; setTransform() only overwrites the matrix,
      // which is the only piece of state this ever touches, so it's materially cheaper at 100+
      // peeps/frame -- same math (translate to peep.x/y, then flip by scaleX) and pixel-identical
      // output, just without the redundant state stack push/pop per peep, and without a per-peep
      // devicePixelRatio multiply on top (see CANVAS_SCALE above -- the backing store itself is
      // already at the right resolution, so this matrix never needs to touch dpr at all).
      render: function (c) {
        c.setTransform(peep.scaleX, 0, 0, 1, peep.x, peep.y);
        c.drawImage(peep.image, peep.rect[0], peep.rect[1], peep.rect[2], peep.rect[3], 0, 0, peep.width, peep.height);
      }
    };
    peep.setRect(rect);
    return peep;
  }

  // ---- main (verbatim from the source, aside from spriteSource/spriteWidth/spriteHeight below --
  // see the decode pipeline further down) ----
  var img = document.createElement('img');
  var spriteSource = null;   // actual drawImage() source: an ImageBitmap once decoded, else img
  var spriteWidth = 0, spriteHeight = 0;
  var stage = { width: 0, height: 0 };
  var allPeeps = [], availablePeeps = [], crowd = [];

  function createPeeps() {
    var rows = config.rows, cols = config.cols;
    var width = spriteWidth, height = spriteHeight;
    var total = rows * cols;
    var rectWidth = width / rows;
    var rectHeight = height / cols;

    for (var i = 0; i < total; i++) {
      allPeeps.push(createPeep({
        image: spriteSource,
        rect: [(i % rows) * rectWidth, ((i / rows) | 0) * rectHeight, rectWidth, rectHeight]
      }));
    }
  }

  // perf/mobile-safety: the full sprite sheet (105 peeps) all become active crowd members on a wide
  // desktop stage -- fine there, but a phone-width canvas draws exactly as many drawImage() calls
  // per frame for a fraction of the stage area. Density now tapers proportionally rather than one
  // flat number for every device: full (105) at/above CROWD_DESKTOP_MIN_WIDTH -- 1024px, the same
  // desktop/tablet split this file already uses elsewhere (see cardWidthRatio()) -- moderately
  // reduced through the tablet band, down to a floor in the ~16-24 range this site's own real-phone
  // testing called for at CROWD_PHONE_MAX_WIDTH and below. The devicePixelRatio question doesn't
  // apply here: CANVAS_SCALE above is already fixed at 1 regardless of device, on every viewport,
  // so there's no per-device DPR cost on this canvas left to cap.
  var CROWD_DESKTOP_MIN_WIDTH = 1024;
  var CROWD_PHONE_MAX_WIDTH = 430;
  var CROWD_PHONE_FLOOR = 20;
  function maxActivePeeps() {
    var total = allPeeps.length;
    // for a coarse-pointer (touch) device, classify by the SMALLER of width/height -- see
    // isCoarsePointer's own comment at the top of this file for why -- so rotating an iPad to
    // landscape can't accidentally read as "desktop" just because its width grew past the
    // threshold. Desktop (fine pointer) always uses raw stage.width, exactly as before this change.
    var w = isCoarsePointer ? Math.min(stage.width, stage.height || stage.width) : stage.width;
    if (w <= 0 || w >= CROWD_DESKTOP_MIN_WIDTH) return total;
    if (w <= CROWD_PHONE_MAX_WIDTH) return Math.min(total, CROWD_PHONE_FLOOR);
    var t = (w - CROWD_PHONE_MAX_WIDTH) / (CROWD_DESKTOP_MIN_WIDTH - CROWD_PHONE_MAX_WIDTH);
    return Math.round(CROWD_PHONE_FLOOR + t * (total - CROWD_PHONE_FLOOR));
  }

  // mobile-only fix: on a narrow coarse-pointer stage the crowd is drawn at the sprite sheet's
  // full native cell size (see the CANVAS_SCALE comment above), which is large enough relative to
  // a phone-width canvas to cover the centered "WELCOME TO MY PORTFOLIO" type. This only shrinks
  // each peep's drawn size -- same count, same sampling rect, same walk/timing logic, same
  // desktop behavior -- tapering with stage width using the exact same coarse-pointer
  // smaller-of-width/height metric and CROWD_DESKTOP_MIN_WIDTH/CROWD_PHONE_MAX_WIDTH breakpoints
  // as maxActivePeeps() above, down to PEEP_SIZE_PHONE_FLOOR at CROWD_PHONE_MAX_WIDTH and below.
  // Fine-pointer (desktop) stages always get 1 here, regardless of window width, so resizing a
  // desktop browser narrow can never trigger this -- only an actual touch/coarse-pointer device.
  var PEEP_SIZE_PHONE_FLOOR = 0.55;
  function peepScale() {
    if (!isCoarsePointer) return 1;
    var w = Math.min(stage.width, stage.height || stage.width);
    if (w <= 0 || w >= CROWD_DESKTOP_MIN_WIDTH) return 1;
    if (w <= CROWD_PHONE_MAX_WIDTH) return PEEP_SIZE_PHONE_FLOOR;
    var t = (w - CROWD_PHONE_MAX_WIDTH) / (CROWD_DESKTOP_MIN_WIDTH - CROWD_PHONE_MAX_WIDTH);
    return PEEP_SIZE_PHONE_FLOOR + t * (1 - PEEP_SIZE_PHONE_FLOOR);
  }

  function initCrowd() {
    var maxActive = maxActivePeeps();
    var n = 0;
    while (availablePeeps.length && n < maxActive) {
      addPeepToCrowd().walk.progress(Math.random());
      n++;
    }
  }

  function addPeepToCrowd() {
    var peep = removeRandomFromArray(availablePeeps);
    var walk = getRandomFromArray(walks)({ peep: peep, props: resetPeep({ peep: peep, stage: stage }) })
      .eventCallback('onComplete', function () {
        removePeepFromCrowd(peep);
        addPeepToCrowd();
      });

    peep.walk = walk;
    crowd.push(peep);
    crowd.sort(function (a, b) { return a.anchorY - b.anchorY; });
    return peep;
  }

  function removePeepFromCrowd(peep) {
    removeItemFromArray(crowd, peep);
    availablePeeps.push(peep);
  }

  function render() {
    if (!canvas) return;
    // reset to identity before clearing -- setTransform below is absolute, not relative like the
    // old save()/scale()/restore() dance, so nothing here needs a matching restore() of its own
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // plain indexed loop instead of crowd.forEach(fn) -- avoids allocating a new closure every
    // single frame (this runs on gsap.ticker, i.e. once per rAF) for up to ~100 peeps
    for (var i = 0; i < crowd.length; i++) { crowd[i].render(ctx); }
  }

  function resize() {
    if (!canvas) return;
    stage.width = canvas.clientWidth;
    stage.height = canvas.clientHeight;
    canvas.width = stage.width * CANVAS_SCALE;
    canvas.height = stage.height * CANVAS_SCALE;

    // must run before initCrowd()/resetPeep() below, since resetPeep() positions each peep off
    // its own peep.width/peep.height
    var scale = peepScale();
    allPeeps.forEach(function (peep) { peep.applyScale(scale); });

    crowd.forEach(function (peep) { peep.walk.kill(); });
    crowd.length = 0;
    availablePeeps.length = 0;
    availablePeeps.push.apply(availablePeeps, allPeeps);

    initCrowd();
  }

  function init() {
    createPeeps();
    resize();
    gsap.ticker.add(render);
    // the typography's lead-in delay is measured from here -- the moment the crowd is actually
    // rendering on screen -- not from page-load time, so "the crowd walks alone for ~2-3s" holds
    // true regardless of how long the sprite sheet itself took to fetch/decode
    setTimeout(playTypeEntrance, CROWD_LEAD_MS);
  }

  // Pre-decode the ~3600x2268 sprite sheet off the critical rendering path, before init()/render()
  // ever touch it -- without this, the browser can end up doing the full pixel decode synchronously
  // on the very first drawImage() call instead, i.e. exactly when the crowd is meant to start
  // walking, causing a stutter right at the loader's opening beat.
  //   createImageBitmap() is preferred where available: it decodes asynchronously (off the main
  // thread) AND hands back a bitmap that's a cheaper drawImage() source than a live <img> element
  // for repeated per-frame sampling (no per-draw CSS/orientation bookkeeping), while still being the
  // same single shared sprite-sheet texture underneath -- every peep still samples a sub-rect of
  // this one image, so the browser can batch same-texture draw calls the same way it always could.
  // Falls back to img.decode(), then to the bare loaded <img>, on browsers without createImageBitmap.
  function beginCrowd(source, width, height) {
    spriteSource = source;
    spriteWidth = width;
    spriteHeight = height;
    init();
  }
  img.onload = function () {
    if (window.createImageBitmap) {
      createImageBitmap(img).then(function (bitmap) {
        beginCrowd(bitmap, bitmap.width, bitmap.height);
      }, function () {
        beginCrowd(img, img.naturalWidth, img.naturalHeight);
      });
    } else if (img.decode) {
      img.decode().then(function () {
        beginCrowd(img, img.naturalWidth, img.naturalHeight);
      }, function () {
        beginCrowd(img, img.naturalWidth, img.naturalHeight);
      });
    } else {
      beginCrowd(img, img.naturalWidth, img.naturalHeight);
    }
  };
  // sprite sheet not in place, or the request failed outright -- fail open rather than leave the
  // site stuck behind a loader that can never finish
  img.onerror = failOpen;
  img.src = config.src;

  window.addEventListener('resize', resize);

  // =========================================================================================
  // ---- Typography: fully independent of everything above. Its own fixed timeline, its own
  // DOM elements, zero shared state with the crowd. ----
  // =========================================================================================
  var CROWD_LEAD_MS = 600;   // let the crowd walk alone first -- screen feels alive before type appears
  var HOLD_MS = 2000;        // ms the fully-assembled phrase holds before the reveal transition

  // per-character choreography. Lead words (WELCOME/PORTFOLIO) get a slower, weightier settle;
  // the "to my" sub-line moves quicker and lighter, reinforcing the size hierarchy through motion
  var LEAD_CHAR_STAGGER = 0.055;
  var LEAD_CHAR_DURATION = 1.3;
  var SUB_CHAR_STAGGER = 0.05;
  var SUB_CHAR_DURATION = 0.85;
  // absolute timeline position (seconds) each line's own char animation starts at -- overlapping
  // rather than strictly sequential, so the three lines cascade into each other
  var LINE_START = [0, 0.6, 1.55];

  // deterministic per-character variation (fixed sine-based hash of index+salt, not Math.random)
  // -- same house rule as the rest of this file: reproducible/byte-identical every reload
  function hash01(i, salt) {
    var x = Math.sin(i * 12.9898 + salt * 78.233 + 4.53) * 43758.5453;
    return x - Math.floor(x);
  }

  // splits a line's text into one <span class="loader-char"> per non-space character (spaces
  // become a literal, unanimated &nbsp;) so each letter can move independently
  function splitIntoChars(lineEl) {
    var text = lineEl.textContent;
    lineEl.textContent = '';
    var chars = [];
    text.split('').forEach(function (ch) {
      if (ch === ' ') {
        lineEl.appendChild(document.createTextNode(' '));
      } else {
        var span = document.createElement('span');
        span.className = 'loader-char';
        span.textContent = ch;
        lineEl.appendChild(span);
        chars.push(span);
      }
    });
    return chars;
  }

  // a richer, layered entrance: each character gets its own small random-ish start offset,
  // rotation and scale that settle back to neutral, split across two concurrent tweens per line
  // (a clean power4 fade/focus-pull, and a back.out overshoot-and-settle on position/rotation/
  // scale) rather than one flat fade -- so the motion reads as designed, not a stock fade/slide.
  function playTypeEntrance() {
    var lineEls = Array.prototype.slice.call(typeLayer.querySelectorAll('.loader-type-line'));

    // pass 1: split every line into char spans and pin each one to its hidden pre-animation state
    // -- nothing is revealed yet, so this can't ever paint a frame of static/raw text
    var lineData = lineEls.map(function (lineEl, li) {
      var chars = splitIntoChars(lineEl);
      chars.forEach(function (ch, ci) {
        var dx = (hash01(ci, li * 4 + 1) - 0.5) * 34;
        var dy = 44 + hash01(ci, li * 4 + 2) * 26;
        var rot = (hash01(ci, li * 4 + 3) - 0.5) * 18;
        var startScale = 0.62 + hash01(ci, li * 4 + 4) * 0.5;
        gsap.set(ch, { opacity: 0, x: dx, y: dy, rotate: rot, scale: startScale, filter: 'blur(9px)' });
      });
      return { lineEl: lineEl, chars: chars };
    });

    // pass 2: every char across every line is now hidden and positioned -- only now is it safe to
    // reveal the container (`#loader-type` starts at opacity:0 in CSS), so the very first painted
    // frame of type is already mid-motion, never a static line sitting on screen first
    gsap.set(typeLayer, { opacity: 1 });

    var tl = gsap.timeline({
      onComplete: function () { setTimeout(playReveal, HOLD_MS); }
    });

    lineData.forEach(function (data, li) {
      var isLead = data.lineEl.classList.contains('loader-type-line--lead');
      var stagger = isLead ? LEAD_CHAR_STAGGER : SUB_CHAR_STAGGER;
      var duration = isLead ? LEAD_CHAR_DURATION : SUB_CHAR_DURATION;
      var chars = data.chars;
      var startAt = LINE_START[li] || 0;

      // layer 1: opacity/focus-pull -- clean, settles slightly ahead of the motion layer
      tl.to(chars, {
        opacity: 1, filter: 'blur(0px)',
        duration: duration * 0.65, ease: 'power4.out', stagger: stagger
      }, startAt);
      // layer 2: position/rotation/scale -- smooth overshoot and settle
      tl.to(chars, {
        x: 0, y: 0, rotate: 0, scale: 1,
        duration: duration, ease: 'back.out(1.6)', stagger: stagger
      }, startAt);
    });
  }

  // cinematic reveal: a slight camera push-in on the type layer, the type and the crowd both
  // softly dissolving, the loader's own background fading -- all one GSAP timeline running
  // concurrently with the hero/header's own existing CSS opacity fades (triggered at t=0, not
  // after the loader finishes), so it reads as one continuous cross-dissolve, not a hard cut
  // followed by a separate fade-in.
  function playReveal() {
    window.removeEventListener('resize', resize);
    hero.classList.add('show');
    header.classList.add('show');
    if (fastTravel) fastTravel.classList.add('show');

    var tl = gsap.timeline({
      onComplete: function () {
        gsap.ticker.remove(render);
        loader.remove();
        markLoaderDone();
      }
    });

    tl.to(typeLayer, { scale: 1.06, duration: 1, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0);
    tl.to(typeLayer, { opacity: 0, duration: 0.9, ease: 'power3.inOut' }, 0.05);
    tl.to(canvas, { opacity: 0, duration: 1, ease: 'power3.inOut' }, 0.1);
    tl.to(loader, { opacity: 0, duration: 1, ease: 'power3.inOut' }, 0.15);
  }
})();

// ---- Ambient background: one continuous canvas, mouse-reactive drifting light behind the whole
// page -- deferred via afterLoader(), see the "Loader-gated startup" block at the top of this
// file: not needed until the loader itself has finished. ----
afterLoader(function () {
  var blobs = Array.prototype.slice.call(document.querySelectorAll('.ambient-blob'));
  if (!blobs.length || reducedMotion) return;
  // stability-first: this animates continuously (mouse + idle drift) for the page's entire life,
  // behind the Hero and every other section, and each blob is a permanently-composited (large,
  // heavily blurred) layer -- real, sustained compositing work stacked on top of everything else
  // active right at loader hand-off. On phone/tablet this loop is never started at all: no
  // mousemove listener, no requestAnimationFrame, nothing to stop later -- the blobs render once,
  // at their plain CSS position, as a static (non-animating) background instead. Desktop is
  // unaffected, same continuous animation as before.
  if (isCoarsePointer && Math.min(window.innerWidth, window.innerHeight) <= 1024) return;

  var targetX = 0, targetY = 0, curX = 0, curY = 0; // mouse offset from viewport center, range -1..1

  window.addEventListener('mousemove', function (e) {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = (e.clientY / window.innerHeight) * 2 - 1;
  });
  window.addEventListener('mouseleave', function () {
    targetX = 0; targetY = 0;
  });

  var t = 0;
  function loop() {
    t += 0.0022;
    // slower lerp = more lag/fluidity -- the blobs should trail the cursor, not track it directly
    curX += (targetX - curX) * 0.045;
    curY += (targetY - curY) * 0.045;

    blobs.forEach(function (blob, i) {
      var depth = parseFloat(blob.dataset.depth) || 1;
      var phase = i * 2.4;
      var driftX = Math.sin(t + phase) * 4.5;
      var driftY = Math.cos(t * 0.8 + phase) * 4.5;
      // clearly noticeable cursor-follow, scaled per blob's own depth for a parallax feel
      var parallaxX = curX * 16 * depth;
      var parallaxY = curY * 16 * depth;
      blob.style.transform = 'translate(' + (driftX + parallaxX) + '%, ' + (driftY + parallaxY) + '%)';
    });

    requestAnimationFrame(loop);
  }
  loop();
});

// ---- Hero name: a two-layer parallax riding a damped cursor position (curX/curY below) --
// Typography (#hero-name-wrap) moves slightly more than the Prism background (#hero-prism),
// matching the "typography 1-3px, background slightly less" depth cue -- both capped low enough
// to read as physical settling, not floating. The gradient/shine on the name itself is now pure
// CSS (see .hero-name .row), so this loop no longer needs to feed it a cursor position. ----
(function () {
  var heroName = document.querySelector('.hero-name');
  var hero = document.getElementById('hero');
  if (!heroName || !hero || reducedMotion) return;
  // stability-first: a continuously-running rAF loop (mouse + idle drift) for the page's entire
  // life, writing transform on the Hero name and, on desktop, Prism's own mount -- one more thing
  // competing for frame budget right at loader hand-off. Never started on phone/tablet: no
  // mousemove listener, no requestAnimationFrame. The name simply holds its plain, settled CSS
  // position instead of drifting -- Prism doesn't exist on this tier at all (see the Prism mount
  // block elsewhere in this file), so there's nothing here for it to move anyway. Desktop
  // unaffected, same continuous parallax as before.
  if (isCoarsePointer && Math.min(window.innerWidth, window.innerHeight) <= 1024) return;

  var nameWrap = document.getElementById('hero-name-wrap');
  var prismMount = document.getElementById('hero-prism');

  var targetX = 50, targetY = 50, curX = 50, curY = 50;

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width) * 100;
    targetY = ((e.clientY - rect.top) / rect.height) * 100;
  });

  hero.addEventListener('mouseleave', function () {
    targetX = 50; targetY = 40;
  });

  // Gentle idle drift so the effect feels alive even without cursor movement
  var t = 0;
  function loop() {
    t += 0.01;
    var idleX = 50 + Math.sin(t) * 6;
    var idleY = 42 + Math.cos(t * 0.8) * 6;

    var mixX = (targetX * 0.6) + (idleX * 0.4);
    var mixY = (targetY * 0.6) + (idleY * 0.4);

    curX += (mixX - curX) * 0.06;
    curY += (mixY - curY) * 0.06;

    var normX = (curX - 50) / 50, normY = (curY - 50) / 50;
    if (nameWrap) {
      nameWrap.style.transform = 'translate3d(' + (normX * 2.5).toFixed(2) + 'px,' + (normY * 1.8).toFixed(2) + 'px,0)';
    }
    if (prismMount) {
      prismMount.style.transform = 'translate3d(' + (normX * 1.1).toFixed(2) + 'px,' + (normY * 0.7).toFixed(2) + 'px,0)';
    }

    requestAnimationFrame(loop);
  }
  loop();
})();

// ---- Hero scroll micro-parallax: a near-imperceptible scale/blur as the hero is scrolled past,
// so the hero->work handoff reads as felt rather than seen -- Apple/Linear/Raycast-style
// restraint, not a cinematic push-through. Deliberately narrow range (max 1.02 scale, 1.5px blur)
// and no opacity change (that property is already owned by the entrance fade above). The target
// is damped toward each frame with the same lerp approach as the cursor parallax above, so it
// settles smoothly rather than snapping 1:1 to scroll position. ----
(function () {
  var hero = document.getElementById('hero');
  if (!hero || reducedMotion) return;

  // perf/mobile-safety: this effect's filter:blur() (and, to a much lesser extent, its
  // transform:scale()) apply directly to #hero itself -- which has BOTH hero canvases as direct
  // children, Prism's own WebGL canvas (#hero-prism, mounted inside #hero -- see index.html) and
  // the 2D frame-sequence canvas. A CSS filter forces the browser to rasterize that entire subtree
  // -- both canvases and the glow together -- to an offscreen buffer every scroll frame it's
  // active, instead of the cheap GPU-compositor-only path a plain transform on an unrelated
  // element would get. That's real, additional compositing work stacked directly on top of
  // Prism's own raymarch and the frame-sequence canvas's own draw, in exactly the window right
  // after loader hand-off where a real iPhone/iPad has been crashing. A previous pass capped just
  // the blur half to 0 on phone; this one removes the whole effect (scale included, since it's the
  // same subtree being touched every frame either way) on phone AND tablet -- no scroll/resize
  // listeners registered, no rAF loop started, #hero's own transform/filter never written -- while
  // leaving desktop completely unchanged. The frame-sequence's own scroll-scrub (a separate loop,
  // see the "Hero background" IIFE elsewhere in this file) is untouched by this and keeps
  // responding to scroll normally on every device -- this only removes the extra scale/blur
  // layered on top of the whole #hero container.
  if (window.innerWidth <= 1024) return;

  var MAX_SCALE = 0.02; // 1 -> 1.02
  var MAX_BLUR = 1.5;   // px

  var track = document.getElementById('hero-scroll-track');
  var targetT = 0, curT = 0;

  function updateTarget() {
    // reference distance is "how far the hero has to scroll to fully unpin", not its own
    // offsetHeight -- since #hero now sits pinned (position:sticky) inside a taller
    // #hero-scroll-track to give the background video scroll runway, hero.offsetHeight alone
    // would stay ~1 viewport and make this effect max out right at the start of that pinned
    // range instead of at the actual hero->work handoff at the end of it
    var heroHeight = (track ? track.offsetHeight - hero.offsetHeight : hero.offsetHeight) || 1;
    targetT = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
  }
  window.addEventListener('scroll', updateTarget, { passive: true });
  window.addEventListener('resize', updateTarget);
  updateTarget();

  function loop() {
    curT += (targetT - curT) * 0.12;
    hero.style.transform = 'scale(' + (1 + curT * MAX_SCALE).toFixed(4) + ')';
    hero.style.filter = curT > 0.001 ? 'blur(' + (curT * MAX_BLUR).toFixed(2) + 'px)' : 'none';
    requestAnimationFrame(loop);
  }
  loop();
})();

// ---- Prism (hero-scoped): a fixed, premium violet/indigo ambient light behind the hero copy --
// lazily imported (code-split, same convention as the WebGL modules elsewhere on this page) and
// mounted once on load, skipped entirely under reduced motion like every other motion effect in
// this file. See js/prism-bg.js for the shader itself. Deferred via afterLoader() -- the hero's
// name/copy are already fully legible without it, so it can pop in a beat after the loader hands
// off rather than competing with it for frame budget. ----
afterLoader(function () {
  // every early-exit here must still call markPrismReady() -- anything waiting on afterPrism()
  // (the mobile/tablet hero-frame continuation below) must never hang just because Prism itself
  // was never going to mount.
  if (reducedMotion) { markPrismReady(); return; }
  var mount = document.getElementById('hero-prism');
  if (!mount) { markPrismReady(); return; }
  // stability-first: Prism is completely removed from phone/tablet, not just tiered down or
  // hidden. Real-device testing showed a crash still happening even at Prism's lightest tier, and
  // WebGL context creation + shader compilation is a well-documented category of mobile GPU/driver
  // crash independent of how few pixels/iterations it's asked to do -- the only way to actually
  // remove that risk is to never create the context at all. The module itself (js/prism-bg.js,
  // which also pulls in Three.js) is never even fetched on phone/tablet: no import(), no
  // WebGLRenderer, no shader compile, no render loop, nothing to dispose of later. Same
  // isCoarsePointer + smaller-of-width/height check as the loader's own crash-safety logic (see
  // that variable's own comment near the top of this file) so a landscape iPad can't slip past
  // this the same way it could slip past a raw-width check. Desktop is completely unchanged --
  // exact same import()/createPrism() call as before, same tier object, same visual result.
  var prismTierWidth = isCoarsePointer ? Math.min(window.innerWidth, window.innerHeight) : window.innerWidth;
  if (prismTierWidth <= 1024) { markPrismReady(); return; }
  import('./prism-bg.js').then(function (mod) {
    mod.createPrism(mount, { maxPixelRatio: 1.75, steps: 64, onFirstFrame: markPrismReady });
  }, markPrismReady); // import() itself failing (network/parse error) -- fail open the same way
});

// ---- Hero background: preloaded WebP frame-sequence, painted from scroll position ----
// Replaces video.currentTime scrubbing entirely. A <video> seek is an async, GOP-dependent
// decode -- the actual cause of the old approach's stutter, no matter how the scroll math was
// tuned. Every frame here is a separate, already-decoded still image, so painting a given scroll
// progress is just a synchronous canvas draw with nothing to stall on. Frames start preloading
// the instant this runs, in parallel with the loader's own several-second hold, so essentially
// the whole sequence is already resident in memory by the time the hero reveals. Under reduced
// motion, #hero-scroll-track collapses to one viewport (no scroll-driven progression is wired up
// at all) but the opening frame still loads and paints once, statically -- reduced motion means
// no motion, not no image.
//
// Source frames (assets/hero/frames) are exported at the master's native 3840x2160, quality
// 95-100, uncompromised -- but decoding all 126 of those at full native size simultaneously would
// hold on the order of 4GB of raw bitmap memory at once, which is what would actually cause
// jank/crashes, not the file size. So each frame is decoded via createImageBitmap's own
// resize-on-decode (a real resample done once by the browser, not a quality cut) to the exact
// pixel size this screen's canvas backing store can show -- full native detail on a 4K/high-DPR
// display, no more pixels than will ever be painted on a smaller one. This is the "optimize the
// rendering" half of the brief; the stored assets themselves are untouched, full-quality 4K.
(function () {
  var track = document.getElementById('hero-scroll-track');
  var canvas = document.getElementById('hero-bg-canvas');
  var content = document.getElementById('hero-content');
  if (!track || !canvas) return;

  // heroTierWidth (not raw window.innerWidth) -- see isCoarsePointer's own comment near the top of
  // this file: a landscape iPad/tablet can report a width past 1024 (a 12.9" iPad Pro reports
  // 1366px in landscape) despite being the exact same memory-constrained device as its own
  // <=1024px portrait orientation. For a coarse-pointer device, this uses the smaller of
  // width/height instead, so rotating a tablet can't accidentally skip the safe path below.
  // Desktop (fine pointer) always uses raw innerWidth, unaffected. Computed up front, before any
  // canvas/manifest/decode setup below, so the mobile branch immediately following can skip all
  // of it outright rather than merely never calling into it.
  var heroTierWidth = isCoarsePointer ? Math.min(window.innerWidth, window.innerHeight) : window.innerWidth;
  var HERO_MOBILE_TIER = heroTierWidth <= 1024;

  if (HERO_MOBILE_TIER) {
    // phone/tablet: ONE static image -- the exact existing frame-001.webp (the complete
    // MacBook/Apple Pencil/iPad composition), the site's own first frame, inserted as a plain
    // <img> in place of the canvas. No manifest fetch, no createImageBitmap decode pipeline, no
    // canvas backing-store sizing, no scroll listener, no requestAnimationFrame loop -- that
    // entire machinery exists to cycle through 126 frames as the user scrolls, which a single
    // always-static image has no use for at all. Simpler is also more robust here: nothing in
    // this path depends on the canvas element's own layout timing or backing-store dimensions
    // ever being correct, the way drawFrame()/coverDecodeRect() below do. The canvas itself is
    // hidden rather than removed (harmless, inert, never given a src on this tier) so nothing
    // else that references #hero-bg-canvas by id needs to change. Desktop is completely
    // untouched: it never runs this branch, and reducedMotion (checked further down) still uses
    // the canvas pipeline exactly as before -- this only replaces HERO_MOBILE_TIER's own path.
    canvas.style.display = 'none';
    var mobileFrame = document.createElement('img');
    mobileFrame.className = 'hero-bg-mobile-frame';
    mobileFrame.alt = '';
    mobileFrame.decoding = 'async';
    mobileFrame.fetchPriority = 'high'; // above-the-fold hero content, guaranteed visible on load
    mobileFrame.src = 'assets/hero/frames/frame-001.webp';
    canvas.insertAdjacentElement('afterend', mobileFrame);
    return;
  }

  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high'; // best resampling for the native-res source -> backing-store draw

  var FRAMES_BASE = 'assets/hero/frames/';
  var SCROLL_RANGE = 1700; // px of scroll to play through the full sequence, matches the CSS track
  var CONTENT_MAX_SCALE = 0.03;   // 1 -> 0.97 as the sequence approaches its final frame
  var CONTENT_MAX_TRANSLATE = 10; // 0 -> -10px
  var CONTENT_MAX_FADE = 0.05;    // 1 -> 0.95

  var frames = [];  // sparse: frames[i] is set once that frame has loaded and decoded. Desktop
                     // only -- this fills in fully and stays that way (every index, held for the
                     // page's life). On phone/tablet (HERO_MOBILE_TIER, above) this whole
                     // canvas/frames pipeline is never reached at all -- see this IIFE's own early
                     // return for that tier, well before this line.
  var frameCount = 0;
  var nativeW = 0, nativeH = 0;
  var lastDrawnIndex = -1;
  var curT = 0; // read by resizeCanvas even before the scroll-scrub path (if any) starts owning it
  var pad = 3, decodeRect = null; // set once the manifest resolves; read by loop() on every tick

  function frameUrl(i, pad) {
    var n = String(i + 1);
    while (n.length < pad) n = '0' + n;
    return FRAMES_BASE + 'frame-' + n + '.webp';
  }

  // the crop-then-resize rect to decode each frame at: the same "cover" math drawFrame() uses at
  // draw time, computed here against the SOURCE's native dimensions and applied at decode time via
  // createImageBitmap's own crop overload (sx,sy,sw,sh), instead of resizing the whole source first
  // and letting drawFrame() crop the (wasted) excess away afterward every frame.
  //
  // The old version only computed a resize target (nativeW*scale x nativeH*scale, scale picked by
  // whichever dimension needed MORE resolution to "cover") and decoded the entire source at that
  // size. That's fine on a desktop viewport, whose aspect ratio is already close to this landscape
  // source's own -- but on a portrait phone viewport (tall, narrow) against a landscape 3840x2160
  // source, the height-driven scale lands close to 1.0, so it decoded nearly the FULL native width
  // (~3733px measured) on every one of 127 frames just to keep the ~1170px center slice that
  // drawFrame() actually crops to afterward -- roughly 3x more pixels decoded than ever painted,
  // times 127 frames, a real multi-hundred-MB-to-gigabyte-scale cumulative allocation. iOS Safari
  // doesn't throw a catchable error when a tab exceeds its memory budget -- it silently kills/
  // reloads it, which is what this fixes: a real-device crash during the loader's hold (while this
  // preload runs in the background), not a performance nit and not anything introduced by this
  // site's other mobile-safety passes (the concurrency cap above only throttles how many decodes
  // are in flight at once; it never reduced how much any single one actually allocated).
  //
  // Cropping the source rectangle first and resizing only that crop to exactly the canvas's own
  // backing-store size bounds decode memory to canvas.width x canvas.height on every viewport,
  // mismatched aspect ratio or not, and produces the pixel-identical result at draw time either
  // way (drawFrame()'s own crop becomes a no-op once the decoded bitmap already matches the canvas
  // exactly). For any viewport whose aspect ratio already roughly matches the source -- every
  // desktop case here -- sx/sy land at/near 0 and sw/sh at/near the source's own full extent, i.e.
  // this produces the same decode target desktop already had; only the mismatched portrait-mobile
  // case actually changes.
  function coverDecodeRect() {
    var cw = canvas.width, ch = canvas.height;
    if (!cw || !ch) return { sx: 0, sy: 0, sw: nativeW, sh: nativeH, dw: nativeW, dh: nativeH };
    var scale = Math.max(cw / nativeW, ch / nativeH);
    var sw = Math.min(nativeW, cw / scale);
    var sh = Math.min(nativeH, ch / scale);
    return {
      sx: Math.max(0, Math.round((nativeW - sw) / 2)),
      sy: Math.max(0, Math.round((nativeH - sh) / 2)),
      sw: Math.max(1, Math.round(sw)),
      sh: Math.max(1, Math.round(sh)),
      dw: cw,
      dh: ch
    };
  }

  // createImageBitmap's crop-then-resize performs a real high-quality resample during decode
  // itself (not a quality cut -- it's the same pixels the canvas would end up showing anyway), so
  // the browser never has to hold anywhere near a full 3840x2160 bitmap per frame in memory. Falls
  // back to a plain Image (decoded at native size, cropped only at draw time by drawFrame() as
  // before) on the rare browser without createImageBitmap. If frames[i] already holds something
  // (a re-request for an index that's already resident) this resolves immediately without a
  // second fetch/decode.
  function loadFrame(i, pad, rect) {
    if (frames[i]) return Promise.resolve();
    var url = frameUrl(i, pad);
    if (window.createImageBitmap) {
      return fetch(url).then(function (r) { return r.blob(); }).then(function (blob) {
        return createImageBitmap(blob, rect.sx, rect.sy, rect.sw, rect.sh, {
          resizeWidth: rect.dw, resizeHeight: rect.dh, resizeQuality: 'high'
        });
      }).then(function (bitmap) { frames[i] = bitmap; }).catch(function () {});
    }
    var img = new Image();
    img.src = url;
    var settle = img.decode ? img.decode() : new Promise(function (resolve) {
      img.onload = resolve; img.onerror = resolve;
    });
    return settle.catch(function () {}).then(function () { frames[i] = img; });
  }

  // draws a frame into the canvas replicating CSS object-fit:cover -- canvas has no native
  // equivalent, so the source crop rect is computed by hand. Works for both ImageBitmap and
  // Image sources -- both expose plain .width/.height once ready.
  function drawFrame(index) {
    var img = frames[index];
    if (!img || index === lastDrawnIndex) return;
    var cw = canvas.width, ch = canvas.height;
    var iw = img.width, ih = img.height;
    if (!cw || !ch || !iw || !ih) return;
    var scale = Math.max(cw / iw, ch / ih);
    var sw = cw / scale, sh = ch / scale;
    var sx = (iw - sw) / 2, sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    lastDrawnIndex = index;
  }

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawnIndex = -1; // force a redraw at the new backing size
    if (frameCount) drawFrame(Math.round(curT * (frameCount - 1)));
  }
  window.addEventListener('resize', resizeCanvas);

  // ---- desktop: unchanged -- decode every frame once, keep every one resident for the page's
  // life. No concurrency pool needed at all above 1 in-flight fetch+decode chain; this file never
  // fired more than FRAME_LOAD_CONCURRENCY requests at once even before this pass, and desktop
  // devices have never been where the crash was reproduced. ----
  var FRAME_LOAD_CONCURRENCY = 6;
  function loadFrames(indices, pad, rect) {
    var i = 0, active = 0;
    function pump() {
      while (active < FRAME_LOAD_CONCURRENCY && i < indices.length) {
        var idx = indices[i++];
        active++;
        loadFrame(idx, pad, rect).then(function () {
          active--;
          pump();
        });
      }
    }
    pump();
  }
  function rangeIndices(count) {
    var out = [];
    for (var i = 0; i < count; i++) out.push(i);
    return out;
  }

  fetch(FRAMES_BASE + 'manifest.json').then(function (r) { return r.json(); }).then(function (manifest) {
    frameCount = manifest.count;
    nativeW = manifest.width;
    nativeH = manifest.height;
    pad = manifest.pad || 3;
    resizeCanvas();
    decodeRect = coverDecodeRect();

    if (reducedMotion) {
      loadFrame(0, pad, decodeRect).then(function () { drawFrame(0); });
      return;
    }

    // HERO_MOBILE_TIER already returned at the top of this IIFE, before this manifest fetch was
    // ever issued -- everything from here down is desktop only.

    loadFrames(rangeIndices(frameCount), pad, decodeRect);
    startScrollScrub();
  }).catch(function () {});

  function startScrollScrub() {
    var targetT = 0;

    // perf: getBoundingClientRect() forces the browser to flush any pending layout before it can
    // answer -- a real cost to pay on every single raw scroll event, which can fire at very high
    // frequency. track's own position relative to the page (not the viewport) doesn't change from
    // scrolling itself, only from an actual resize/reflow above it, so it's measured once here
    // (and re-measured only on resize) instead of on every scroll tick; the scroll handler itself
    // is now pure arithmetic against that cached value.
    var trackTop = 0;
    function measureTrackTop() {
      trackTop = track.getBoundingClientRect().top + window.scrollY;
    }
    // desktop only -- startScrollScrub() is never called at all on phone/tablet any more (see the
    // HERO_MOBILE_TIER branch above), so every line below runs exclusively on the fine-pointer
    // tier this always targeted.
    function updateTarget() {
      targetT = Math.min(Math.max((window.scrollY - trackTop) / SCROLL_RANGE, 0), 1);
    }
    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', function () { measureTrackTop(); updateTarget(); });
    measureTrackTop();
    updateTarget();

    function loop() {
      curT += (targetT - curT) * 0.09;

      var idx = Math.round(curT * (frameCount - 1));
      // walk back to the nearest already-loaded frame instead of leaving the canvas stale if
      // loading hasn't caught up yet (slow connection) -- never draws a missing frame
      while (idx > 0 && !frames[idx]) idx--;
      drawFrame(idx);

      // a subtle scale/lift/fade on the hero text as the sequence nears its end -- a separate
      // cosmetic effect from the frame sequence above, desktop only.
      if (content) {
        var scale = 1 - curT * CONTENT_MAX_SCALE;
        var ty = -curT * CONTENT_MAX_TRANSLATE;
        content.style.transform = 'scale(' + scale.toFixed(4) + ') translateY(' + ty.toFixed(2) + 'px)';
        content.style.opacity = (1 - curT * CONTENT_MAX_FADE).toFixed(3);
      }

      requestAnimationFrame(loop);
    }
    loop();
  }
})();

// ---- Identity scene: lazily imported, same code-split convention as the mounts below. See
// js/identity.js -- a small, deliberately self-contained module (not part of js/scenes.js's
// shared engine); that module itself no-ops under reducedMotion. Deferred via afterLoader() --
// far below the fold, nothing about it is needed until well after the loader/hero hand-off. ----
afterLoader(function () {
  var mount = document.getElementById('identity-new');
  if (!mount) return;
  import('./identity.js').then(function (mod) {
    mod.initIdentity();
  });
});

// ---- Post-blackout scenes (about me, software & skills, availability): lazily imported, same
// code-split convention as the Prism mount above. See js/scenes.js for the reveal engine; that
// module itself no-ops under reducedMotion. Deferred via afterLoader() -- these scenes are far
// below the fold, nothing about them is needed until well after the loader/hero hand-off. ----
afterLoader(function () {
  var mount = document.getElementById('about-me-content');
  if (!mount) return;
  import('./scenes.js').then(function (mod) {
    mod.initScenes();
  });
});

// ---- Contact scene (flowing-menu-style hover/tap reveal): lazily imported, same code-split
// convention as the mounts above. See js/flow-menu.js. Deferred via afterLoader(). ----
afterLoader(function () {
  var mount = document.querySelector('.flow-menu');
  if (!mount) return;
  import('./flow-menu.js').then(function (mod) {
    mod.initFlowMenu();
  });
});

// ---- Fast Travel (independent quick-nav radial wheel): lazily imported, same code-split
// convention as the mounts above. See js/fast-travel.js. Deferred via afterLoader() -- it's a
// navigation affordance, not needed until the site is actually interactive. ----
afterLoader(function () {
  var mount = document.getElementById('fast-travel');
  if (!mount) return;
  import('./fast-travel.js').then(function (mod) {
    mod.initFastTravel();
  });
});

// ---- Letterbox frame bars: retract once past hero ----
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        frameTop.classList.remove('away');
        frameBottom.classList.remove('away');
        header.classList.remove('frame-away');
      } else {
        frameTop.classList.add('away');
        frameBottom.classList.add('away');
        header.classList.add('frame-away');
      }
    });
  }, { threshold: 0.35 });

  obs.observe(hero);
})();

// ---- Scroll reveal for sections -- deferred via afterLoader(), nothing below the hero needs
// its reveal observer armed until after the loader hands off. Desktop/fine-pointer only: this is
// a "fade up into place" presentation effect, not load-bearing content, and the mobile page is
// meant to be a normal, natively-scrolling document -- every .reveal element (see css/style.css's
// own mobile media query, mirroring its existing reduced-motion override) already shows at its
// final opacity:1/transform:none state immediately there, so there is nothing for an observer to
// toggle; not creating one at all means zero IntersectionObserver callbacks fire for this on
// phone/tablet, not just a class that never visibly changes. Same coarse-pointer + smaller-of-
// width/height convention as this file's other mobile-tier checks. ----
afterLoader(function () {
  if (isCoarsePointer && Math.min(window.innerWidth, window.innerHeight) <= 1024) return;
  var items = document.querySelectorAll('.reveal');
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(function (el) { obs.observe(el); });
});

// ---- Project page: level 2 (ordered image gallery or video page) + level 3 (enlarge any
// image). Opened from the carousel via a cinematic "zoom into project" transition -- a
// genuinely separate view from the homepage ring below, not another rotating mode of it.
// Entirely driven by PROJECTS -- adding a project never touches this code. ----
var openProjectPage; // assigned below; called by the Work carousel when a card is activated
(function () {
  var page = document.getElementById('project-page');
  var inner = document.getElementById('project-page-inner');
  var closeBtn = document.getElementById('project-page-close');
  if (!page || !inner || !closeBtn) return;

  var activeCardEl = null;   // carousel card that opened this page, for focus return on close

  // desktop only -- on mobile/tablet, flyIntoProject() (see the Work carousel below) navigates to
  // this project's own standalone page (project/<id>/) instead of ever calling this. The actual
  // head/gallery/video building (and the PDF/video loads that go with it) live in
  // js/project-render.js, shared with that standalone page so this dialog and it never diverge.
  openProjectPage = function (project, index, cardEl) {
    activeCardEl = cardEl;
    ProjectRender.renderInto(page, inner, project, String(index + 1).padStart(2, '0'));
    document.body.style.overflow = 'hidden';
    page.classList.add('open');
    page.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
  };

  function closeProjectPage() {
    page.classList.remove('open');
    page.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (activeCardEl) activeCardEl.focus({ preventScroll: true });
    setTimeout(function () { inner.innerHTML = ''; }, reducedMotion ? 0 : 520);
  }

  closeBtn.addEventListener('click', closeProjectPage);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (ProjectRender.hasEnlarged()) { ProjectRender.collapseEnlarged(); return; }
      if (page.classList.contains('open')) closeProjectPage();
      return;
    }
    if (e.key !== 'Tab' || !page.classList.contains('open')) return;

    // trap Tab/Shift+Tab inside the open page so it never leaks focus to the carousel behind it
    var focusable = Array.prototype.slice.call(
      page.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.getClientRects().length > 0; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

// width, as a fraction of viewport width: 0.88 at phone widths, tapering smoothly down to the
// existing 0.72 desktop ratio across the 760-1024px tablet band, reaching exactly 0.72 at 1024
// and staying exactly 0.72 above it. Shared by the desktop ring and the mobile/tablet single-card
// view (buildMobileWork(), below) so a card is exactly the same size in both -- this governs only
// how big the card is, never how many exist at once, which is what actually differs between them.
function cardWidthRatio(vw) {
  if (vw <= 760) return 0.88;
  if (vw >= 1024) return 0.72;
  var t = (vw - 760) / (1024 - 760);
  return 0.88 - t * (0.88 - 0.72);
}
function cardSize() {
  var vw = window.innerWidth, vh = window.innerHeight;
  var width = Math.min(1200, Math.max(300, vw * cardWidthRatio(vw)));
  var height = Math.min(vh * 0.74, width * 0.6);
  return { width: Math.round(width), height: Math.round(height) };
}

// ---- Mobile/tablet Work carousel: a from-scratch, deliberately separate implementation from the
// desktop 3D ring below (see the WORK_MOBILE_TIER branch inside the afterLoader() call right after
// this function) -- not a variant of it, a different resource model entirely.
//
// The desktop ring keeps every one of PROJECTS.length cards (13 as of this writing) permanently in
// the DOM as 3D-transformed children of one preserve-3d container, each one carrying its own
// decoded cover bitmap once loaded, and rewrites every card's transform/opacity on every single
// animation frame of every rotation (its own updateDepth()) regardless of how many of those cards
// are actually near the front. That is real, unavoidable per-card cost that scales with how many
// projects exist, not with how many the visitor has looked at -- fundamentally the wrong shape for
// a memory/GPU-constrained phone no matter how tightly any one image's own loading is bounded (a
// previous pass here tried exactly that -- an eviction window over the ring's own cards -- and
// repeated rapid left/right navigation could still crash). This function instead renders exactly
// ONE project card in the DOM at a time -- the active one -- with at most one additional, plain
// (never attached to the DOM) Image() object speculatively preloading a single neighbor in the
// direction the visitor just moved. Never more than 2 cover images resident at once, regardless of
// how many projects exist or how fast the visitor navigates; the previous/next project the visitor
// isn't currently looking at has no DOM node and no decoded bitmap at all.
//
// Cancellation: mobileGen is a monotonically increasing counter, bumped on every navigation
// (arrow tap or swipe alike). Every async image load captures the generation it started under and
// checks it again before touching the DOM once it resolves -- a load belonging to a project the
// visitor has since navigated away from is silently discarded, never rendered, no matter how many
// more taps happened in between or what order things finish in. There is no queue: navigating
// A -> B -> C -> D -> E in rapid succession converges directly on E's own state; B/C/D never each
// get their own transition, image load, or visible flash. No requestAnimationFrame loop of any
// kind is used for the transition itself -- swaps are driven by the Web Animations API
// (info.animate()-style, the same technique updateInfo() below already uses), which is cancelled
// by simply calling .cancel()/starting a new one, never by hand-rolled per-frame bookkeeping.
//
// Desktop is completely unaffected: it never calls this function, and the desktop closure below
// never reads any state this function owns. Everything here reads only tier-agnostic shared
// data/helpers (PROJECTS, applyTone, getProjectPalette, WASH_PALETTE, cardSize() above).
function buildMobileWork(root) {
  var count = PROJECTS.length;
  if (!count) return;

  // ---- background wash: identical mechanism/CSS to the desktop ring's own (see updateWash()
  // below) -- a fixed full-viewport color wash behind the stage, crossfading to the active
  // project's own extracted palette. No particle layer here: those were always a decorative
  // accent riding on the same background, already fully static (no animation loop) on this tier
  // from a previous pass -- skipping their creation entirely removes 26 more idle DOM nodes for a
  // phone screen that could rarely see more than a couple of them clearly to begin with. ----
  var workBg = document.createElement('div');
  workBg.className = 'work-bg';
  var wash = document.createElement('div');
  wash.className = 'work-bg__wash';
  workBg.appendChild(wash);
  root.appendChild(workBg);

  // .work-bg starts at opacity:0 (see css/style.css) and only fades in via its own .in-view
  // class -- a plain visibility toggle, not a per-frame loop, so the wash fades in/out as the
  // Work section scrolls on/off screen rather than staying lit over the rest of the page.
  //
  // rootMargin extends the intersection root itself rather than waiting for Work's own edge to
  // reach the real viewport boundary -- a generous 35% of viewport height below (Work approaches
  // from below as the visitor scrolls down, so this side needs the head start) and a smaller 15%
  // above (a gentler, symmetric early-exit on the way back up to Hero). This is what actually
  // makes the wash's own color (see mobileUpdateWash() below, now always set synchronously the
  // instant this runs, never left at its near-black CSS initial-value) begin asserting itself
  // while Hero is still substantially on screen, mid-scroll, instead of only after Work's own
  // boundary has already fully crossed into view -- a continuous handoff rather than a section
  // that "arrives" and only then receives its color. Mobile-only: desktop's own equivalent
  // (bgVisibilityObserver, further below in this file) is untouched.
  var workSectionEl = document.getElementById('work');
  if (workSectionEl) {
    var mobileBgObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        workBg.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: '15% 0px 35% 0px' });
    mobileBgObserver.observe(workSectionEl);
  }

  var viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  // .carousel-ring reused purely as a plain positioning frame (position:absolute; inset:0) --
  // its own preserve-3d is inert with a single, never-rotated child, which is all this tier ever
  // puts inside it.
  var stage = document.createElement('div');
  stage.className = 'carousel-ring';
  stage.tabIndex = 0;
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-label', 'Project carousel — swipe or use the arrows to browse');
  viewport.appendChild(stage);

  var info = document.createElement('div');
  info.className = 'carousel-info';
  var infoNum = document.createElement('span'); infoNum.className = 'carousel-info__num';
  var infoTitle = document.createElement('h3'); infoTitle.className = 'carousel-info__title';
  var infoMeta = document.createElement('div'); infoMeta.className = 'carousel-info__meta';
  var infoCategory = document.createElement('span');
  var infoYear = document.createElement('span');
  infoMeta.appendChild(infoCategory);
  infoMeta.appendChild(infoYear);
  info.appendChild(infoNum);
  info.appendChild(infoTitle);
  info.appendChild(infoMeta);
  viewport.appendChild(info);

  var prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'carousel-nav carousel-nav--prev';
  prevBtn.setAttribute('aria-label', 'Previous project');
  prevBtn.textContent = '‹';
  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'carousel-nav carousel-nav--next';
  nextBtn.setAttribute('aria-label', 'Next project');
  nextBtn.textContent = '›';
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  viewport.appendChild(prevBtn);
  viewport.appendChild(nextBtn);

  root.appendChild(viewport);

  // ---- background wash + info panel updates -- same mechanism/CSS as the desktop ring's own
  // updateWash()/updateInfo() (a live palette crossfade, a quick fade-out/fade-in text swap via
  // the Web Animations API), reimplemented locally against this function's own wash/info elements
  // rather than calling the desktop closure's versions, which close over a completely different
  // set of DOM nodes. mobileGen (read at call time, checked again once the async palette extract
  // resolves) is this function's own "supersede a stale async result" guard, the same role
  // displayedIndex plays for the desktop ring's own updateWash(). ----
  function mobileUpdateWash(idx) {
    var project = PROJECTS[idx];
    var gen = mobileGen;
    var fallback = WASH_PALETTE[((idx % WASH_PALETTE.length) + WASH_PALETTE.length) % WASH_PALETTE.length];
    // set synchronously, immediately -- this wash must never sit at its near-black CSS
    // initial-value (see @property --wash-a/--wash-b, css/style.css) while it fades into view
    // from the Hero->Work scroll (see mobileBgObserver's own rootMargin above): that's what read
    // as a "sudden color pop" once the real extracted palette (an async image decode, see
    // js/project-data.js) finally landed a beat after the section was already on screen. The real
    // color, once/if it resolves to something different, then crossfades in on top of this via
    // the same --wash-a/--wash-b transition already used for switching between projects -- in the
    // common case it has already been prefetched (see the top of this file) and resolves well
    // before this ever runs, so this fallback is never even visibly painted.
    wash.style.setProperty('--wash-a', fallback[0]);
    wash.style.setProperty('--wash-b', fallback[1]);
    getProjectPalette(project).then(function (extracted) {
      if (gen !== mobileGen || !extracted) return;
      wash.style.setProperty('--wash-a', extracted[0]);
      wash.style.setProperty('--wash-b', extracted[1]);
    });
  }
  function mobileUpdateInfo(idx) {
    var p = PROJECTS[idx];
    function apply() {
      infoNum.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(count).padStart(2, '0');
      infoTitle.textContent = p.title;
      infoCategory.textContent = p.category;
      infoYear.textContent = p.year;
    }
    if (reducedMotion) { apply(); return; }
    info.getAnimations().forEach(function (a) { a.cancel(); }); // supersede any in-flight swap
    info.animate(
      [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(10px)' }],
      { duration: 200, easing: 'cubic-bezier(.6,0,1,1)', fill: 'forwards' }
    ).onfinish = function () {
      apply();
      info.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
      );
    };
  }

  // ---- the one card in the DOM -- built once, its contents (cover image, tone gradient, play
  // icon) are swapped in place on navigation rather than the card element itself being replaced,
  // so there is exactly one .carousel-card for this tier's entire lifetime, never more. ----
  var size = cardSize();
  var card = document.createElement('div');
  card.className = 'carousel-card is-active';
  card.style.width = size.width + 'px';
  card.style.height = size.height + 'px';
  card.style.transform = 'translate(-50%,-50%)';
  card.setAttribute('role', 'button');
  var inner = document.createElement('div');
  inner.className = 'carousel-card__inner';
  // ---- backdrop fill: the card is a fixed landscape frame (see cardSize() above), but a
  // project's own designated main photo is very often a portrait poster/book-cover (roughly
  // 0.7:1) -- object-fit:contain on coverImg below never crops or substitutes that photo (the
  // whole point: show the exact designated main photo, untouched), but on its own that left big
  // bare tone-gradient bars down both sides of every portrait photo, which read as "broken/not
  // really showing" rather than as a deliberately letterboxed frame. This element sits behind
  // coverImg, shows the *same* src the sharp image does, scaled up and blurred to fill the whole
  // frame edge-to-edge (the same "blurred backdrop" treatment Apple Music/Spotify use for
  // non-matching album art) -- so the frame always looks fully filled and intentional, while the
  // real photo on top stays complete and uncropped. Mobile/tablet only: its own class, its own
  // CSS (see css/style.css), never touched by the desktop ring's buildProjectCard(), which has no
  // equivalent element.
  var coverBg = document.createElement('div');
  coverBg.className = 'carousel-card__cover-bg';
  var coverImg = document.createElement('img');
  coverImg.className = 'carousel-card__cover';
  coverImg.draggable = false;
  coverImg.decoding = 'async';
  coverImg.style.opacity = '0'; // starts hidden -- see commit(), only ever made visible once loaded
  coverImg.style.transition = 'opacity .25s ease';
  var playIcon = document.createElement('div');
  playIcon.className = 'carousel-card__play';
  playIcon.innerHTML = '<span>▶</span>';
  // NOT the `hidden` attribute: .carousel-card__play's own CSS sets `display:flex`
  // unconditionally (see css/style.css), an author-stylesheet rule -- and author rules always
  // beat the browser's built-in `[hidden]{display:none}` user-agent rule regardless of selector
  // specificity, so `playIcon.hidden = true` silently does nothing and the icon stayed visible on
  // every card, video or not. An inline `display` style outranks any class-level rule from any
  // stylesheet, so it's what actually hides/shows this element; render() below is the only place
  // that ever flips it, strictly from project.type, never merely because a card exists.
  playIcon.style.display = 'none';
  inner.appendChild(coverBg);
  inner.appendChild(coverImg);
  inner.appendChild(playIcon);
  card.appendChild(inner);
  stage.appendChild(card);

  window.addEventListener('resize', function () {
    var s = cardSize();
    card.style.width = s.width + 'px';
    card.style.height = s.height + 'px';
  });

  // ---- state ----
  var activeIndex = 0;
  var mobileGen = 0;               // bumped on every navigation -- see this function's own header
  var preload = null;              // { index, img } -- at most ONE speculative off-DOM preload

  function coverSrcFor(project) {
    return project.coverMobile || project.cover || project.coverFallback || null;
  }

  // speculative, bounded (exactly one slot) preload of a single neighbor -- never attached to the
  // DOM, so it costs a decode but no additional compositing layer; replacing `preload` with a new
  // object (or null) drops the only reference to whatever was there before, making its Image (and
  // decoded bitmap) eligible for garbage collection immediately, not just eventually.
  function preloadNeighbor(index) {
    if (preload && preload.index === index) return;
    var src = coverSrcFor(PROJECTS[index]);
    if (!src) { preload = null; return; }
    var img = new Image();
    img.decoding = 'async';
    img.src = src;
    preload = { index: index, img: img };
  }

  // ---- render the active project: info panel updates immediately (cheap, no loading dependency,
  // same instant-update-then-settle feel updateInfo()/updateWash() already give the desktop ring);
  // the cover image only ever becomes visible once it has actually finished loading -- never a
  // bare colored square presented as if it were the real photo. gen is captured at call time and
  // re-checked before every DOM write below, so a load that resolves after the visitor has already
  // navigated further (of which there can be any number, arbitrarily fast) is silently dropped. ----
  function render(index, dir) {
    mobileGen++;
    var gen = mobileGen;
    activeIndex = index;
    var project = PROJECTS[index];

    mobileUpdateWash(index);
    mobileUpdateInfo(index);
    applyTone(inner, index);
    card.setAttribute('aria-label', (project.type === 'video' ? 'Watch ' : 'Enter ') + project.title);
    // hide the previous project's photo the instant navigation starts -- the tone gradient
    // (just applied above) is this tier's own established "no photo yet" treatment (see
    // buildProjectCard()'s own comment on the desktop ring for the same convention), not a blank
    // or broken-looking state; avoids a stale photo remaining under a new title.
    coverImg.style.opacity = '0';
    coverImg.removeAttribute('src');
    coverBg.style.opacity = '0';
    coverBg.style.backgroundImage = '';
    playIcon.style.display = 'none';

    var src = coverSrcFor(project);
    if (!src) {
      // every project currently has a coverMobile/cover/coverFallback (see js/project-data.js),
      // so this branch is only ever reached by a future project added without one -- the tone
      // gradient above is the entire card then, exactly like the desktop ring's own equivalent
      // branch.
    } else {
      function commit(loadedSrc) {
        if (gen !== mobileGen) return; // stale -- a newer navigation has already superseded this
        coverImg.src = loadedSrc;
        coverImg.style.opacity = '1';
        // same src, as a blurred cover-fit backdrop -- see coverBg's own creation comment above
        coverBg.style.backgroundImage = 'url("' + loadedSrc.replace(/"/g, '\\"') + '")';
        coverBg.style.opacity = '1';
        // strictly from the project's own data (type === 'video'), never from the mere existence
        // of this card -- see playIcon's own creation comment for why `.hidden` can't be used here.
        if (project.type === 'video') playIcon.style.display = 'flex';
      }
      var cached = preload && preload.index === index ? preload.img : null;
      if (cached && cached.complete && cached.naturalWidth) {
        commit(cached.src);
      } else {
        // onload is the one native event guaranteed to fire once the browser actually finishes
        // fetching+decoding the image, independent of img.decode()'s own outcome -- attached
        // unconditionally, first, as the real safety net. img.decode() (where supported) is only
        // ever an *optimization* layered on top: it resolves once the image is fully decoded and
        // safe to paint without a decode-triggered stall on first draw, so commit() is called
        // slightly earlier/smoother when it succeeds. commit() itself is idempotent (just
        // re-applies the same src/opacity), so onload firing after decode() already committed is
        // harmless. Never called on more than one image at a time here: this is the one and only
        // decode this function ever starts outside of preloadNeighbor()'s own single speculative
        // slot.
        //
        // Previously decode() was the ONLY trigger, with just a synchronous fallback check
        // (img.complete/naturalWidth) in its .catch() -- but some mobile browsers reject decode()
        // for reasons unrelated to whether the image actually finished loading (a real, confirmed
        // cause of a project's main photo appearing to silently vanish: the asset loaded
        // correctly, decode() rejected anyway, and nothing else was ever listening). A larger
        // image (more pixels to decode, independent of file size) can also still be genuinely
        // mid-fetch at the exact instant decode() rejects, so that synchronous check alone could
        // miss a load that completes moments later -- with no listener left to catch it, the card
        // was stuck on the tone gradient forever. onload here fixes both cases at once.
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () { commit(img.src); };
        img.onerror = function () {}; // genuine load failure -- stays on the tone-gradient placeholder
        img.src = src;
        if (img.decode) {
          img.decode().then(function () { commit(img.src); }).catch(function () {});
        }
      }
    }

    // opportunistically ready the single next card in whichever direction the visitor is actually
    // moving -- bounded to exactly one slot (preloadNeighbor() replaces, never adds to, `preload`)
    if (dir) preloadNeighbor(((index + dir) % count + count) % count);
  }

  function step(dir) {
    render(((activeIndex + dir) % count + count) % count, dir);
  }

  // ---- tap the card to enter the project; a lighter version of the desktop ring's own
  // flyIntoProject() -- this tier already navigates to a real standalone page (see below), so
  // there is no in-page dialog/clone-and-grow transition to reproduce here. ----
  card.addEventListener('click', function () {
    if (dragMoved) return;
    window.location.href = 'project/' + PROJECTS[activeIndex].id + '/';
  });
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = 'project/' + PROJECTS[activeIndex].id + '/';
    } else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  card.tabIndex = 0;

  // ---- swipe: a single step per gesture (never a continuous drag-follows-finger angle -- there
  // is no ring here to rotate), same threshold-then-commit shape as the desktop ring's own wheel
  // gesture. Pure pointer tracking, no rAF loop. ----
  var dragging = false, dragMoved = false, dragStartX = 0;
  var SWIPE_THRESHOLD = 40;
  viewport.addEventListener('pointerdown', function (e) {
    dragging = true; dragMoved = false; dragStartX = e.clientX;
  });
  viewport.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    if (Math.abs(e.clientX - dragStartX) > 10) dragMoved = true;
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (!dragMoved) return;
    var dx = e.clientX - dragStartX;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) step(dx < 0 ? 1 : -1);
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', function () { dragging = false; });

  // mobile/tablet's own initial project -- LINKA, not index 0 (who-i-am, a video project): a
  // first-load autoplaying/loading video is exactly what this tier's whole static-cover
  // architecture (see PROJECT_MEDIA_MOBILE_TIER above) exists to avoid. Looked up by id rather
  // than a hardcoded index so it keeps pointing at LINKA even if PROJECTS is reordered; falls
  // back to 0 only if 'linka' is ever removed from PROJECTS entirely. Desktop's own ring (below)
  // is untouched and still starts at index 0.
  var initialIndex = PROJECTS.findIndex(function (p) { return p.id === 'linka'; });
  render(initialIndex >= 0 ? initialIndex : 0, 0);
}

// ---- Work: 3D interactive carousel (drag/wheel/keys to rotate; click flies into the project
// page above). Entirely driven by PROJECTS -- adding a project never touches this code. This
// ring only ever shows the 8 project covers -- it is the homepage level, not a container for
// case-study content. Motion signature (easeInOutCubic tween, damped/capped inertia, a small
// scale "grab tension" while dragging, idle auto-drift, no bounce/elastic anywhere) is adapted
// from studying apechain.com's actual drag/carousel code -- see chat for the writeup. Deferred
// via afterLoader() -- building the ring, including every video-preview <video> element the
// projects with `videoPreview` set create, is real DOM/decode work that shouldn't compete with
// the loader for frames, and #work is well below the fold on first paint anyway. Desktop only --
// see buildMobileWork() and the WORK_MOBILE_TIER branch just below for the entirely separate
// mobile/tablet implementation. ----
afterLoader(function () {
  var root = document.getElementById('work-carousel');
  if (!root) return;

  // reads js/project-data.js's own tier flag (see that file's own comment on
  // PROJECT_MEDIA_MOBILE_TIER).
  var WORK_MOBILE_TIER = PROJECT_MEDIA_MOBILE_TIER;

  if (WORK_MOBILE_TIER) {
    // entirely separate implementation -- see buildMobileWork()'s own header comment for why.
    // Nothing below this point (the full 3D ring, its drag/wheel/keyboard handling, autoplay, and
    // backfill machinery) is reachable on this tier, or safe for the single-card DOM
    // buildMobileWork() builds instead.
    buildMobileWork(root);
    return;
  }

  // ---- work background: fixed full-viewport wash + drifting particles, visible only while
  // the Work section is on screen. Scoped separately from the site-wide #ambient-bg. ----
  var workBg = document.createElement('div');
  workBg.className = 'work-bg';
  var wash = document.createElement('div');
  wash.className = 'work-bg__wash';
  var particleLayer = document.createElement('div');
  particleLayer.className = 'work-bg__particles';
  workBg.appendChild(wash);
  workBg.appendChild(particleLayer);
  root.appendChild(workBg);

  var viewport = document.createElement('div');
  viewport.className = 'carousel-viewport';
  var ring = document.createElement('div');
  ring.className = 'carousel-ring';
  ring.tabIndex = 0;
  ring.setAttribute('role', 'region');
  ring.setAttribute('aria-label', 'Project carousel — drag, scroll or use arrow keys to rotate');
  viewport.appendChild(ring);

  // ---- project number/title/category/year, bottom-left of the stage ----
  var info = document.createElement('div');
  info.className = 'carousel-info';
  var infoNum = document.createElement('span'); infoNum.className = 'carousel-info__num';
  var infoTitle = document.createElement('h3'); infoTitle.className = 'carousel-info__title';
  var infoMeta = document.createElement('div'); infoMeta.className = 'carousel-info__meta';
  var infoCategory = document.createElement('span');
  var infoYear = document.createElement('span');
  infoMeta.appendChild(infoCategory);
  infoMeta.appendChild(infoYear);
  info.appendChild(infoNum);
  info.appendChild(infoTitle);
  info.appendChild(infoMeta);
  viewport.appendChild(info);

  var hint = document.createElement('div');
  hint.className = 'carousel-hint';
  hint.textContent = 'Drag to rotate ↔';

  root.appendChild(viewport);
  root.appendChild(hint);

  // ---- state ----
  // perf: a project's cover media (PDF page-1 render via pdf.js, or the videoPreview buffering
  // start) is real network+CPU work -- some of this site's project PDFs run into the tens of MB,
  // and a couple of the preview clips are comparably large. buildProjectCard() below no longer
  // starts any of that work itself -- it only builds the DOM and hands back a `startCover()`
  // closure; WHEN that closure actually runs is decided entirely here, by two cooperating pieces:
  //
  //   1) ensureNeighborhoodLoaded(idx) -- called once for index 0 right after the ring is built,
  //      and again every time syncActiveIndex() (further down) detects the active card has
  //      changed, whether that's from a drag, wheel, or the arrow keys. It starts
  //      exactly the active card plus its two immediate ring neighbors -- the only cards that can
  //      plausibly be on screen or about to be -- and is a no-op for anything already started.
  //      A first pass here only ever primed index 0 once, at build time; that missed the case
  //      where a drag/wheel/arrow step has already moved the front card on by the time a visitor
  //      actually scrolls down to Work, which a ~1700px hero scroll track alone is often enough
  //      time for -- leaving whatever card ended up centered still unprimed. (There is no idle
  //      autoplay any more -- the ring only ever moves on a direct user action -- but the same
  //      race exists for any of those, so the fix still applies.)
  //   2) queueBackfillCover(record) -- everything NOT in that immediate neighborhood. A first pass
  //      here queued every other card's cover strictly in PROJECTS array order, one at a time --
  //      but that meant a visitor who rotated two or three cards in either direction could land on
  //      one still stuck behind whichever huge PDF/video happened to sit earlier in that fixed
  //      order (this site's largest project PDF alone is 25MB). The backfill queue below still
  //      runs one cover at a time (never competing bandwidth with itself, let alone the active
  //      card), but each step now waits for its own idle slice via scheduleIdle() -- both to leave
  //      the active/neighborhood loads above uncontested, and because ensureNeighborhoodLoaded()
  //      can (and regularly does) reach a card first as the visitor rotates past it, at which point
  //      the backfill's own turn for that same card is just a no-op skip.
  //
  // Together: the visible card is always the very first thing requested, its neighbors follow
  // immediately behind it, rotating anywhere in the ring keeps whatever's newly visible primed
  // the same way, and every remaining card still eventually loads in the background without ever
  // competing with what the visitor is actually looking at.
  function queueBackfillCover(record) {
    backfillChain = backfillChain.then(function () {
      return new Promise(function (resolve) {
        scheduleIdle(function () { ensureCoverStarted(record).then(resolve, resolve); });
      });
    });
  }
  var backfillChain = Promise.resolve();

  function ensureCoverStarted(record) {
    if (record.coverStarted) return Promise.resolve();
    record.coverStarted = true;
    return (record.startCover ? record.startCover() : Promise.resolve()) || Promise.resolve();
  }
  function ensureNeighborhoodLoaded(centerIdx) {
    var n = cards.length;
    if (!n) return;
    ensureCoverStarted(cards[centerIdx]);
    if (n > 1) {
      ensureCoverStarted(cards[((centerIdx - 1) % n + n) % n]);
      ensureCoverStarted(cards[(centerIdx + 1) % n]);
    }
  }

  var cards = [];                 // [{ el, inner, angle, index, item, startCover, coverStarted }]
  var angleStep = 0;
  var radius = 0;
  var currentAngle = 0;           // degrees, unbounded
  var velocity = 0;                // deg/frame, drag/wheel momentum
  var animHandle = null;           // rAF handle for an in-flight tween/inertia loop
  var dragging = false, dragMoved = false, dragStartX = 0, dragStartAngle = 0, lastX = 0, lastT = 0;
  var lastInteraction = Date.now();
  var hoveringViewport = false;
  var resizeTimer = null;
  var WHEEL_STEP_THRESHOLD = 42;   // accumulated |deltaY| that registers as "one step"
  var WHEEL_GESTURE_GAP = 320;      // ms of silence after which a wheel gesture is considered over
  var wheelAccum = 0, wheelGestureTriggered = false, wheelGestureTimer = null;

  // easeInOutCubic -- the same curve family observed driving apechain.com's own snap tween
  // (their "power2.inOut") and its hand-rolled drag-tension formula; used for every eased
  // rotation here so the motion signature matches: confident, no bounce/elastic/overshoot.
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // gentler curve used only for the idle museum-style autoplay -- gradual acceleration and
  // deceleration read as slower/more deliberate than the cubic used for user-driven snaps
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  function shortestDiff(a, b) {
    var d = (a - b) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  function stopAnim() {
    if (animHandle) { cancelAnimationFrame(animHandle); animHandle = null; }
  }

  function markInteraction() {
    lastInteraction = Date.now();
    scheduleAutoplay(IDLE_DELAY); // any real interaction restarts the idle countdown immediately
  }

  // width, as a fraction of viewport width: 0.88 at phone widths, tapering smoothly down to the
  // existing 0.72 desktop ratio across the 760-1024px tablet band, reaching exactly 0.72 at 1024
  // and staying exactly 0.72 above it -- so 1024px+ (this site's own desktop floor) is byte-for-
  // byte the same multiplier as before this change, and only the tablet band in between (where an
  // iPad portrait/landscape used to jump straight to the desktop ratio, several hundred px earlier
  // than any other component's own responsive tuning) now eases into it instead of cutting to it.
  function cardWidthRatio(vw) {
    if (vw <= 760) return 0.88;
    if (vw >= 1024) return 0.72;
    var t = (vw - 760) / (1024 - 760);
    return 0.88 - t * (0.88 - 0.72);
  }
  function cardSize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    // large, immersive panels occupying most of the viewport (sized for their true rendered,
    // post-recentering scale -- see render()'s note on the perspective-magnification fix)
    var width = Math.min(1200, Math.max(300, vw * cardWidthRatio(vw)));
    var height = Math.min(vh * 0.74, width * 0.6);
    return { width: Math.round(width), height: Math.round(height) };
  }

  function ringRadius(width, count) {
    if (count < 2) return 0;
    var r = (width / 2) / Math.tan(Math.PI / count);
    return Math.round(Math.max(r * 1.18, width * 0.85));
  }

  function buildProjectCard(project, i) {
    var card = document.createElement('div');
    card.className = 'carousel-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', (project.type === 'video' ? 'Watch ' : 'Enter ') + project.title);

    var inner = document.createElement('div');
    inner.className = 'carousel-card__inner';
    applyTone(inner, i);

    // builds the DOM only -- does NOT start any network/decode work itself. `startCover`, handed
    // back to the caller, is what actually kicks off the fetch/render/buffer; buildRing() decides
    // if/when to call it (see ensureNeighborhoodLoaded()/queueBackfillCover() above), so this
    // function stays agnostic to whether it's building the visible card or a distant one. Desktop
    // only -- see buildMobileWork() for the entirely separate mobile/tablet implementation, which
    // never calls this function at all.
    var startCover = null;
    var staticCoverSrc = project.cover;

    if (staticCoverSrc) {
      var img = document.createElement('img');
      img.className = 'carousel-card__cover';
      img.alt = project.title + ' — cover';
      img.draggable = false;
      img.decoding = 'async'; // never a reason to block the main thread on a raster decode
      if (i === 0) img.fetchPriority = 'high'; // the one card guaranteed visible with zero interaction
      inner.appendChild(img);
      startCover = function () {
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          img.src = staticCoverSrc;
        });
      };
    } else if (project.pdf) {
      // page 1 of the PDF, rendered live -- the tone gradient already applied above shows
      // through as a letterbox exactly like a real `cover` image (object-fit:contain) until
      // (and if) the render resolves, and stays as the letterbox regardless once it does.
      var pdfCoverImg = document.createElement('img');
      pdfCoverImg.className = 'carousel-card__cover';
      pdfCoverImg.alt = project.title + ' — cover';
      pdfCoverImg.draggable = false;
      pdfCoverImg.decoding = 'async';
      inner.appendChild(pdfCoverImg);
      startCover = function () {
        return getPdfPageOneUrl(project).then(function (url) { pdfCoverImg.src = url; });
      };
    } else if (project.videoPreview) {
      // paused on its first frame by default -- no `autoplay`/`loop`-while-idle here, playback
      // is only ever started from the card's mouseenter handler below, while this card is the
      // active/centered one; loop only takes effect once .play() actually runs on hover.
      var previewVid = document.createElement('video');
      previewVid.className = 'carousel-card__preview';
      previewVid.muted = true;
      previewVid.loop = true;
      previewVid.playsInline = true;
      previewVid.preload = 'auto';
      inner.appendChild(previewVid);
      // `src` is what actually starts the fetch/buffer for a preload:'auto' video -- left unset
      // until startCover() runs, so an off-screen video project's multi-megabyte clip never begins
      // downloading in the background on its own.
      startCover = function () {
        return new Promise(function (resolve) {
          previewVid.addEventListener('loadeddata', resolve, { once: true });
          previewVid.addEventListener('error', resolve, { once: true });
          previewVid.src = project.videoPreview;
        });
      };
    }

    // `videoPreview` projects communicate "this is a video" through the hover-playing preview
    // itself, so they deliberately skip the static play-icon overlay other video projects show.
    if (project.type === 'video' && !project.videoPreview) {
      var play = document.createElement('div');
      play.className = 'carousel-card__play';
      play.innerHTML = '<span>▶</span>';
      inner.appendChild(play);
    }

    card.appendChild(inner);
    return { card: card, startCover: startCover };
  }

  // hover preview for a video project that also has a static `cover` (see ev-tanitim-videosu in
  // js/project-data.js): nothing video-shaped exists in its card until the visitor actually hovers
  // it while active -- no element, no src, no buffering from the backfill queue. Created once, then
  // reused by the same mouseenter/mouseleave handlers as every other videoPreview card. It sits
  // over the cover at opacity 0 and only fades in once real frames are playing, so the cover never
  // flashes to black/blank while the clip is still fetching.
  function createDeferredPreview(inner, project) {
    var vid = document.createElement('video');
    vid.className = 'carousel-card__preview carousel-card__preview--deferred';
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.addEventListener('playing', function () { vid.classList.add('is-playing'); });
    vid.src = project.videoPreview;
    inner.appendChild(vid);
    return vid;
  }


  // ---- depth: every card's scale/opacity/box-shadow is a pure function of its angular
  // distance from the front (0deg); recomputed each time the ring's rotation changes ----
  function updateDepth() {
    cards.forEach(function (c) {
      var d = shortestDiff(c.angle + currentAngle, 0);
      var absD = Math.abs(d);
      var t = Math.min(absD / 100, 1);
      var scale = 1 - t * 0.32;
      var opacity = 1 - t * 0.85;
      c.inner.style.transform = 'scale(' + scale.toFixed(3) + ')';
      c.inner.style.opacity = opacity.toFixed(3);
      c.el.classList.toggle('is-active', absD < angleStep / 2 + 0.01);
      // Chromium's hit-testing for preserve-3d content doesn't reliably z-sort by actual depth
      // the way painting does -- a card diametrically opposite the front one (e.g. two cards
      // 180deg apart in an 8-card ring) can visually sit *behind* it yet still steal its clicks
      // via elementFromPoint. Cards this far from the front are already almost fully faded out,
      // so disabling their pointer-events is invisible in practice and removes the possibility
      // of a hidden card intercepting a click meant for the one actually facing the camera.
      c.el.style.pointerEvents = absD > 100 ? 'none' : '';
    });
  }

  function render() {
    // recenter the whole ring back by its own radius so the front-facing card sits at its
    // true, un-magnified depth (translateZ(radius) on that card cancels this out exactly) --
    // without this, perspective magnifies the front card ~1.5-1.7x beyond its declared CSS
    // size, which is what was causing the soft/blurry cover images and captions: the browser
    // rasterizes content near its declared size and the GPU scales that bitmap up to fill the
    // magnified area, exactly like upscaling a low-res image.
    ring.style.transform = 'translateZ(-' + radius + 'px) rotateY(' + currentAngle + 'deg)';
    updateDepth();
    syncActiveIndex();
  }

  function nearestIndex() {
    var best = 0, bestD = Infinity;
    cards.forEach(function (c, i) {
      var d = Math.abs(shortestDiff(c.angle + currentAngle, 0));
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function tweenAngle(target, duration, onDone, easingFn) {
    stopAnim();
    var ease = easingFn || easeInOutCubic;
    if (reducedMotion || duration === 0) {
      currentAngle = target;
      render();
      if (onDone) onDone();
      return;
    }
    var start = currentAngle;
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      currentAngle = start + (target - start) * ease(p);
      render();
      if (p < 1) {
        animHandle = requestAnimationFrame(step);
      } else {
        animHandle = null;
        if (onDone) onDone();
      }
    }
    animHandle = requestAnimationFrame(step);
  }

  function rotateToIndex(idx, onDone) {
    var target = currentAngle + shortestDiff(-cards[idx].angle, currentAngle);
    tweenAngle(target, 650, onDone);
  }

  function snapToNearest() {
    rotateToIndex(nearestIndex());
  }

  // ---- one manual step left/right -- the single mechanism behind the wheel gesture and the
  // arrow keys, so both feel identical and never drift out of sync with each other. `count` cards
  // means there's no real "first"/"last" card to special-case -- index arithmetic simply wraps
  // modulo count in both directions, i.e. the ring's own existing looping behavior. Purely a
  // rotation: it calls rotateToIndex(), the exact same tween ensureNeighborhoodLoaded() already
  // listens to via syncActiveIndex() (see render() below) to prime whatever card just became
  // active. ----
  function stepCarousel(dir) {
    var count = cards.length;
    if (!count) return;
    hint.classList.add('hide');
    rotateToIndex(((nearestIndex() + dir) % count + count) % count);
  }

  function startInertia() {
    stopAnim();
    function step() {
      currentAngle += velocity;
      velocity *= 0.93;
      render();
      if (Math.abs(velocity) > 0.03) {
        animHandle = requestAnimationFrame(step);
      } else {
        animHandle = null;
        snapToNearest();
      }
    }
    animHandle = requestAnimationFrame(step);
  }

  // ---- background wash: crossfades to the active project's own live-extracted palette via the
  // --wash-a/--wash-b @property transition declared in CSS -- the browser interpolates the
  // color itself over time, so the previous project's hue is still genuinely visible partway
  // through, never a hard cut. Work-section-only; the hero's own background no longer shares in
  // this palette. ----
  function applyPalette(t) {
    wash.style.setProperty('--wash-a', t[0]);
    wash.style.setProperty('--wash-b', t[1]);
  }
  function updateWash(idx) {
    var project = PROJECTS[idx];
    var fallback = WASH_PALETTE[((idx % WASH_PALETTE.length) + WASH_PALETTE.length) % WASH_PALETTE.length];
    getProjectPalette(project).then(function (extracted) {
      // the user may have already rotated on to a different project by the time extraction
      // resolves (PDF render / video seek can take a beat) -- a superseded result is dropped
      // rather than yanking the wash backward to a project that's no longer active
      if (PROJECTS[displayedIndex] !== project) return;
      applyPalette(extracted || fallback);
    });
  }

  // ---- lower-left info (number/title/category/year) -- updates the instant the active card
  // changes, tracking rotation live rather than waiting for it to settle ----
  function updateInfo(idx) {
    var p = PROJECTS[idx];
    function apply() {
      infoNum.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(PROJECTS.length).padStart(2, '0');
      infoTitle.textContent = p.title;
      infoCategory.textContent = p.category;
      infoYear.textContent = p.year;
    }
    if (reducedMotion) { apply(); return; }
    info.animate(
      [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(10px)' }],
      { duration: 200, easing: 'cubic-bezier(.6,0,1,1)', fill: 'forwards' }
    ).onfinish = function () {
      apply();
      info.animate(
        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 340, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }
      );
    };
  }

  // ---- single source of truth for "which project is active": checked every render() call, so
  // it tracks whichever card is nearest the front in real time no matter how it got there --
  // drag, wheel, or keyboard -- exactly like the wash/info updating live in the reference instead
  // of waiting for a click or a settle. ----
  var displayedIndex = -1;
  function syncActiveIndex() {
    var idx = nearestIndex();
    if (idx === displayedIndex) return;
    displayedIndex = idx;
    updateWash(idx);
    updateInfo(idx);
    ensureNeighborhoodLoaded(idx); // keep whatever just became visible (and its neighbors) primed
  }

  // ---- build the ring's cards -- called once; this ring only ever shows PROJECTS ----
  function buildRing() {
    ring.innerHTML = '';
    cards = [];

    var count = PROJECTS.length;
    angleStep = count ? 360 / count : 0;
    var size = cardSize();
    radius = ringRadius(size.width, count);

    PROJECTS.forEach(function (project, i) {
      var built = buildProjectCard(project, i);
      var el = built.card;
      el.style.width = size.width + 'px';
      el.style.height = size.height + 'px';
      var angle = i * angleStep;
      el.style.transform = 'translate(-50%,-50%) rotateY(' + angle + 'deg) translateZ(' + radius + 'px)';

      var inner = el.querySelector('.carousel-card__inner');
      var record = {
        el: el, inner: inner, angle: angle, index: i, item: project,
        startCover: built.startCover, coverStarted: false
      };
      cards.push(record);

      el.addEventListener('mouseenter', function () {
        inner.classList.add('is-hovered');
        // only the centered/active card's preview plays on hover -- off-center cards stay on
        // their paused first frame even if the pointer happens to pass over them
        if (project.videoPreview && el.classList.contains('is-active')) {
          var pv = inner.querySelector('.carousel-card__preview');
          // cover-first video projects have no preview element until this very first hover
          if (!pv && project.cover) pv = createDeferredPreview(inner, project);
          if (pv) { pv.currentTime = 0; pv.play().catch(function () {}); }
        }
      });
      el.addEventListener('mouseleave', function () {
        inner.classList.remove('is-hovered');
        if (project.videoPreview) {
          var pv = inner.querySelector('.carousel-card__preview');
          if (pv) { pv.pause(); pv.currentTime = 0; pv.classList.remove('is-playing'); }
        }
      });

      ring.appendChild(el);
    });

    // low-priority background fill for every card outside the initial active neighborhood --
    // render() below (via syncActiveIndex() -> ensureNeighborhoodLoaded(0)) already primes index 0
    // and its two neighbors immediately; this just makes sure the remaining cards don't stay on
    // their gradient placeholder forever if the visitor never rotates near them. Each of these is a
    // no-op by the time it's actually its turn if ensureNeighborhoodLoaded() already reached that
    // card first via rotation -- see queueBackfillCover()'s own comment above for why this is safe
    // to queue for everyone unconditionally rather than trying to pre-exclude the neighborhood.
    //
    cards.forEach(function (record) { queueBackfillCover(record); });

    render();
  }

  // ---- cinematic "zoom into project" transition: clone the clicked cover, grow it to fill the
  // viewport with a brightness pulse (as if the camera pushes through it), then reveal the
  // project page underneath. The ring keeps rotating to center the clicked card at the same
  // time, so the carousel is already settled on it by the time the user comes back. ----
  function flyIntoProject(cardEl, project, index) {
    var media = cardEl.querySelector('.carousel-card__inner');
    var startRect = media.getBoundingClientRect();

    function reveal() {
      openProjectPage(project, index, cardEl);
    }

    if (reducedMotion) { reveal(); return; }

    var clone = media.cloneNode(true);
    var face = clone.querySelector('.carousel-card__face');
    if (face) face.remove();
    clone.style.position = 'fixed';
    clone.style.margin = '0';
    clone.style.left = startRect.left + 'px';
    clone.style.top = startRect.top + 'px';
    clone.style.width = startRect.width + 'px';
    clone.style.height = startRect.height + 'px';
    clone.style.zIndex = '600';
    clone.style.transition = 'none';
    clone.style.transform = 'none';
    clone.style.opacity = '1';
    document.body.appendChild(clone);

    var anim = clone.animate([
      { left: startRect.left + 'px', top: startRect.top + 'px', width: startRect.width + 'px', height: startRect.height + 'px', opacity: 1, filter: 'brightness(1)' },
      { left: (window.innerWidth * -0.06) + 'px', top: (window.innerHeight * -0.06) + 'px', width: (window.innerWidth * 1.12) + 'px', height: (window.innerHeight * 1.12) + 'px', opacity: 0.9, filter: 'brightness(1.25)', offset: 0.85 },
      { left: '0px', top: '0px', width: window.innerWidth + 'px', height: window.innerHeight + 'px', opacity: 0, filter: 'brightness(1.4)' }
    ], { duration: 850, easing: 'cubic-bezier(.65,0,.2,1)' });

    anim.onfinish = function () {
      clone.remove();
      reveal();
    };
  }

  function handleCardActivate(c) {
    markInteraction();
    rotateToIndex(c.index);
    flyIntoProject(c.el, c.item, c.index);
  }

  // ---- pause autoplay entirely whenever the pointer is over the carousel, so it can never
  // shift a card out from under a user who's reading/about to click -- resumes its idle
  // countdown fresh the moment the pointer leaves ----
  viewport.addEventListener('mouseenter', function () {
    hoveringViewport = true;
  });
  viewport.addEventListener('mouseleave', function () {
    hoveringViewport = false;
    markInteraction();
  });

  // ---- pointer drag (unified mouse + touch) ----
  var capturedPointerId = null;
  viewport.addEventListener('pointerdown', function (e) {
    markInteraction();
    dragging = true; dragMoved = false;
    dragStartX = e.clientX;
    dragStartAngle = currentAngle;
    lastX = e.clientX; lastT = performance.now();
    velocity = 0;
    stopAnim();
    viewport.classList.add('dragging');
    hint.classList.add('hide');
    // Deliberately NOT calling setPointerCapture here. Capturing on every pointerdown -- even
    // for a plain click with no real movement -- makes the browser retarget the trailing
    // 'click' event to the capturing element (viewport) instead of whatever's actually under
    // the cursor, which silently broke every real click on a card. Capture is only engaged
    // once real dragging is confirmed, below.
  });
  viewport.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - dragStartX;
    // a real mouse/trackpad click almost always has a few px of jitter between down and up --
    // too tight a threshold here silently swallows genuine clicks as if they were drags
    if (Math.abs(dx) > 10 && !dragMoved) {
      dragMoved = true;
      // now that this is confirmed to be a real drag (not a click), capture the pointer so
      // movement keeps tracking even if the cursor leaves the viewport bounds
      capturedPointerId = e.pointerId;
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    }
    var sensitivity = 0.3;
    currentAngle = dragStartAngle + dx * sensitivity;
    var now = performance.now();
    var dt = now - lastT;
    if (dt > 0) velocity = ((e.clientX - lastX) * sensitivity) * (16 / dt);
    lastX = e.clientX; lastT = now;
    render();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('dragging');
    if (capturedPointerId !== null) {
      try { viewport.releasePointerCapture(capturedPointerId); } catch (err) {}
      capturedPointerId = null;
    }
    var cappedV = Math.max(-14, Math.min(14, velocity));
    if (Math.abs(cappedV) > 0.5) { velocity = cappedV; startInertia(); }
    else snapToNearest();
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // ---- wheel rotation: exactly one card per gesture, not a continuous analog rotation.
  // A "gesture" is a run of wheel events with no gap longer than WHEEL_GESTURE_GAP between them
  // (a mouse notch or trackpad flick fires many closely-spaced events, not one) -- deltas
  // accumulate until they cross a threshold, at which point the ring advances exactly one step
  // and further events in that same gesture are ignored. The gesture only "ends" (allowing
  // another step) once a real pause is observed, so it doesn't matter how many events or how
  // unevenly spaced they are within one continuous scroll. ----
  viewport.addEventListener('wheel', function (e) {
    // .carousel-viewport spans the full section width so the ring can rotate cards across it,
    // but that means most of that width is empty/transparent background -- only capture the
    // wheel (and block the page's own scroll) when the cursor is actually over a card; outside
    // that, let the event fall through untouched so the page scrolls normally.
    if (!e.target.closest('.carousel-card')) return;
    e.preventDefault();
    markInteraction();
    hint.classList.add('hide');

    clearTimeout(wheelGestureTimer);
    wheelGestureTimer = setTimeout(function () {
      wheelGestureTriggered = false;
      wheelAccum = 0;
    }, WHEEL_GESTURE_GAP);

    if (wheelGestureTriggered) return;
    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccum += delta;
    if (Math.abs(wheelAccum) < WHEEL_STEP_THRESHOLD) return;
    wheelGestureTriggered = true;
    stepCarousel(wheelAccum > 0 ? 1 : -1);
  }, { passive: false });

  // ---- click / keyboard activation ----
  ring.addEventListener('click', function (e) {
    if (dragMoved) return;
    var cardEl = e.target.closest('.carousel-card');
    if (!cardEl) return;
    var c = cards.filter(function (x) { return x.el === cardEl; })[0];
    if (c) handleCardActivate(c);
  });
  ring.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      markInteraction();
      stepCarousel(e.key === 'ArrowRight' ? 1 : -1);
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var cardEl = e.target.closest('.carousel-card');
    if (!cardEl) return;
    e.preventDefault();
    var c = cards.filter(function (x) { return x.el === cardEl; })[0];
    if (c) handleCardActivate(c);
  });

  // ---- idle autoplay: after a few seconds untouched, the ring slowly advances one card at a
  // time -- a slow eased tween (museum-turntable pace, not a constant-speed spin), then a hold,
  // then the next card -- cancelled instantly on the next interaction. Skipped under reduced
  // motion entirely. ----
  var IDLE_DELAY = 5000;          // ms of no interaction before autoplay begins
  var AUTOPLAY_STEP_DURATION = 3400; // ms per eased rotation -- slow and deliberate on purpose
  var AUTOPLAY_HOLD = 3200;         // ms paused on each card before advancing to the next
  var autoplayTimer = null;

  function scheduleAutoplay(delay) {
    clearTimeout(autoplayTimer);
    if (reducedMotion) return;
    autoplayTimer = setTimeout(autoplayTick, delay);
  }

  function autoplayTick() {
    if (dragging || wheelGestureTriggered || animHandle || hoveringViewport) { scheduleAutoplay(600); return; }
    if (Date.now() - lastInteraction < IDLE_DELAY) { scheduleAutoplay(IDLE_DELAY); return; }
    var count = cards.length;
    if (!count) { scheduleAutoplay(IDLE_DELAY); return; }
    var nextIdx = (nearestIndex() + 1) % count;
    var target = currentAngle + shortestDiff(-cards[nextIdx].angle, currentAngle);
    tweenAngle(target, AUTOPLAY_STEP_DURATION, function () {
      scheduleAutoplay(AUTOPLAY_HOLD);
    }, easeInOutSine);
  }

  scheduleAutoplay(IDLE_DELAY);

  // ---- responsive: recompute card size/radius in place, no rebuild needed ----
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!cards.length) return;
      var size = cardSize();
      radius = ringRadius(size.width, cards.length);
      cards.forEach(function (c) {
        c.el.style.width = size.width + 'px';
        c.el.style.height = size.height + 'px';
        c.el.style.transform = 'translate(-50%,-50%) rotateY(' + c.angle + 'deg) translateZ(' + radius + 'px)';
      });
    }, 150);
  });

  // ---- background particles: deterministic (no Math.random, matching this file's house
  // style), small geometric marks drifting slowly with a mouse-parallax offset scaled by each
  // one's own depth -- the same connective idea as the ambient-bg blobs elsewhere, but its own
  // shapes rather than the reference's contour-line texture. ----
  var PARTICLE_COUNT = 26;
  var particles = [];
  for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
    var kind = pi % 6 === 0 ? 'ring' : (pi % 5 === 0 ? 'diamond' : 'dot');
    var depth = 0.4 + (Math.sin(pi * 1.7 + 1) * 0.5 + 0.5) * 1.2; // ~0.4 - 1.6
    var size = kind === 'dot' ? (3 + (pi % 4) * 2) : (9 + (pi % 3) * 7);
    var leftPct = (Math.sin(pi * 2.31 + 1.2) * 0.5 + 0.5) * 96 + 2;
    var topPct = (Math.cos(pi * 1.87 + 2.4) * 0.5 + 0.5) * 94 + 3;

    var p = document.createElement('div');
    p.className = 'work-particle work-particle--' + kind;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = leftPct + '%';
    p.style.top = topPct + '%';
    var shape = document.createElement('span');
    shape.className = 'work-particle__shape';
    p.appendChild(shape);
    particleLayer.appendChild(p);

    particles.push({ el: p, depth: depth, phase: pi * 2.35 });
  }

  // ---- camera + particles + wash all read the same lerped cursor position, so they move as
  // one connected system rather than separate disconnected effects ----
  var camTargetX = 0, camTargetY = 0, camCurX = 0, camCurY = 0;
  window.addEventListener('mousemove', function (e) {
    camTargetX = (e.clientX / window.innerWidth) * 2 - 1;
    camTargetY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // perf: this loop used to call requestAnimationFrame(bgLoop) unconditionally forever, so it kept
  // writing 26 particles' transform/opacity plus the carousel's own --tiltX/--tiltY every frame
  // long after #work (and the carousel it tilts) had scrolled out of view -- pure wasted work for
  // the rest of the page's lifetime. It now only runs while #work is actually intersecting the
  // viewport, using the same IntersectionObserver already driving the wash/particle opacity fade
  // below (not a second, competing visibility mechanism) -- the loop stops scheduling itself the
  // moment #work leaves view and the observer restarts it the moment #work comes back, with zero
  // change to what it draws or how it looks while running.
  var workBgInView = false;
  var workBgRunning = false;
  if (!reducedMotion) {
    var bgT = 0;
    var bgLoop = function () {
      if (!workBgInView) { workBgRunning = false; return; }
      bgT += 0.0026;
      camCurX += (camTargetX - camCurX) * 0.045;
      camCurY += (camTargetY - camCurY) * 0.045;

      particles.forEach(function (p) {
        var driftX = Math.sin(bgT + p.phase) * 1.7;
        var driftY = Math.cos(bgT * 0.82 + p.phase) * 1.7;
        var parX = camCurX * 2.4 * p.depth;
        var parY = camCurY * 2.4 * p.depth;
        var twinkle = 0.5 + (Math.sin(bgT * 1.35 + p.phase) * 0.5 + 0.5) * 0.5;
        p.el.style.transform = 'translate(' + (driftX + parX).toFixed(2) + '%, ' + (driftY + parY).toFixed(2) + '%)';
        p.el.style.opacity = twinkle.toFixed(3);
      });

      // subtle camera tilt tied to the same cursor tracking as the particles above -- ties the
      // 3D stage itself into the same connected motion source instead of sitting still
      viewport.style.setProperty('--tiltX', (-camCurY * 3.2).toFixed(2) + 'deg');
      viewport.style.setProperty('--tiltY', (camCurX * 3.6).toFixed(2) + 'deg');

      requestAnimationFrame(bgLoop);
    };
  }
  function startBgLoopIfNeeded() {
    if (workBgRunning || reducedMotion) return;
    workBgRunning = true;
    requestAnimationFrame(bgLoop);
  }

  // ---- the background wash + particles are only meaningfully visible while the Work section
  // itself is on screen -- fades in/out with scroll rather than staying lit over other sections ----
  var workSection = document.getElementById('work');
  if (workSection) {
    var bgVisibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        workBg.classList.toggle('in-view', entry.isIntersecting);
        workBgInView = entry.isIntersecting;
        if (workBgInView) startBgLoopIfNeeded();
      });
    }, { threshold: 0.12 });
    bgVisibilityObserver.observe(workSection);
  }

  buildRing();
}, { priority: true });
