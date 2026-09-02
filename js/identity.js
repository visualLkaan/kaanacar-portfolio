// ---- Identity scene: from-scratch rebuild, deliberately independent of js/scenes.js ----
// The previous Identity implementation shared js/scenes.js's engine, which smooths every scene's
// progress toward its scroll target with a per-frame lerp -- a permanent requestAnimationFrame
// loop that keeps writing (imperceptibly small, but real) style changes forever, even long after a
// scene has fully settled. That's an accepted cost for the three scenes that still use it
// (About Me/Skills/Availability), but this rebuild comes with an explicit requirement that
// Identity itself never do that: no permanent animation loop, and nothing keeps touching these
// elements once the reveal is done. So instead of joining that shared engine, this module computes
// its own scroll progress the same way js/scenes.js's updateTargets() does (scrollY against the
// track's own position), but only inside a single scroll/resize listener that's rAF-throttled to
// fire at most once per frame -- a classic scroll-perf batching pattern, not a self-rescheduling
// loop -- and it writes styles only when that progress has actually moved. Once the user stops
// scrolling (or scrolls past the point where anything here still changes), the handler goes
// completely idle: no rAF is requested, nothing is written, nothing costs anything.
//
// "KAAN ACAR" is split into individual character spans (splitChars() below -- not
// js/scenes.js's splitWords()/.split-word, a separate implementation) that cascade in from
// blurred/low-opacity/lowered to crisp as scroll progress advances, the three meta lines
// following with their own later stagger, then the whole .identity-new container fades/blurs/
// lifts out together as one unit before #about-me begins -- the same build-hold-group-exit shape
// the rest of this passage uses, just computed here instead of by the shared engine.
//
// Reduced motion: this module simply never mounts (see the early return below). The name and meta
// lines are then left exactly as they are in the markup -- plain, fully visible, unblurred,
// untransformed text -- which is already the correct "show everything immediately" reduced-motion
// state with no extra CSS override needed (see css/style.css's IDENTITY block).

export function initIdentity() {
  var track = document.getElementById('identity-new-track');
  var container = document.getElementById('identity-new');
  var nameInner = document.getElementById('identity-new-name-inner');
  var items = [
    document.getElementById('identity-new-item-1'),
    document.getElementById('identity-new-item-2'),
    document.getElementById('identity-new-item-3')
  ];
  if (!track || !container || !nameInner) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInCubic(t) { return t * t * t; }

  // Splits nameInner's text into one <span class="identity-new__char"> per character, word by
  // word so the space between "KAAN" and "ACAR" stays a real text node (natural spacing/wrapping)
  // rather than a span of its own -- same reasoning js/scenes.js's splitWords() uses for word
  // boundaries, applied one level deeper here.
  function splitChars(el) {
    var text = el.textContent.trim();
    var words = text.length ? text.split(/\s+/) : [];
    el.textContent = '';
    var spans = [];
    words.forEach(function (word, wi) {
      for (var i = 0; i < word.length; i++) {
        var span = document.createElement('span');
        span.className = 'identity-new__char';
        span.textContent = word[i];
        el.appendChild(span);
        spans.push(span);
      }
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return spans;
  }

  var chars = splitChars(nameInner);
  var n = chars.length;

  // ---- Timing, as fractions of this scene's own scroll progress (0-1) -- kept as plain,
  // hand-tuned literals rather than derived, the same convention js/scenes.js's own scene configs
  // already use. RANGE must stay in lockstep with .identity-new-track's CSS height
  // (css/style.css's IDENTITY block). ----
  var RANGE = 1650;          // px of scroll this whole scene (build + hold + exit) plays out over
  var NAME_END = 0.30;       // "KAAN ACAR" finishes cascading in by 30% progress
  var ITEM_BASE = 0.34;      // first meta line starts just after the name's own build
  var ITEM_STEP = 0.08;      // stagger between each meta line's own start
  var ITEM_SPAN = 0.16;      // each meta line's own build window
  var EXIT_START = 0.76;     // hold from ~0.62 (last item done) to here, then group-exit to 1.0

  function applyChar(el, p) {
    var e = easeOutCubic(p);
    el.style.opacity = e.toFixed(3);
    el.style.filter = e > 0.995 ? 'none' : 'blur(' + lerp(8, 0, e).toFixed(2) + 'px)';
    el.style.transform = 'translateY(' + lerp(12, 0, e).toFixed(2) + 'px)';
  }
  function applyItem(el, p) {
    var e = easeOutCubic(p);
    el.style.opacity = e.toFixed(3);
    el.style.filter = e > 0.995 ? 'none' : 'blur(' + lerp(6, 0, e).toFixed(2) + 'px)';
    el.style.transform = 'translateY(' + lerp(10, 0, e).toFixed(2) + 'px)';
  }

  var lastT = -1;
  var ticking = false;

  function render() {
    ticking = false;
    var top = track.getBoundingClientRect().top + window.scrollY;
    var t = clamp((window.scrollY - top) / RANGE, 0, 1);
    if (t === lastT) return; // already fully rendered for this progress -- touch nothing
    lastT = t;

    for (var i = 0; i < n; i++) {
      var start = (i / n) * NAME_END;
      var span = Math.min(NAME_END - start, (1.6 / n) * NAME_END);
      var p = span > 0 ? clamp((t - start) / span, 0, 1) : (t >= start ? 1 : 0);
      applyChar(chars[i], p);
    }

    for (var j = 0; j < items.length; j++) {
      if (!items[j]) continue;
      var s = ITEM_BASE + j * ITEM_STEP;
      var ip = clamp((t - s) / ITEM_SPAN, 0, 1);
      applyItem(items[j], ip);
    }

    // Group exit: the whole container fades/blurs/lifts together as one unit, matching the same
    // build-hold-group-exit shape js/scenes.js's own scenes use -- never an individual line
    // exiting on its own.
    var ep = clamp((t - EXIT_START) / (1 - EXIT_START), 0, 1);
    var ee = easeInCubic(ep);
    container.style.opacity = (1 - ee).toFixed(3);
    container.style.filter = ee < 0.01 ? 'none' : 'blur(' + lerp(0, 14, ee).toFixed(2) + 'px)';
    container.style.transform = 'translateY(' + lerp(0, -40, ee).toFixed(2) + 'px)';
  }

  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);
  render();
}
