// ---- Cinematic post-blackout scenes: about me, software & skills, availability ----
// Continues directly out of #work (both dark, no bridging needed -- see index.html's #about-me
// comment). Architecturally each scene is the same pattern as the hero section above it -- a
// taller scroll track, a sticky-pinned section inside it -- plus one phase specific to this
// content: every line stagger-builds in (word by word, a vanilla-CSS take on React Bits' Split Text
// -- https://reactbits.dev/text-animations/split-text), holds fully assembled long enough to read,
// then the whole content group fades/lifts out together as one unit before the next scene's own
// build begins. That's what makes #about-me -> #skills -> #availability read as one continuous
// scene rather than three stacked sections. Nothing here is a CSS transition or a timer -- every
// value is a pure function of its own track's scroll position, so it reverses exactly on
// scroll-up.
//
// Reduced motion: this whole module is a no-op (see the early return below). Every track collapses
// to 100svh and every line/word defaults to fully visible via css/style.css's own
// `@media (prefers-reduced-motion: reduce)` rules, matching how the hero scene already opts out.

export function initScenes() {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInCubic(t) { return t * t * t; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }

  // Splits an element's text into one <span class="split-word"> per word (a real text-node space
  // between each, so normal wrapping still works) -- run once at scene-build time; guarded so a
  // line never double-splits.
  function splitWords(el) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = '1';
    var text = el.textContent.trim();
    var words = text.length ? text.split(/\s+/) : [];
    el.textContent = '';
    var spans = [];
    words.forEach(function (w, i) {
      var span = document.createElement('span');
      span.className = 'split-word';
      span.textContent = w;
      el.appendChild(span);
      spans.push(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return spans;
  }

  // Cascades word spans across local progress p (0-1): word i's own window is
  // [i/n, i/n + 1.6/n], clamped so it never runs past p=1 -- the 1.6x factor overlaps consecutive
  // words' cascades slightly rather than stepping, same "cascade, don't step" idea as the loader's
  // own LINE_START overlaps.
  function revealWords(words, p) {
    var n = words.length;
    if (!n) return;
    for (var i = 0; i < n; i++) {
      var start = i / n;
      var span = Math.min(1 - start, 1.6 / n);
      var wp = span > 0 ? clamp((p - start) / span, 0, 1) : (p >= start ? 1 : 0);
      var e = easeOutCubic(wp);
      var w = words[i];
      w.style.opacity = e.toFixed(3);
      w.style.filter = e > 0.995 ? 'none' : 'blur(' + lerp(8, 0, e).toFixed(2) + 'px)';
      w.style.transform = 'translateY(' + lerp(16, 0, e).toFixed(2) + 'px)';
    }
  }

  // Whole-element reveal for structured content (label/value fact rows, skill cards, availability
  // items) -- splitting a "label: value" row or a card word-by-word would read as noise, not signal.
  function revealBlock(el, p) {
    var e = easeOutCubic(p);
    el.style.opacity = e.toFixed(3);
    el.style.filter = e > 0.995 ? 'none' : 'blur(' + lerp(10, 0, e).toFixed(2) + 'px)';
    el.style.transform = 'translateY(' + lerp(20, 0, e).toFixed(2) + 'px)';
  }

  function buildLines(configs) {
    var lines = [];
    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      var el = document.getElementById(cfg.id);
      if (!el) continue;
      lines.push({
        el: el,
        words: cfg.mode === 'words' ? splitWords(el) : null,
        start: cfg.start,
        end: cfg.end,
        onProgress: null
      });
    }
    return lines;
  }

  // One skill card's confidence ring: stroke-dasharray/dashoffset tied to the same progress
  // driving the card's own entrance, so the ring fills in as the card arrives rather than
  // snapping in already-complete. Score read straight off the ring's own data-score (index.html).
  function makeRingUpdater(cardEl) {
    var ringWrap = cardEl.querySelector('.skill-ring');
    var ringFill = cardEl.querySelector('.skill-ring__fill');
    if (!ringWrap || !ringFill) return null;
    var score = parseFloat(ringWrap.dataset.score) || 0;
    var r = parseFloat(ringFill.getAttribute('r')) || 27;
    var circumference = 2 * Math.PI * r;
    ringFill.style.strokeDasharray = circumference.toFixed(2);
    return function (p) {
      var fraction = (score / 10) * clamp(p, 0, 1);
      ringFill.style.strokeDashoffset = (circumference * (1 - fraction)).toFixed(2);
    };
  }

  function buildScene(opts) {
    var track = document.getElementById(opts.trackId);
    var content = document.getElementById(opts.contentId);
    if (!track || !content) return null;
    return {
      track: track,
      content: content,
      lines: buildLines(opts.lineConfigs),
      range: opts.range,
      exitStart: opts.exitStart,
      curT: 0,
      targetT: 0
    };
  }

  // Builds a stagger schedule from a plain ordered list of {id, mode} -- line i's own window is
  // [BASE + i*STAGGER, BASE + i*STAGGER + SPAN], so consecutive lines cascade in with overlap
  // rather than waiting for one another to fully finish.
  function stagger(order, base, step, span) {
    return order.map(function (cfg, i) {
      return { id: cfg.id, mode: cfg.mode, start: base + i * step, end: base + i * step + span };
    });
  }

  var scenes = [];

  // ---- About Me: tiny "About Me" label + 5 sentences (6 lines) ----
  // range/exitStart must match .about-me-scroll-track's CSS height (see css/style.css). 2600px
  // (up from a previous 2151px, 5-line pass) deliberately widens this scene's own build so the
  // reveal reads as more unhurried/cinematic per an explicit redesign request, not just to fit the
  // new label line. Still gets proportionally more hold than the other scenes -- it's the one
  // passage actually meant to be read.
  var aboutMeScene = buildScene({
    trackId: 'about-me-scroll-track',
    contentId: 'about-me-content',
    range: 2600,
    exitStart: 0.74,
    lineConfigs: stagger([
      { id: 'line-about-label', mode: 'block' },
      { id: 'line-sentence-1', mode: 'words' },
      { id: 'line-sentence-2', mode: 'words' },
      { id: 'line-sentence-3', mode: 'words' },
      { id: 'line-sentence-4', mode: 'words' },
      { id: 'line-sentence-5', mode: 'words' }
    ], 0.06, 0.075, 0.16)
  });
  if (aboutMeScene) scenes.push(aboutMeScene);

  // ---- Software & Skills: heading + 6 cards (7 lines) ----
  // range/exitStart must match .skills-scroll-track's CSS height (see css/style.css); recomputed
  // the same "preserve build, cut hold" way as the scenes above.
  var skillsScene = buildScene({
    trackId: 'skills-scroll-track',
    contentId: 'skills-content',
    range: 2226,
    exitStart: 0.673,
    lineConfigs: stagger([
      { id: 'line-skills-heading', mode: 'words' },
      { id: 'line-skill-1', mode: 'block' },
      { id: 'line-skill-2', mode: 'block' },
      { id: 'line-skill-3', mode: 'block' },
      { id: 'line-skill-4', mode: 'block' },
      { id: 'line-skill-5', mode: 'block' },
      { id: 'line-skill-6', mode: 'block' }
    ], 0.058, 0.07, 0.14)
  });
  if (skillsScene) {
    for (var s = 0; s < skillsScene.lines.length; s++) {
      var sLine = skillsScene.lines[s];
      if (sLine.el.classList.contains('skill-card')) sLine.onProgress = makeRingUpdater(sLine.el);
    }
    scenes.push(skillsScene);
  }

  // ---- Availability: heading + 3 items (4 lines) ----
  // range/exitStart must match .availability-scroll-track's CSS height (see css/style.css);
  // recomputed the same "preserve build, cut hold" way as the scenes above.
  var availabilityScene = buildScene({
    trackId: 'availability-scroll-track',
    contentId: 'availability-content',
    range: 1338,
    exitStart: 0.581,
    lineConfigs: stagger([
      { id: 'line-avail-heading', mode: 'words' },
      { id: 'line-avail-1', mode: 'block' },
      { id: 'line-avail-2', mode: 'block' },
      { id: 'line-avail-3', mode: 'block' }
    ], 0.06, 0.096, 0.167)
  });
  if (availabilityScene) scenes.push(availabilityScene);

  if (!scenes.length) return;

  var SCENE_LERP = 0.12; // calmer than the Blender scrub's 0.4 -- this is a reading-paced scene,
                          // not a scrub, closer to the hero's own 0.09 settle

  function updateTargets() {
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var top = scene.track.getBoundingClientRect().top + window.scrollY;
      scene.targetT = clamp((window.scrollY - top) / scene.range, 0, 1);
    }
  }
  window.addEventListener('scroll', updateTargets, { passive: true });
  window.addEventListener('resize', updateTargets);
  updateTargets();

  function loop() {
    for (var s2 = 0; s2 < scenes.length; s2++) {
      var scene = scenes[s2];
      scene.curT += (scene.targetT - scene.curT) * SCENE_LERP;
      var t = scene.curT;

      for (var i = 0; i < scene.lines.length; i++) {
        var line = scene.lines[i];
        var p = clamp((t - line.start) / (line.end - line.start), 0, 1);
        if (line.words) revealWords(line.words, p);
        else revealBlock(line.el, p);
        if (line.onProgress) line.onProgress(p);
      }

      // Group exit: the whole content container fades/blurs/lifts together as one unit, ending
      // fully hidden by t=1 -- children above are already individually at their revealed state by
      // then, so this reads as the entire built composition leaving together, not per-line.
      var ep = clamp((t - scene.exitStart) / (1 - scene.exitStart), 0, 1);
      var ee = easeInCubic(ep);
      scene.content.style.opacity = (1 - ee).toFixed(3);
      scene.content.style.filter = ee < 0.01 ? 'none' : 'blur(' + lerp(0, 14, ee).toFixed(2) + 'px)';
      scene.content.style.transform = 'translateY(' + lerp(0, -40, ee).toFixed(2) + 'px)';
    }
    requestAnimationFrame(loop);
  }
  loop();
}
