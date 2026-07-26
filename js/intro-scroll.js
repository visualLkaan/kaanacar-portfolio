// ---- Cinematic identity intro: scroll-scrubbed 800-frame sequence + volumetric titles ----
// Architecturally the hero background's sibling (see the #hero-scroll-track / #hero-bg-canvas
// IIFE in js/script.js): a frame sequence painted to canvas, scrubbed by scroll position. Split
// into its own module -- rather than folded into script.js -- so nothing here ever risks touching
// the hero's already-working code, and because this needs one genuinely new capability the hero
// doesn't: at 800 frames, preloading everything up front (what the hero does with its 126) isn't
// an option, so this keeps only a sliding window of frames decoded/resident at once and evicts the
// rest as the scroll position moves on.
//
// Also drives the two scroll-controlled beats that continue directly out of the footage's own
// ending: the post-footage blackout (.intro-blackout, still inside #about's own track/pin -- see
// applyBlackout) and the #reveal section's own background/content build (a separate track/pin
// right after, see applyReveal). Both are pure functions of scroll position, same as the titles.
//
// Reduced motion: draws frame 1 once, statically, and leaves the three title elements alone --
// their reduced-motion "always visible, no animation" state is pure CSS (see .intro-title under
// `@media (prefers-reduced-motion: reduce)` in css/style.css), so there's nothing for this module
// to do beyond painting one still frame. The blackout and #reveal tracks collapse the same way
// (see their own `@media (prefers-reduced-motion: reduce)` rules) so none of this module's extra
// scroll-scrub logic below ever runs for a reduced-motion visitor either.

export function initIntro() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var track = document.getElementById('intro-scroll-track');
  var canvas = document.getElementById('intro-bg-canvas');
  var veilEl = document.getElementById('intro-entry-veil');
  var blackoutEl = document.getElementById('intro-blackout');
  var revealTrack = document.getElementById('reveal-scroll-track');
  var revealBgEl = document.getElementById('reveal-bg');
  var revealContentEl = document.getElementById('reveal-content');
  if (!track || !canvas) return;

  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  var FRAMES_BASE = 'assets/intro/frames/';
  var SCROLL_RANGE = 6400; // px of scroll to play through the full sequence -- matches the CSS track
  var EAGER_COUNT = 30;    // frames loaded immediately, before any scroll -- covers the opening beat
  var WINDOW_RADIUS = 90;  // frames kept loaded on each side of the current index (~180 resident of 800)
  var EVICT_MARGIN = 30;   // extra slack beyond the window before evicting, so hovering right at the
                            // edge of the window doesn't thrash load/evict every tick
  var MAX_CONCURRENT = 4;  // parallel frame fetches for the windowed loader (the eager burst above
                            // ignores this -- see loadFrame)
  var LERP = 0.4;          // scroll->frame smoothing: intentionally light (vs. the hero's 0.09) so
                            // this reads as "you are scrubbing," not the hero's slow cinematic settle
  var VEIL_FADE_FRACTION = 0.08; // fraction of the sequence over which the entry veil (see below) clears
  var DARKEN_RANGE = 1000; // px of scroll, past the last frame, over which the blackout ramps 0->1.
                            // .intro-scroll-track's own CSS height has a further 500px past this
                            // baked in as pure scroll distance (the cinematic hold) -- nothing here
                            // needs to compute with that number, darkenTargetT is already clamped
                            // at 1 for the whole of it, so it's just extra track height in the CSS.
  var REVEAL_RANGE = 1800; // px of scroll for #reveal's own bg-then-content build, matches its CSS track
  var REVEAL_BG_END = 0.45;       // fraction of REVEAL_RANGE by which the ambient bg is fully in
  var REVEAL_CONTENT_START = 0.35; // fraction of REVEAL_RANGE where content starts fading in --
                                     // overlaps the bg's own tail rather than waiting for it to fully
                                     // finish, so the two beats cascade instead of stepping

  // Three identity lines, each visible only inside its own frame window during the footage's early
  // clean-cloud passage (frames roughly 10-230 -- verified against the actual rendered footage, not
  // guessed: the source's own cloud-whiteout at ~frame 210-290 is what the last title's exit blurs
  // into, ahead of the footage's own baked "WHO I AM" reveal at ~frame 290+, which -- along with
  // everything after it -- this module never touches).
  var TITLES = [
    { el: document.querySelector('.intro-title--name'),   start: 10,  end: 75  },
    { el: document.querySelector('.intro-title--role'),   start: 90,  end: 155 },
    { el: document.querySelector('.intro-title--school'), start: 170, end: 230 }
  ];

  var frames = {};   // index -> ImageBitmap|Image, only ever holds the current sliding window
  var pending = {};  // index -> true while an in-flight load owns that slot
  var queue = [];     // indices wanted but not yet loading, nearest-first
  var activeLoads = 0;
  var frameCount = 0, nativeW = 0, nativeH = 0, pad = 3;
  var veilFadeEndFrame = 0;
  var decodeW = 0, decodeH = 0;
  var lastDrawnIndex = -1;
  var lastQueuedIndex = -1;
  var curT = 0, targetT = 0;
  var darkenCurT = 0, darkenTargetT = 0;
  var revealCurT = 0, revealTargetT = 0;

  function frameUrl(i) {
    var n = String(i + 1);
    while (n.length < pad) n = '0' + n;
    return FRAMES_BASE + 'frame-' + n + '.webp';
  }

  // same "decode at exactly the size the canvas will show" technique as the hero's coverDecodeSize
  function coverDecodeSize() {
    var scale = Math.min(1, Math.max(canvas.width / nativeW, canvas.height / nativeH));
    return {
      w: Math.max(1, Math.round(nativeW * scale)),
      h: Math.max(1, Math.round(nativeH * scale))
    };
  }

  function loadFrame(i) {
    if (frames[i] || pending[i]) return;
    pending[i] = true;
    activeLoads++;
    var url = frameUrl(i);
    var settle;
    if (window.createImageBitmap) {
      settle = fetch(url).then(function (r) { return r.blob(); }).then(function (blob) {
        return createImageBitmap(blob, { resizeWidth: decodeW, resizeHeight: decodeH, resizeQuality: 'high' });
      }).then(function (bitmap) { frames[i] = bitmap; }).catch(function () {});
    } else {
      var img = new Image();
      img.src = url;
      settle = (img.decode ? img.decode() : new Promise(function (resolve) {
        img.onload = resolve; img.onerror = resolve;
      })).catch(function () {}).then(function () { frames[i] = img; });
    }
    settle.then(function () {
      delete pending[i];
      activeLoads--;
      pump();
    });
  }

  // explicit ImageBitmap.close() releases the decoded bitmap's memory immediately rather than
  // waiting on GC -- the whole point of the windowed cache is bounded memory, so this matters
  function evict(centerIdx) {
    var lo = centerIdx - WINDOW_RADIUS - EVICT_MARGIN;
    var hi = centerIdx + WINDOW_RADIUS + EVICT_MARGIN;
    for (var key in frames) {
      var i = +key;
      if (i < lo || i > hi) {
        var f = frames[i];
        if (f && typeof f.close === 'function') f.close();
        delete frames[i];
      }
    }
  }

  function refillQueue(centerIdx, dir) {
    var lo = Math.max(0, centerIdx - WINDOW_RADIUS);
    var hi = Math.min(frameCount - 1, centerIdx + WINDOW_RADIUS);
    var wanted = [];
    for (var i = lo; i <= hi; i++) {
      if (!frames[i] && !pending[i]) wanted.push(i);
    }
    // nearest-first, with a bias toward whichever direction the user is currently scrolling so
    // forward (or backward) scrubbing rarely outruns the loader
    wanted.sort(function (a, b) {
      var da = (a - centerIdx) * dir;
      var db = (b - centerIdx) * dir;
      var wa = da >= 0 ? da * 0.6 : -da;
      var wb = db >= 0 ? db * 0.6 : -db;
      return wa - wb;
    });
    queue = wanted;
  }

  function pump() {
    while (activeLoads < MAX_CONCURRENT && queue.length) {
      var i = queue.shift();
      if (!frames[i] && !pending[i]) loadFrame(i);
    }
  }

  // walks outward from idx to the nearest frame that's actually loaded -- bounded to the window
  // radius so a huge jump (e.g. keyboard End) never walks all the way back to frame 0. Returns -1
  // if nothing nearby is ready yet, in which case the canvas just keeps showing the last frame it
  // drew rather than going blank.
  function nearestLoaded(idx) {
    if (frames[idx]) return idx;
    for (var d = 1; d <= WINDOW_RADIUS; d++) {
      if (frames[idx - d]) return idx - d;
      if (idx + d < frameCount && frames[idx + d]) return idx + d;
    }
    return -1;
  }

  // replicates CSS object-fit:cover -- same crop-rect math as the hero's own drawFrame
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
    lastDrawnIndex = -1;
    if (frameCount) {
      var idx = Math.round(curT * (frameCount - 1));
      var found = nearestLoaded(idx);
      if (found >= 0) drawFrame(found);
    }
  }
  window.addEventListener('resize', resizeCanvas);

  // ---- title motion: eased emerge -> hold -> pass-through, driven directly by scroll position
  // (no CSS transitions -- values are written every frame like the hero's own content-fade, so
  // motion stays exactly frame-accurate reversed as it is forwards) ----
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInCubic(t) { return t * t * t; }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function applyTitle(title, posF) {
    var el = title.el;
    if (!el) return;
    if (posF <= title.start || posF >= title.end) {
      if (el.style.opacity !== '0') {
        el.style.opacity = '0';
        el.style.filter = 'blur(20px)';
        // reset to the same pre-emerge pose emerge itself starts from, so state stays a pure
        // function of scroll position -- otherwise this would freeze at whatever transform was
        // last written on the way out (harmless while opacity:0 hides it, but not actually correct)
        el.style.transform = 'perspective(1600px) rotateX(14deg) translateY(36px) scale(0.88)';
      }
      return;
    }
    var span = title.end - title.start;
    var p = (posF - title.start) / span;
    var EMERGE = 0.25, HOLD = 0.65;
    var blur, opacity, scale, rotX, ty;
    if (p < EMERGE) {
      var e = easeOutCubic(p / EMERGE);
      blur = lerp(20, 0, e);
      opacity = lerp(0, 1, e);
      scale = lerp(0.88, 1, e);
      rotX = lerp(14, 6, e);
      ty = lerp(36, 0, e);
    } else if (p < HOLD) {
      var e2 = easeInOutCubic((p - EMERGE) / (HOLD - EMERGE));
      blur = 0;
      opacity = 1;
      scale = lerp(1, 1.05, e2);
      rotX = 6;
      ty = 0;
    } else {
      var e3 = easeInCubic((p - HOLD) / (1 - HOLD));
      blur = lerp(0, 16, e3);
      opacity = lerp(1, 0, e3);
      scale = lerp(1.05, 1.4, e3);
      rotX = 6;
      ty = 0;
    }
    el.style.opacity = opacity.toFixed(3);
    el.style.filter = blur > 0.01 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
    el.style.transform = 'perspective(1600px) rotateX(' + rotX.toFixed(2) + 'deg) translateY('
      + ty.toFixed(2) + 'px) scale(' + scale.toFixed(4) + ')';
  }

  // Entry veil: fully opaque at the very first frame (bridging from the Work section's dark
  // canvas), eased to fully transparent by veilFadeEndFrame so the footage's own bright opening
  // (white clouds/blue sky) never appears as an abrupt cut. Pure function of scroll position, same
  // as applyTitle above, so it reverses exactly on scroll-up.
  function applyVeil(posF) {
    if (!veilEl) return;
    var p = Math.min(Math.max(posF / veilFadeEndFrame, 0), 1);
    var opacity = 1 - easeOutCubic(p);
    veilEl.style.opacity = opacity.toFixed(3);
  }

  // Post-footage blackout: t is already 0 through the whole 800-frame scrub (see darkenTargetT
  // below, which only starts rising once rawPx passes SCROLL_RANGE) and 1 for the entire hold --
  // this just writes it straight through, the easing already happened in darkenTargetT/darkenCurT's
  // own lerp toward it.
  function applyBlackout(t) {
    if (!blackoutEl) return;
    blackoutEl.style.opacity = t.toFixed(3);
  }

  // #reveal's own build: background (opacity/scale/blur) fades in first, content (opacity/
  // translateY) starts once the background is already meaningfully underway -- both eased and both
  // pure functions of this track's own scroll position, same pattern as applyTitle/applyVeil above.
  function applyReveal(t) {
    if (revealBgEl) {
      var bgP = Math.min(Math.max(t / REVEAL_BG_END, 0), 1);
      var eBg = easeOutCubic(bgP);
      revealBgEl.style.opacity = eBg.toFixed(3);
      var scale = lerp(0.92, 1, eBg);
      var blur = lerp(10, 0, eBg);
      revealBgEl.style.transform = 'scale(' + scale.toFixed(4) + ')';
      revealBgEl.style.filter = blur > 0.01 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
    }
    if (revealContentEl) {
      var cP = Math.min(Math.max((t - REVEAL_CONTENT_START) / (1 - REVEAL_CONTENT_START), 0), 1);
      var eContent = easeOutCubic(cP);
      revealContentEl.style.opacity = eContent.toFixed(3);
      var ty = lerp(28, 0, eContent);
      revealContentEl.style.transform = 'translateY(' + ty.toFixed(2) + 'px)';
    }
  }

  fetch(FRAMES_BASE + 'manifest.json').then(function (r) { return r.json(); }).then(function (manifest) {
    frameCount = manifest.count;
    nativeW = manifest.width;
    nativeH = manifest.height;
    pad = manifest.pad || 3;
    veilFadeEndFrame = Math.max(1, frameCount * VEIL_FADE_FRACTION);
    resizeCanvas();
    var decodeSize = coverDecodeSize();
    decodeW = decodeSize.w;
    decodeH = decodeSize.h;

    if (reducedMotion) {
      loadFrame(0);
      var check = setInterval(function () {
        if (frames[0]) { drawFrame(0); clearInterval(check); }
      }, 30);
      return;
    }

    for (var i = 0; i < Math.min(EAGER_COUNT, frameCount); i++) loadFrame(i);
    startScrollScrub();
  }).catch(function () {});

  function startScrollScrub() {
    function updateTarget() {
      var trackTop = track.getBoundingClientRect().top + window.scrollY;
      var rawPx = window.scrollY - trackTop;
      targetT = Math.min(Math.max(rawPx / SCROLL_RANGE, 0), 1);
      // starts rising only once rawPx passes the frame-scrub's own range, i.e. only after the
      // footage has been scrubbed all the way to its last frame -- see applyBlackout
      darkenTargetT = Math.min(Math.max((rawPx - SCROLL_RANGE) / DARKEN_RANGE, 0), 1);
    }
    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', updateTarget);
    updateTarget();

    function updateRevealTarget() {
      if (!revealTrack) return;
      var top = revealTrack.getBoundingClientRect().top + window.scrollY;
      revealTargetT = Math.min(Math.max((window.scrollY - top) / REVEAL_RANGE, 0), 1);
    }
    if (revealTrack) {
      window.addEventListener('scroll', updateRevealTarget, { passive: true });
      window.addEventListener('resize', updateRevealTarget);
      updateRevealTarget();
    }

    function loop() {
      var prevT = curT;
      curT += (targetT - curT) * LERP;
      var dir = curT >= prevT ? 1 : -1;

      var posF = curT * (frameCount - 1);
      var idx = Math.round(posF);

      var found = nearestLoaded(idx);
      if (found >= 0) drawFrame(found);

      for (var i = 0; i < TITLES.length; i++) applyTitle(TITLES[i], posF);
      applyVeil(posF);

      darkenCurT += (darkenTargetT - darkenCurT) * LERP;
      applyBlackout(darkenCurT);

      revealCurT += (revealTargetT - revealCurT) * LERP;
      applyReveal(revealCurT);

      if (idx !== lastQueuedIndex) {
        refillQueue(idx, dir);
        evict(idx);
        pump();
        lastQueuedIndex = idx;
      }

      requestAnimationFrame(loop);
    }
    loop();
  }
}
