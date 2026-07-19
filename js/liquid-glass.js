// ---- Liquid Glass: a bespoke hero background material -- polished black glass with a sparse,
// slow-drifting patch of colored light moving underneath it, refracted through the glass rather
// than painted on top. Not a port of any single reference: the refraction/sheen idea borrows the
// *feeling* of Apple's Liquid Glass / Vision Pro materials, and the coverage/drift borrows only
// the *movement character* of React Bits' Aurora (https://reactbits.dev/backgrounds/aurora) --
// not its literal full-bleed colorful background. Built from scratch on this site's already-
// vendored Three.js as a single fullscreen shader pass:
//   1. fully transparent by default -- this canvas has no background color of its own. Where
//      there is no effect, it renders nothing at all, so the ONE real shared page background
//      (#ambient-bg's --ink + blobs, same everywhere else on the site) shows through unmodified.
//      There is deliberately no second "hero black" anywhere in this file.
//   2. a sparse, slow-drifting aurora-style coverage mask -- thresholded tightly so only a
//      minority of the frame ever carries color at any moment, never a full-frame gradient/wash
//   3. that coverage sampled through a refraction-warped UV (the "looking through glass" read --
//      color never sits flat on the surface)
//   4. a fresnel-style sheen + cursor light riding on top of the same refraction field
//   5. a soft edge fade so the effect always dissolves to fully transparent well before this
//      canvas's own edges -- never a hard-edged rectangle
// Colors are tinted/desaturated before use (real glass absorbs and mutes light passing through
// it) and applied instantly (no crossfade) whenever the active project changes -- entirely driven
// by the real extracted project palette, never a hardcoded value. Grain is intentionally NOT
// duplicated here -- the site already has a sitewide grain overlay (index.html's <svg
// class="grain">, z-index:900) sitting above this canvas, so adding a second one would be pure
// redundant cost for no visual gain.
import * as THREE from '../assets/vendor/three/three.module.min.js';

// Same color-management fix as the previous hero shader module: this vendored Three.js
// linearizes THREE.Color(hex) by default, which mixes colors in linear-light space and visibly
// shifts hue away from the CSS wash's plain sRGB interpretation. Disabling it keeps this module's
// hex-in -> pixel-out a direct passthrough, matching the wash exactly.
THREE.ColorManagement.enabled = false;

var VERT = [
  'varying vec2 vUv;',
  'void main() {',
  '  vUv = uv;',
  '  gl_Position = vec4(position.xy, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG = [
  'precision highp float;',
  'uniform vec3 uColorA;',
  'uniform vec3 uColorB;',
  'uniform vec3 uColorC;',
  'uniform float uTime;',
  'uniform vec2 uMouse;',      // aspect-corrected, centered, damped, roughly -1..1
  'uniform float uAspect;',
  'varying vec2 vUv;',

  'float hash(vec2 p) {',
  '  p = fract(p * vec2(123.34, 456.21));',
  '  p += dot(p, p + 45.32);',
  '  return fract(p.x * p.y);',
  '}',
  'float valueNoise(vec2 p) {',
  '  vec2 i = floor(p);',
  '  vec2 f = fract(p);',
  '  float a = hash(i);',
  '  float b = hash(i + vec2(1.0, 0.0));',
  '  float c = hash(i + vec2(0.0, 1.0));',
  '  float d = hash(i + vec2(1.0, 1.0));',
  '  vec2 u = f * f * (3.0 - 2.0 * f);',
  '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
  '}',
  'float fbm(vec2 p) {',
  '  float v = 0.0;',
  '  float amp = 0.5;',
  '  for (int i = 0; i < 4; i++) {',
  '    v += amp * valueNoise(p);',
  '    p *= 2.02;',
  '    amp *= 0.5;',
  '  }',
  '  return v;',
  '}',

  // real glass absorbs/mutes light passing through it -- pull each extracted color toward its
  // own luminance (partial desaturation) and cap brightness, so a vivid source photo can never
  // read as a neon/saturated background, only as tinted light
  'vec3 tint(vec3 c) {',
  '  float lum = dot(c, vec3(0.299, 0.587, 0.114));',
  '  vec3 muted = mix(c, vec3(lum), 0.3);',
  '  return min(muted, vec3(0.82));',
  '}',

  // 2D rotation, used only to give the light-ray term its own extremely slow drift -- a
  // different apparent "depth" than the color field/refraction below, without a second render
  // pass or a second uniform block: same trick as everything else here, just a different UV path
  // through the same noise.
  'vec2 rot(vec2 v, float a) {',
  '  float c = cos(a), s = sin(a);',
  '  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);',
  '}',

  'void main() {',
  '  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);',
  '  float t = uTime * 0.028;',

  // slow, low-frequency refraction field -- the "glass surface" itself. amplitude stays low:
  // this is optical distortion of what is behind the glass, not a wavy ocean.
  '  vec2 rn = vec2(fbm(p * 1.15 + t), fbm(p * 1.15 - t + 7.3));',
  '  vec2 refraction = (rn - 0.5) * 0.075;',

  // mouse: a single soft ripple centered on the damped cursor position, decaying with distance
  // and never additive enough to move color aggressively -- a nudge to the refraction field, not
  // a repaint
  '  float md = length(p - uMouse);',
  '  float ripple = exp(-md * 2.2) * sin(md * 9.0 - uTime * 1.1) * 0.028;',
  '  refraction += (p - uMouse) * ripple * 0.4;',

  // color read through the refracted UV -- large-scale, slow-moving bands so it reads as soft
  // light, not a busy pattern
  '  vec2 cp = (p + refraction) * 0.55 + t * 0.6;',
  '  float field1 = fbm(cp);',
  '  float field2 = fbm(cp * 1.4 - t * 0.4 + 3.1);',
  '  vec3 tA = tint(uColorA);',
  '  vec3 tB = tint(uColorB);',
  '  vec3 tC = tint(uColorC);',
  '  vec3 light = mix(tA, tB, smoothstep(0.25, 0.75, field1));',
  '  light = mix(light, tC, smoothstep(0.55, 0.95, field2) * 0.6);',

  // aurora-style coverage -- borrowed only for *how it moves* (see file header): a sparse,
  // very-slow-drifting patch, not a full-frame gradient. Sampled through the same refraction so it
  // still reads as light moving under glass, at a much lower frequency and much slower time rate
  // than the refraction/color-field above, then thresholded tightly (smoothstep over a narrow,
  // high band) so only a genuine minority of the frame ever carries any color -- most of the hero
  // stays exactly the shared page background, all the time.
  '  float auroraT = uTime * 0.01;',
  '  vec2 auroraP = p * 2.4 + refraction * 0.5 + vec2(auroraT, -auroraT * 0.7);',
  '  float auroraShape = fbm(auroraP);',
  '  float auroraMask = smoothstep(0.52, 0.68, auroraShape);',

  // atmospheric light rays -- soft, near-vertical shafts (low x-frequency banding, near-zero
  // y-frequency so each shaft runs the full frame height) sampled through their own slowly-
  // rotating UV. Deliberately not radial/point-sourced (that reads as an obvious "god ray"); an
  // independent, extremely faint whisper, not counted against the aurora patch's own coverage
  // budget above.
  '  float rayAngle = uTime * 0.006;',
  '  vec2 rp = rot(p + uMouse * 0.02, rayAngle);',
  '  float rayField = fbm(vec2(rp.x * 1.8, rp.y * 0.22 + t * 0.1));',
  '  float rayMask = smoothstep(0.5, 0.88, rayField);',

  // fresnel-style sheen, derived from the same refraction field so it reads as part of the glass
  // (a highlight the material itself is catching) rather than a decorative overlay
  '  float sheenMask = smoothstep(0.62, 1.0, fbm(p * 0.8 - t * 0.5 + 1.7));',
  '  float rim = pow(clamp(length(refraction) * 9.0, 0.0, 1.0), 2.0) * sheenMask;',

  // cursor light -- not a visible spotlight, just the glass catching a little more light where
  // the cursor sits. Very large radius (slow exp falloff vs. the ripple's own tighter one above),
  // added straight into the same rim/sheen term so it reads as "this material reflects more here,"
  // not as a second decorative glow layered on top.
  '  float spot = exp(-md * 1.1);',
  '  rim += spot * 0.35;',

  // presence -- fades this whole material to fully transparent well before the container's own
  // edges. `edgeY` is what specifically kills any seam at the hero/next-section boundary (p.y
  // spans exactly -0.5..0.5 across this container's own height, so edgeY reaches 0.0 at that real
  // edge, not just "eventually far off toward a corner"); `edgeX` does the same for the sides.
  '  float d = length(p);',
  '  float centerGlow = 1.0 - smoothstep(0.15, 1.05, d);',
  '  float edgeY = 1.0 - smoothstep(0.3, 0.5, abs(p.y));',
  '  float edgeX = 1.0 - smoothstep(uAspect * 0.32, uAspect * 0.5, abs(p.x));',
  '  float presence = centerGlow * edgeY * edgeX;',

  // composite -- transparent by default; alpha is the *only* thing that ever paints, and it stays
  // low throughout (hard-capped) so black reads first and color is always an accent, never a
  // wash. The sheen mixes toward white rather than adding brightness on top of `col`, so it reads
  // as a highlight riding on the aurora light rather than a separate glow.
  '  vec3 col = mix(light, vec3(1.0), clamp(rim * 0.35, 0.0, 1.0));',
  '  float strength = auroraMask * 0.9 + rayMask * 0.05 + rim * 0.12;',
  '  float alpha = presence * clamp(strength, 0.0, 0.22);',
  '  gl_FragColor = vec4(col, alpha);',
  '}'
].join('\n');

export function createLiquidGlass(container, options) {
  var opts = Object.assign({
    colors: ['#5227FF', '#FF9FFC'],
    mouseDamp: 0.03       // slow, heavy "inertia" -- the cursor should never feel snappy here
  }, options || {});

  // ---- 2-color extracted palette -> 3-color blend: same internal-derivation approach as the
  // wash's own deriveToneVariant() (an HSL hue/lightness nudge off the two real extracted
  // colors), purely a rendering choice inside this module -- not a second color source. ----
  function deriveThird(colorA, colorB) {
    var hslA = {}, hslB = {};
    colorA.getHSL(hslA);
    colorB.getHSL(hslB);
    var h = ((hslA.h + hslB.h) / 2 + 0.08) % 1;
    var s = Math.min(1, (hslA.s + hslB.s) / 2 + 0.08);
    var avgL = (hslA.l + hslB.l) / 2;
    var l = Math.max(0.1, Math.min(0.9, avgL + (avgL > 0.5 ? -0.22 : 0.22)));
    var out = new THREE.Color();
    out.setHSL(h < 0 ? h + 1 : h, s, l);
    return out;
  }
  function toColorTriple(hexArr) {
    var arr = Array.isArray(hexArr) && hexArr.length ? hexArr : ['#ffffff', '#ffffff'];
    if (arr.length === 1) arr = [arr[0], arr[0]];
    var a = new THREE.Color(arr[0]);
    var b = new THREE.Color(arr[1]);
    return [a, b, deriveThird(a, b)];
  }

  // Colors, rays, and reflections all read from the same three uniforms below, so they always
  // update in the same frame -- and instantly (no crossfade): the active project's palette should
  // be visible immediately, not mid-morph.
  function applyUniforms(triple) {
    material.uniforms.uColorA.value.copy(triple[0]);
    material.uniforms.uColorB.value.copy(triple[1]);
    material.uniforms.uColorC.value.copy(triple[2]);
  }
  function setColors(hexArr) {
    applyUniforms(toColorTriple(hexArr));
  }

  // ---- fullscreen orthographic quad -- deliberately not a tilted 3D plane: this is a
  // background *material*, not a scene object, and NDC-space rendering guarantees full,
  // undistorted coverage regardless of container size/aspect, with zero frustum/rotation risk. ----
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.Camera(); // no projection needed; vertex shader writes clip space directly

  var geometry = new THREE.PlaneGeometry(2, 2);
  var material = new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(opts.colors[0]) },
      uColorB: { value: new THREE.Color(opts.colors[1] || opts.colors[0]) },
      uColorC: { value: new THREE.Color(opts.colors[0]) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(2, 2) }, // parked off-frame until real input arrives
      uAspect: { value: 1 }
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  setColors(opts.colors);

  var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var rect = container.getBoundingClientRect();
    var width = Math.max(1, Math.floor(rect.width));
    var height = Math.max(1, Math.floor(rect.height));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    material.uniforms.uAspect.value = width / Math.max(1, height);
  }
  resize();

  // cursor tracked within the hero container only, converted into the same aspect-corrected,
  // centered space the fragment shader works in; heavily damped so it reads as slow optical
  // settling, never a snap
  var targetMouse = new THREE.Vector2(2, 2), curMouse = new THREE.Vector2(2, 2);
  var hasPointer = false;
  function onMouseMove(e) {
    var rect = container.getBoundingClientRect();
    var aspect = material.uniforms.uAspect.value;
    var nx = (e.clientX - rect.left) / rect.width - 0.5;
    var ny = (e.clientY - rect.top) / rect.height - 0.5;
    targetMouse.set(nx * aspect, -ny);
    hasPointer = true;
  }
  function onMouseLeave() {
    targetMouse.set(2, 2); // parked off-frame -- ripple term naturally decays to ~0
  }
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseleave', onMouseLeave);

  var isVisible = true;
  var rafId = null;
  var lastTick = performance.now();
  function render() {
    var now = performance.now();
    var dt = Math.min(0.1, (now - lastTick) / 1000);
    lastTick = now;

    if (hasPointer) curMouse.lerp(targetMouse, opts.mouseDamp);
    material.uniforms.uMouse.value.copy(curMouse);
    material.uniforms.uTime.value += dt;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(render);
  }
  function pause() {
    isVisible = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  function start() {
    if (isVisible && rafId) return;
    isVisible = true;
    lastTick = performance.now();
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  var ro = new ResizeObserver(resize);
  ro.observe(container);

  function inViewport() {
    var rect = container.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  }
  var io = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start(); else pause();
  }, { threshold: 0 });
  io.observe(container);

  function onVisibilityChange() {
    if (document.hidden) pause();
    else if (inViewport()) start();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  start();

  return {
    setColors: setColors,
    pause: pause,
    start: start,
    destroy: function () {
      pause();
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      ro.disconnect();
      io.disconnect();
      geometry.dispose();
      material.dispose();
      var canvas = renderer.domElement;
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
