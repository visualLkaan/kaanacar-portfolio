// ---- Fast Travel: the site's only navigation, a radial Option Wheel ----
// A vanilla-CSS/JS take on React Bits' Option Wheel (https://reactbits.dev/components/option-wheel),
// reimplemented rather than pulled in -- see css/style.css's FAST TRAVEL block for the visual side
// (the arc/radius math, the scoped glow). This module owns three things CSS alone can't: opening on
// hover (desktop) vs. tap (mobile/tablet), closing on Escape/outside-click, and the actual
// navigation -- a custom rAF smooth-scroll on the site's own signature-ease curve, landing inside
// each destination scene's own "hold" window rather than at a scroll-track's raw top.
//
// Why a custom scroll instead of a plain `href="#id"` jump: four of the six destinations
// (#identity, #about-me, #skills, #availability) are scroll-scrubbed, sticky-pinned scenes whose
// content is only fully built/visible partway through their own track's scroll range. A bare
// anchor jump lands at the track's top -- every line of a scene still at opacity:0 -- which would
// make Fast Travel feel broken rather than premium.
// TRACK_TARGETS below encodes, per destination, roughly where in that track's own progress (0-1)
// the content is fully assembled and still comfortably before its own exit phase begins -- computed
// from the exact range/exitStart/stagger constants already in js/scenes.js for #about-me/#skills/
// #availability, and in js/identity.js for #identity (kept as plain literals here, same as those
// files already keep their own range numbers in manual lockstep with their CSS track heights -- an
// established pattern in this codebase, not a new fragility). #work and #contact are plain,
// unpinned sections, so they just get a normal "scroll its top into view" target.
//
// Reduced motion: the wheel's own open/close motion is pure CSS transitions, already zeroed by the
// sitewide `*{ transition:none !important }` rule (css/style.css, end of file) -- nothing to do
// here for that. The rAF scroll animation below is NOT a CSS transition, so it's explicitly skipped
// in favor of an instant jump when reduced motion is on, matching every other module's convention.

export function initFastTravel() {
  var root = document.getElementById('fast-travel');
  var trigger = document.getElementById('fast-travel-trigger');
  var wheel = document.getElementById('fast-travel-wheel');
  if (!root || !trigger || !wheel) return;

  var items = Array.prototype.slice.call(wheel.querySelectorAll('.fast-travel__item'));
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- Signature-ease scroll: a small cubic-bezier solver (Newton-Raphson on the curve's own x(t),
  // same technique browsers use internally) so the scroll uses the site's *exact* signature-ease
  // (cubic-bezier(.76,0,.24,1)) rather than an approximation of it. ----
  function makeCubicBezier(x1, y1, x2, y2) {
    function a(u, v) { return 1 - 3 * v + 3 * u; }
    function b(u, v) { return 3 * v - 6 * u; }
    function c(u) { return 3 * u; }
    function bezX(t) { return ((a(x1, x2) * t + b(x1, x2)) * t + c(x1)) * t; }
    function bezY(t) { return ((a(y1, y2) * t + b(y1, y2)) * t + c(y1)) * t; }
    function bezXd(t) { return 3 * a(x1, x2) * t * t + 2 * b(x1, x2) * t + c(x1); }
    function solveT(x) {
      var t = x;
      for (var i = 0; i < 8; i++) {
        var dx = bezX(t) - x;
        var d = bezXd(t);
        if (Math.abs(d) < 1e-6) break;
        t -= dx / d;
        t = Math.min(Math.max(t, 0), 1);
      }
      return t;
    }
    return function (x) { return bezY(solveT(x)); };
  }
  var signatureEase = makeCubicBezier(0.76, 0, 0.24, 1);

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

  // Per-destination landing point inside its own track's progress (0-1) -- see js/scenes.js
  // for where these ranges and phases come from (js/identity.js for #identity specifically).
  //   #identity (range 1650, exitStart 0.76): name finishes at t~0.30, the last meta line at
  //     t~0.66 -- t=0.70 sits just past that with a comfortable buffer before exitStart, landing
  //     on "KAAN ACAR" + Age/Department/Status fully built and centered.
  //   #about-me (range 2600, exitStart 0.74): label + 5 sentences, 6 lines stagger-build, the
  //     last finishing at t~0.595 -- t=0.62 lands just past that (comfortably inside the
  //     "immediately visible, already centered" hold, not mid-build) while keeping maximum buffer
  //     before exitStart, so a visitor lands squarely on the fully-assembled composition rather
  //     than glimpsing the tail of its own build or the start of its own exit.
  //   #skills (range 2226, exitStart 0.673): 7 lines finishing at t~0.618 -- t=0.64.
  //   #availability (range 1338, exitStart 0.581): 4 lines finishing at t~0.515 -- t=0.54.
  var TRACK_TARGETS = {
    '#identity': { trackId: 'identity-new-track', range: 1650, t: 0.70 },
    '#about-me': { trackId: 'about-me-scroll-track', range: 2600, t: 0.62 },
    '#skills': { trackId: 'skills-scroll-track', range: 2226, t: 0.64 },
    '#availability': { trackId: 'availability-scroll-track', range: 1338, t: 0.54 }
  };

  function resolveTargetY(hash) {
    var track = TRACK_TARGETS[hash];
    if (track) {
      var trackEl = document.getElementById(track.trackId);
      if (trackEl) {
        var trackTop = trackEl.getBoundingClientRect().top + window.scrollY;
        return trackTop + track.t * track.range;
      }
    }
    var el = document.querySelector(hash);
    if (!el) return null;
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function smoothScrollTo(targetY) {
    var startY = window.scrollY;
    var diff = targetY - startY;
    if (Math.abs(diff) < 2) return;
    if (reducedMotion) {
      window.scrollTo(0, targetY);
      return;
    }
    var duration = clamp(Math.abs(diff) * 0.35, 700, 1400);
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var p = clamp((ts - startTime) / duration, 0, 1);
      window.scrollTo(0, startY + diff * signatureEase(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- Open/close state ----
  // CLOSE_DELAY is a second, independent line of defense on top of the CSS `.fast-travel__hit-zone`
  // (see css/style.css) -- that circle already geometrically bridges the trigger to every item, so
  // in the common case the cursor never actually leaves the component while moving between them.
  // The delay exists for whatever the geometry doesn't catch: overshooting the hit-zone, a fast or
  // slightly diagonal flick of the mouse, briefly pausing just outside it. Debouncing the close
  // (instead of firing it the instant `mouseleave` reaches `root`) is what makes both forms of
  // forgiveness actually forgiving.
  var CLOSE_DELAY = 300;
  var closeTimer = null;
  function cancelClose() {
    if (closeTimer !== null) { clearTimeout(closeTimer); closeTimer = null; }
  }
  function setOpen(open) {
    cancelClose();
    root.classList.toggle('open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    for (var i = 0; i < items.length; i++) items[i].tabIndex = open ? 0 : -1;
  }
  function scheduleClose() {
    cancelClose();
    closeTimer = setTimeout(function () { closeTimer = null; setOpen(false); }, CLOSE_DELAY);
  }
  function isOpen() { return root.classList.contains('open'); }

  if (hoverCapable) {
    // Attached to `root` (trigger + glow + wheel together), not the trigger/wheel separately --
    // entering *either* cancels any pending close, leaving *either* only schedules one, so the
    // wheel stays open across the whole component and only closes once the pointer has actually
    // left both for the full delay.
    root.addEventListener('mouseenter', function () { setOpen(true); });
    root.addEventListener('mouseleave', function () { scheduleClose(); });
    trigger.addEventListener('focus', function () { setOpen(true); });
  }

  trigger.addEventListener('click', function () {
    setOpen(!isOpen());
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  });

  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    if (root.contains(e.target)) return;
    setOpen(false);
  });

  root.addEventListener('focusout', function () {
    // Closes once focus leaves the whole component (trigger + items), not on every per-item blur
    // (the next focusin, if any, lands on another descendant and this never fires for that case).
    requestAnimationFrame(function () {
      if (!root.contains(document.activeElement)) setOpen(false);
    });
  });

  items.forEach(function (item) {
    item.addEventListener('click', function (e) {
      var hash = item.getAttribute('data-target');
      var targetY = resolveTargetY(hash);
      if (targetY === null) return; // let the plain href fallback handle it
      e.preventDefault();
      setOpen(false);
      trigger.focus();
      smoothScrollTo(targetY);
      history.pushState(null, '', hash);
    });
  });
}
