// ---- Prism: hero-scoped WebGL background -- a slow-wobbling raymarched glass prism, ported
// from React Bits' Prism (https://reactbits.dev/backgrounds/prism, OGL-based) onto this project's
// already-vendored Three.js so it follows the exact fullscreen-shader-pass convention the liquid
// glass module it replaces used. The raymarch itself (sdPyramidUpInv, the base-wobble matrix, the
// tanh tone-mapped accumulation) is a faithful port of the reference's default "rotate" mode --
// only two things are deliberately changed from the source:
//   1. color: the reference's raw output cycles through a full rainbow (sin-phase-offset RGBA).
//      That's recolored here into a fixed duotone ramp through this site's own violet/indigo
//      family (a luminance-only read of the original signal, so the shape/glow structure is
//      unchanged -- just its hue), with a small fraction of the original signal mixed back in for
//      a hint of prismatic sparkle at the brightest points. Fixed, not palette-driven: unlike the
//      liquid glass this replaces, nothing here reacts to the Work carousel's extracted colors, so
//      the hero's atmosphere never shifts underneath the visitor.
//   2. restraint: glow/bloom/noise/color-frequency/time-scale are all tuned down from the
//      reference's defaults, and the raymarch step count is cut from 100 to 64, so the effect
//      reads as calm ambient light behind the type rather than a showpiece, and stays cheap enough
//      to hold 60fps as a full-bleed hero layer.
import * as THREE from '../assets/vendor/three/three.module.min.js';

var VERT = [
  'void main() {',
  '  gl_Position = vec4(position.xy, 0.0, 1.0);',
  '}'
].join('\n');

var FRAG = [
  'precision highp float;',
  'uniform vec2  iResolution;',
  'uniform float iTime;',
  'uniform float uHeight;',
  'uniform float uCenterShift;',
  'uniform float uInvBaseHalf;',
  'uniform float uInvHeight;',
  'uniform float uMinAxis;',
  'uniform float uPxScale;',
  'uniform float uTimeScale;',
  'uniform float uGlow;',
  'uniform float uBloom;',
  'uniform float uColorFreq;',
  'uniform float uNoise;',
  'uniform float uAlphaMul;',

  // tone-mapping + hash noise, unchanged from the reference
  'vec4 tanh4(vec4 x){',
  '  vec4 e2x = exp(2.0 * x);',
  '  return (e2x - 1.0) / (e2x + 1.0);',
  '}',
  'float rand(vec2 co){',
  '  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);',
  '}',

  // signed distance to an inverted, anisotropic octahedron / upward pyramid -- the "prism" shape
  // itself, unchanged from the reference
  'float sdOctaAnisoInv(vec3 p){',
  '  vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);',
  '  float m = q.x + q.y + q.z - 1.0;',
  '  return m * uMinAxis * 0.5773502691896258;',
  '}',
  'float sdPyramidUpInv(vec3 p){',
  '  float oct = sdOctaAnisoInv(p);',
  '  return max(oct, -p.y);',
  '}',

  'void main(){',
  '  vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy) * uPxScale;',

  '  float z = 5.0;',
  '  float d = 0.0;',
  '  vec3 p;',
  '  vec4 o = vec4(0.0);',

  // base wobble -- the reference's default "rotate" mode never actually spins the shape (uRot
  // stays identity); all apparent motion comes from this slow shear of the p.xz plane, which is
  // exactly the calm "sway" this brief asks for rather than a spinning showpiece
  '  float wt = iTime * uTimeScale;',
  '  float c0 = cos(wt), c1 = cos(wt + 33.0), c2 = cos(wt + 11.0);',
  '  mat2 wob = mat2(c0, c1, c2, c0);',

  '  const int STEPS = 64;',
  '  for (int i = 0; i < STEPS; i++) {',
  '    p = vec3(f, z);',
  '    p.xz = p.xz * wob;',
  '    vec3 q = p;',
  '    q.y += uCenterShift;',
  '    d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));',
  '    z -= d;',
  '    o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;',
  '  }',

  '  o = tanh4(o * o * (uGlow * uBloom) / 1e5);',

  // recolor: discard the reference's raw rainbow hue, keep its luminance (the actual glow/shape
  // structure the raymarch produced) and read that through a fixed violet/indigo duotone ramp --
  // dark glass in the shadows, rich violet through the mid-tones, a soft lilac-white at the
  // brightest core. A thin slice of the original signal is mixed back in for a faint prismatic
  // sparkle rather than a flat single-hue fill.
  '  float L = clamp(dot(o.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);',
  '  vec3 rampDark = vec3(0.035, 0.024, 0.086);',
  '  vec3 rampMid  = vec3(0.298, 0.204, 0.706);',
  '  vec3 rampHigh = vec3(0.804, 0.741, 1.0);',
  '  vec3 duotone = mix(rampDark, rampMid, smoothstep(0.0, 0.55, L));',
  '  duotone = mix(duotone, rampHigh, smoothstep(0.55, 1.0, L));',
  '  vec3 col = mix(duotone, clamp(o.rgb, 0.0, 1.0), 0.1);',

  '  float n = rand(gl_FragCoord.xy + vec2(iTime));',
  '  col += (n - 0.5) * uNoise;',
  '  col = clamp(col, 0.0, 1.0);',

  '  gl_FragColor = vec4(col, o.a * uAlphaMul);',
  '}'
].join('\n');

export function createPrism(container, options) {
  var opts = Object.assign({
    height: 3.5,
    baseHalf: 2.75,
    scale: 3.6,
    glow: 0.6,
    bloom: 0.72,
    colorFreq: 0.55,
    noise: 0.24,
    timeScale: 0.22,
    alphaMul: 0.82
  }, options || {});

  var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.Camera(); // no projection needed; vertex shader writes clip space directly

  var geometry = new THREE.PlaneGeometry(2, 2);
  var H = opts.height, BH = opts.baseHalf;
  var material = new THREE.ShaderMaterial({
    uniforms: {
      iResolution: { value: new THREE.Vector2(1, 1) },
      iTime: { value: 0 },
      uHeight: { value: H },
      uCenterShift: { value: H * 0.25 },
      uInvBaseHalf: { value: 1 / BH },
      uInvHeight: { value: 1 / H },
      uMinAxis: { value: Math.min(BH, H) },
      uPxScale: { value: 1 },
      uTimeScale: { value: opts.timeScale },
      uGlow: { value: opts.glow },
      uBloom: { value: opts.bloom },
      uColorFreq: { value: opts.colorFreq },
      uNoise: { value: opts.noise },
      uAlphaMul: { value: opts.alphaMul }
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false
  });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // capped a little tighter than the site's other WebGL layers (1.75 vs 2) -- this is a full-bleed
  // 64-step-per-pixel raymarch, the heaviest shader on the page, so pixel count is the first knob
  // worth trimming to keep it cheap
  var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    var rect = container.getBoundingClientRect();
    var width = Math.max(1, Math.floor(rect.width));
    var height = Math.max(1, Math.floor(rect.height));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    var bw = renderer.domElement.width, bh = renderer.domElement.height;
    material.uniforms.iResolution.value.set(bw, bh);
    material.uniforms.uPxScale.value = 1 / ((bh || 1) * 0.1 * opts.scale);
  }
  resize();

  var rafId = null;
  var lastTick = performance.now();
  function render() {
    var now = performance.now();
    var dt = Math.min(0.1, (now - lastTick) / 1000);
    lastTick = now;
    material.uniforms.iTime.value += dt;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(render);
  }
  function pause() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }
  function start() {
    if (rafId) return;
    lastTick = performance.now();
    rafId = requestAnimationFrame(render);
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
    pause: pause,
    start: start,
    destroy: function () {
      pause();
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
