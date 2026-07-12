// ---- Liquid Ether: vanilla port of React Bits' "Liquid Ether" background
// (https://reactbits.dev/backgrounds/liquid-ether) -- a real-time WebGL fluid simulation
// (Navier-Stokes-ish solver: advection w/ BFECC, external force, viscosity, divergence,
// Poisson pressure, pressure-gradient subtraction), ported out of its original React
// component into a plain factory function so it can be dropped into this site's classic-script
// architecture (see js/script.js, which dynamically imports this module exactly like it already
// dynamically imports pdf.js). The simulation/shader code below is a faithful, line-for-line
// port of the upstream component's logic -- only the React lifecycle (useEffect/useRef/props)
// was translated into closures/a returned API, and color handling was reworked (see setColors
// below) so a new palette can morph in smoothly instead of tearing down and rebuilding the
// entire WebGL context the way the original component does whenever its `colors` prop changes.
import * as THREE from '../assets/vendor/three/three.module.min.js';

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

export function createLiquidEther(container, options) {
  var opts = Object.assign({
    mouseForce: 18,
    cursorSize: 110,
    isViscous: false,
    viscous: 30,
    iterationsViscous: 32,
    iterationsPoisson: 32,
    dt: 0.014,
    BFECC: true,
    resolution: 0.5,
    isBounce: false,
    colors: ['#5227FF', '#FF9FFC'],
    autoDemo: true,
    autoSpeed: 0.35,
    autoIntensity: 1.6,
    takeoverDuration: 0.3,
    autoResumeDelay: 2500,
    autoRampDuration: 0.8,
    morphDuration: 1800 // ms -- how long a setColors() palette morph takes to fully resolve
  }, options || {});

  var rafRef = { current: null };
  var isVisible = true;

  // ---- palette texture: a small (2-texel) horizontal gradient, sampled in the color shader by
  // velocity magnitude (see color_frag below). Unlike the upstream component (which bakes a new
  // immutable texture from the `colors` prop and forces a full effect re-run whenever it
  // changes), this keeps one mutable texture alive for the component's entire lifetime and
  // rewrites its bytes every frame during a morph -- see setColors()/tickMorph() -- so switching
  // projects blends smoothly instead of popping or tearing down the GL context. ----
  var paletteWidth = 2;
  var paletteData = new Uint8Array(paletteWidth * 4);
  var paletteTex = new THREE.DataTexture(paletteData, paletteWidth, 1, THREE.RGBAFormat);
  paletteTex.magFilter = THREE.LinearFilter;
  paletteTex.minFilter = THREE.LinearFilter;
  paletteTex.wrapS = THREE.ClampToEdgeWrapping;
  paletteTex.wrapT = THREE.ClampToEdgeWrapping;
  paletteTex.generateMipmaps = false;

  var currentColors = null; // THREE.Color[2], the palette actually written to paletteData right now
  var fromColors = null, toColors = null, morphColors = null;
  var morphActive = false, morphStart = 0;

  function writePalette(colorsArr) {
    for (var i = 0; i < colorsArr.length; i++) {
      var c = colorsArr[i];
      paletteData[i * 4 + 0] = Math.round(c.r * 255);
      paletteData[i * 4 + 1] = Math.round(c.g * 255);
      paletteData[i * 4 + 2] = Math.round(c.b * 255);
      paletteData[i * 4 + 3] = 255;
    }
    paletteTex.needsUpdate = true;
  }

  function toColorPair(hexArr) {
    var arr = Array.isArray(hexArr) && hexArr.length ? hexArr : ['#ffffff', '#ffffff'];
    if (arr.length === 1) arr = [arr[0], arr[0]];
    return [new THREE.Color(arr[0]), new THREE.Color(arr[1])];
  }

  function setColors(hexArr, setOpts) {
    var next = toColorPair(hexArr);
    if (!currentColors || (setOpts && setOpts.instant)) {
      currentColors = next;
      morphActive = false;
      writePalette(currentColors);
      return;
    }
    fromColors = currentColors.map(function (c) { return c.clone(); });
    toColors = next;
    morphColors = next.map(function (c) { return c.clone(); });
    morphStart = performance.now();
    morphActive = true;
  }

  function tickMorph() {
    if (!morphActive) return;
    var p = Math.min(1, (performance.now() - morphStart) / opts.morphDuration);
    var e = easeInOutCubic(p);
    for (var i = 0; i < toColors.length; i++) {
      morphColors[i].copy(fromColors[i]).lerp(toColors[i], e);
    }
    writePalette(morphColors);
    if (p >= 1) {
      currentColors = toColors;
      morphActive = false;
    }
  }

  writePalette(toColorPair(opts.colors));
  currentColors = toColorPair(opts.colors);

  var bgVec4 = new THREE.Vector4(0, 0, 0, 0); // always transparent -- lets the site's own
  // ambient-bg layers (blobs, --ink base) show through wherever the fluid has no dye

  // ==== the simulation itself -- faithful port, see file header ====
  class CommonClass {
    constructor() {
      this.width = 0; this.height = 0; this.aspect = 1; this.pixelRatio = 1;
      this.time = 0; this.delta = 0; this.container = null; this.renderer = null; this._lastTick = 0;
    }
    init(el) {
      this.container = el;
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      this.resize();
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.autoClear = false;
      this.renderer.setClearColor(new THREE.Color(0x000000), 0);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.width, this.height);
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';
      this._lastTick = performance.now();
    }
    resize() {
      if (!this.container) return;
      var rect = this.container.getBoundingClientRect();
      this.width = Math.max(1, Math.floor(rect.width));
      this.height = Math.max(1, Math.floor(rect.height));
      this.aspect = this.width / this.height;
      if (this.renderer) this.renderer.setSize(this.width, this.height, false);
    }
    update() {
      // manual delta timing (THREE.Clock is deprecated as of the vendored three.js build) --
      // clamp the first/post-pause tick so a long gap (e.g. resuming after a hidden tab) never
      // produces a single huge simulation step
      var now = performance.now();
      this.delta = Math.min(0.1, (now - this._lastTick) / 1000);
      this._lastTick = now;
      this.time += this.delta;
    }
  }
  var Common = new CommonClass();

  class MouseClass {
    constructor() {
      this.mouseMoved = false;
      this.coords = new THREE.Vector2(); this.coords_old = new THREE.Vector2(); this.diff = new THREE.Vector2();
      this.timer = null; this.container = null; this.docTarget = null; this.listenerTarget = null;
      this.isHoverInside = false; this.hasUserControl = false; this.isAutoActive = false;
      this.autoIntensity = 2.0; this.takeoverActive = false; this.takeoverStartTime = 0;
      this.takeoverDuration = 0.25;
      this.takeoverFrom = new THREE.Vector2(); this.takeoverTo = new THREE.Vector2();
      this.onInteract = null;
      this._onMouseMove = this.onDocumentMouseMove.bind(this);
      this._onTouchStart = this.onDocumentTouchStart.bind(this);
      this._onTouchMove = this.onDocumentTouchMove.bind(this);
      this._onTouchEnd = this.onTouchEnd.bind(this);
      this._onDocumentLeave = this.onDocumentLeave.bind(this);
    }
    init(el) {
      this.container = el;
      this.docTarget = el.ownerDocument || null;
      var defaultView = (this.docTarget && this.docTarget.defaultView) || window;
      if (!defaultView) return;
      this.listenerTarget = defaultView;
      this.listenerTarget.addEventListener('mousemove', this._onMouseMove);
      this.listenerTarget.addEventListener('touchstart', this._onTouchStart, { passive: true });
      this.listenerTarget.addEventListener('touchmove', this._onTouchMove, { passive: true });
      this.listenerTarget.addEventListener('touchend', this._onTouchEnd);
      if (this.docTarget) this.docTarget.addEventListener('mouseleave', this._onDocumentLeave);
    }
    dispose() {
      if (this.listenerTarget) {
        this.listenerTarget.removeEventListener('mousemove', this._onMouseMove);
        this.listenerTarget.removeEventListener('touchstart', this._onTouchStart);
        this.listenerTarget.removeEventListener('touchmove', this._onTouchMove);
        this.listenerTarget.removeEventListener('touchend', this._onTouchEnd);
      }
      if (this.docTarget) this.docTarget.removeEventListener('mouseleave', this._onDocumentLeave);
      this.listenerTarget = null; this.docTarget = null; this.container = null;
    }
    isPointInside(clientX, clientY) {
      if (!this.container) return false;
      var rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }
    updateHoverState(clientX, clientY) { this.isHoverInside = this.isPointInside(clientX, clientY); return this.isHoverInside; }
    setCoords(x, y) {
      if (!this.container) return;
      if (this.timer) window.clearTimeout(this.timer);
      var rect = this.container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      var nx = (x - rect.left) / rect.width, ny = (y - rect.top) / rect.height;
      this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
      this.mouseMoved = true;
      var self = this;
      this.timer = window.setTimeout(function () { self.mouseMoved = false; }, 100);
    }
    setNormalized(nx, ny) { this.coords.set(nx, ny); this.mouseMoved = true; }
    onDocumentMouseMove(event) {
      if (!this.updateHoverState(event.clientX, event.clientY)) return;
      if (this.onInteract) this.onInteract();
      if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
        if (!this.container) return;
        var rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        var nx = (event.clientX - rect.left) / rect.width, ny = (event.clientY - rect.top) / rect.height;
        this.takeoverFrom.copy(this.coords);
        this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
        this.takeoverStartTime = performance.now();
        this.takeoverActive = true; this.hasUserControl = true; this.isAutoActive = false;
        return;
      }
      this.setCoords(event.clientX, event.clientY);
      this.hasUserControl = true;
    }
    onDocumentTouchStart(event) {
      if (event.touches.length !== 1) return;
      var t = event.touches[0];
      if (!this.updateHoverState(t.clientX, t.clientY)) return;
      if (this.onInteract) this.onInteract();
      this.setCoords(t.clientX, t.clientY);
      this.hasUserControl = true;
    }
    onDocumentTouchMove(event) {
      if (event.touches.length !== 1) return;
      var t = event.touches[0];
      if (!this.updateHoverState(t.clientX, t.clientY)) return;
      if (this.onInteract) this.onInteract();
      this.setCoords(t.clientX, t.clientY);
    }
    onTouchEnd() { this.isHoverInside = false; }
    onDocumentLeave() { this.isHoverInside = false; }
    update() {
      if (this.takeoverActive) {
        var t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
        if (t >= 1) {
          this.takeoverActive = false;
          this.coords.copy(this.takeoverTo);
          this.coords_old.copy(this.coords);
          this.diff.set(0, 0);
        } else {
          var k = t * t * (3 - 2 * t);
          this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
        }
      }
      this.diff.subVectors(this.coords, this.coords_old);
      this.coords_old.copy(this.coords);
      if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
      if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
    }
  }
  var Mouse = new MouseClass();

  class AutoDriver {
    constructor(mouse, manager, driverOpts) {
      this.mouse = mouse; this.manager = manager;
      this.enabled = driverOpts.enabled; this.speed = driverOpts.speed;
      this.resumeDelay = driverOpts.resumeDelay || 3000;
      this.rampDurationMs = (driverOpts.rampDuration || 0) * 1000;
      this.active = false; this.current = new THREE.Vector2(0, 0); this.target = new THREE.Vector2();
      this.lastTime = performance.now(); this.activationTime = 0; this.margin = 0.2;
      this._tmpDir = new THREE.Vector2();
      this.pickNewTarget();
    }
    pickNewTarget() {
      var r = Math.random;
      this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
    }
    forceStop() { this.active = false; this.mouse.isAutoActive = false; }
    update() {
      if (!this.enabled) return;
      var now = performance.now();
      var idle = now - this.manager.lastUserInteraction;
      if (idle < this.resumeDelay) { if (this.active) this.forceStop(); return; }
      if (this.mouse.isHoverInside) { if (this.active) this.forceStop(); return; }
      if (!this.active) { this.active = true; this.current.copy(this.mouse.coords); this.lastTime = now; this.activationTime = now; }
      if (!this.active) return;
      this.mouse.isAutoActive = true;
      var dtSec = (now - this.lastTime) / 1000;
      this.lastTime = now;
      if (dtSec > 0.2) dtSec = 0.016;
      var dir = this._tmpDir.subVectors(this.target, this.current);
      var dist = dir.length();
      if (dist < 0.01) { this.pickNewTarget(); return; }
      dir.normalize();
      var ramp = 1;
      if (this.rampDurationMs > 0) {
        var t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
        ramp = t * t * (3 - 2 * t);
      }
      var step = this.speed * dtSec * ramp;
      var move = Math.min(step, dist);
      this.current.addScaledVector(dir, move);
      this.mouse.setNormalized(this.current.x, this.current.y);
    }
  }

  var face_vert = '\n  attribute vec3 position;\n  uniform vec2 px;\n  uniform vec2 boundarySpace;\n  varying vec2 uv;\n  precision highp float;\n  void main(){\n  vec3 pos = position;\n  vec2 scale = 1.0 - boundarySpace * 2.0;\n  pos.xy = pos.xy * scale;\n  uv = vec2(0.5)+(pos.xy)*0.5;\n  gl_Position = vec4(pos, 1.0);\n}\n';
  var line_vert = '\n  attribute vec3 position;\n  uniform vec2 px;\n  precision highp float;\n  varying vec2 uv;\n  void main(){\n  vec3 pos = position;\n  uv = 0.5 + pos.xy * 0.5;\n  vec2 n = sign(pos.xy);\n  pos.xy = abs(pos.xy) - px * 1.0;\n  pos.xy *= n;\n  gl_Position = vec4(pos, 1.0);\n}\n';
  var mouse_vert = '\n    precision highp float;\n    attribute vec3 position;\n    attribute vec2 uv;\n    uniform vec2 center;\n    uniform vec2 scale;\n    uniform vec2 px;\n    varying vec2 vUv;\n    void main(){\n    vec2 pos = position.xy * scale * 2.0 * px + center;\n    vUv = uv;\n    gl_Position = vec4(pos, 0.0, 1.0);\n}\n';
  var advection_frag = '\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform float dt;\n    uniform bool isBFECC;\n    uniform vec2 fboSize;\n    uniform vec2 px;\n    varying vec2 uv;\n    void main(){\n    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;\n    if(isBFECC == false){\n        vec2 vel = texture2D(velocity, uv).xy;\n        vec2 uv2 = uv - vel * dt * ratio;\n        vec2 newVel = texture2D(velocity, uv2).xy;\n        gl_FragColor = vec4(newVel, 0.0, 0.0);\n    } else {\n        vec2 spot_new = uv;\n        vec2 vel_old = texture2D(velocity, uv).xy;\n        vec2 spot_old = spot_new - vel_old * dt * ratio;\n        vec2 vel_new1 = texture2D(velocity, spot_old).xy;\n        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;\n        vec2 error = spot_new2 - spot_new;\n        vec2 spot_new3 = spot_new - error / 2.0;\n        vec2 vel_2 = texture2D(velocity, spot_new3).xy;\n        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;\n        vec2 newVel2 = texture2D(velocity, spot_old2).xy; \n        gl_FragColor = vec4(newVel2, 0.0, 0.0);\n    }\n}\n';
  var color_frag = '\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform sampler2D palette;\n    uniform vec4 bgColor;\n    varying vec2 uv;\n    void main(){\n    vec2 vel = texture2D(velocity, uv).xy;\n    float lenv = clamp(length(vel), 0.0, 1.0);\n    vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;\n    vec3 outRGB = mix(bgColor.rgb, c, lenv);\n    float outA = mix(bgColor.a, 1.0, lenv);\n    gl_FragColor = vec4(outRGB, outA);\n}\n';
  var divergence_frag = '\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform float dt;\n    uniform vec2 px;\n    varying vec2 uv;\n    void main(){\n    float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;\n    float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;\n    float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;\n    float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;\n    float divergence = (x1 - x0 + y1 - y0) / 2.0;\n    gl_FragColor = vec4(divergence / dt);\n}\n';
  var externalForce_frag = '\n    precision highp float;\n    uniform vec2 force;\n    uniform vec2 center;\n    uniform vec2 scale;\n    uniform vec2 px;\n    varying vec2 vUv;\n    void main(){\n    vec2 circle = (vUv - 0.5) * 2.0;\n    float d = 1.0 - min(length(circle), 1.0);\n    d *= d;\n    gl_FragColor = vec4(force * d, 0.0, 1.0);\n}\n';
  var poisson_frag = '\n    precision highp float;\n    uniform sampler2D pressure;\n    uniform sampler2D divergence;\n    uniform vec2 px;\n    varying vec2 uv;\n    void main(){\n    float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;\n    float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;\n    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;\n    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;\n    float div = texture2D(divergence, uv).r;\n    float newP = (p0 + p1 + p2 + p3) / 4.0 - div;\n    gl_FragColor = vec4(newP);\n}\n';
  var pressure_frag = '\n    precision highp float;\n    uniform sampler2D pressure;\n    uniform sampler2D velocity;\n    uniform vec2 px;\n    uniform float dt;\n    varying vec2 uv;\n    void main(){\n    float step = 1.0;\n    float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;\n    float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;\n    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;\n    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;\n    vec2 v = texture2D(velocity, uv).xy;\n    vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;\n    v = v - gradP * dt;\n    gl_FragColor = vec4(v, 0.0, 1.0);\n}\n';
  var viscous_frag = '\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform sampler2D velocity_new;\n    uniform float v;\n    uniform vec2 px;\n    uniform float dt;\n    varying vec2 uv;\n    void main(){\n    vec2 old = texture2D(velocity, uv).xy;\n    vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;\n    vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;\n    vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;\n    vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;\n    vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);\n    newv /= 4.0 * (1.0 + v * dt);\n    gl_FragColor = vec4(newv, 0.0, 0.0);\n}\n';

  class ShaderPass {
    constructor(props) {
      this.props = props || {};
      this.uniforms = this.props.material && this.props.material.uniforms;
      this.scene = null; this.camera = null; this.material = null; this.geometry = null; this.plane = null;
    }
    init() {
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      if (this.uniforms) {
        this.material = new THREE.RawShaderMaterial(this.props.material);
        this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
      }
    }
    update() {
      Common.renderer.setRenderTarget(this.props.output || null);
      Common.renderer.render(this.scene, this.camera);
      Common.renderer.setRenderTarget(null);
    }
  }

  class Advection extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert, fragmentShader: advection_frag,
          uniforms: {
            boundarySpace: { value: simProps.cellScale }, px: { value: simProps.cellScale },
            fboSize: { value: simProps.fboSize }, velocity: { value: simProps.src.texture },
            dt: { value: simProps.dt }, isBFECC: { value: true }
          }
        },
        output: simProps.dst
      });
      this.uniforms = this.props.material.uniforms;
      this.init();
    }
    init() { super.init(); this.createBoundary(); }
    createBoundary() {
      var boundaryG = new THREE.BufferGeometry();
      var vertices_boundary = new Float32Array([-1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0]);
      boundaryG.setAttribute('position', new THREE.BufferAttribute(vertices_boundary, 3));
      var boundaryM = new THREE.RawShaderMaterial({ vertexShader: line_vert, fragmentShader: advection_frag, uniforms: this.uniforms });
      this.line = new THREE.LineSegments(boundaryG, boundaryM);
      this.scene.add(this.line);
    }
    update(p) {
      this.uniforms.dt.value = p.dt;
      this.line.visible = p.isBounce;
      this.uniforms.isBFECC.value = p.BFECC;
      super.update();
    }
  }

  class ExternalForce extends ShaderPass {
    constructor(simProps) { super({ output: simProps.dst }); this.init(simProps); }
    init(simProps) {
      super.init();
      var mouseG = new THREE.PlaneGeometry(1, 1);
      var mouseM = new THREE.RawShaderMaterial({
        vertexShader: mouse_vert, fragmentShader: externalForce_frag,
        blending: THREE.AdditiveBlending, depthWrite: false,
        uniforms: {
          px: { value: simProps.cellScale }, force: { value: new THREE.Vector2(0.0, 0.0) },
          center: { value: new THREE.Vector2(0.0, 0.0) },
          scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
        }
      });
      this.mouse = new THREE.Mesh(mouseG, mouseM);
      this.scene.add(this.mouse);
    }
    update(p) {
      var forceX = (Mouse.diff.x / 2) * p.mouse_force;
      var forceY = (Mouse.diff.y / 2) * p.mouse_force;
      var cursorSizeX = p.cursor_size * p.cellScale.x;
      var cursorSizeY = p.cursor_size * p.cellScale.y;
      var centerX = Math.min(Math.max(Mouse.coords.x, -1 + cursorSizeX + p.cellScale.x * 2), 1 - cursorSizeX - p.cellScale.x * 2);
      var centerY = Math.min(Math.max(Mouse.coords.y, -1 + cursorSizeY + p.cellScale.y * 2), 1 - cursorSizeY - p.cellScale.y * 2);
      var uniforms = this.mouse.material.uniforms;
      uniforms.force.value.set(forceX, forceY);
      uniforms.center.value.set(centerX, centerY);
      uniforms.scale.value.set(p.cursor_size, p.cursor_size);
      super.update();
    }
  }

  class Viscous extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert, fragmentShader: viscous_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace }, velocity: { value: simProps.src.texture },
            velocity_new: { value: simProps.dst_.texture }, v: { value: simProps.viscous },
            px: { value: simProps.cellScale }, dt: { value: simProps.dt }
          }
        },
        output: simProps.dst, output0: simProps.dst_, output1: simProps.dst
      });
      this.init();
    }
    update(p) {
      var fbo_in, fbo_out;
      this.uniforms.v.value = p.viscous;
      for (var i = 0; i < p.iterations; i++) {
        if (i % 2 === 0) { fbo_in = this.props.output0; fbo_out = this.props.output1; }
        else { fbo_in = this.props.output1; fbo_out = this.props.output0; }
        this.uniforms.velocity_new.value = fbo_in.texture;
        this.props.output = fbo_out;
        this.uniforms.dt.value = p.dt;
        super.update();
      }
      return fbo_out;
    }
  }

  class Divergence extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert, fragmentShader: divergence_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace }, velocity: { value: simProps.src.texture },
            px: { value: simProps.cellScale }, dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      });
      this.init();
    }
    update(p) { this.uniforms.velocity.value = p.vel.texture; super.update(); }
  }

  class Poisson extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert, fragmentShader: poisson_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace }, pressure: { value: simProps.dst_.texture },
            divergence: { value: simProps.src.texture }, px: { value: simProps.cellScale }
          }
        },
        output: simProps.dst, output0: simProps.dst_, output1: simProps.dst
      });
      this.init();
    }
    update(p) {
      var p_in, p_out;
      for (var i = 0; i < p.iterations; i++) {
        if (i % 2 === 0) { p_in = this.props.output0; p_out = this.props.output1; }
        else { p_in = this.props.output1; p_out = this.props.output0; }
        this.uniforms.pressure.value = p_in.texture;
        this.props.output = p_out;
        super.update();
      }
      return p_out;
    }
  }

  class Pressure extends ShaderPass {
    constructor(simProps) {
      super({
        material: {
          vertexShader: face_vert, fragmentShader: pressure_frag,
          uniforms: {
            boundarySpace: { value: simProps.boundarySpace }, pressure: { value: simProps.src_p.texture },
            velocity: { value: simProps.src_v.texture }, px: { value: simProps.cellScale }, dt: { value: simProps.dt }
          }
        },
        output: simProps.dst
      });
      this.init();
    }
    update(p) {
      this.uniforms.velocity.value = p.vel.texture;
      this.uniforms.pressure.value = p.pressure.texture;
      super.update();
    }
  }

  class Simulation {
    constructor(simOptions) {
      this.options = Object.assign({
        iterations_poisson: 32, iterations_viscous: 32, mouse_force: 20, resolution: 0.5,
        cursor_size: 100, viscous: 30, isBounce: false, dt: 0.014, isViscous: false, BFECC: true
      }, simOptions);
      this.fbos = { vel_0: null, vel_1: null, vel_viscous0: null, vel_viscous1: null, div: null, pressure_0: null, pressure_1: null };
      this.fboSize = new THREE.Vector2();
      this.cellScale = new THREE.Vector2();
      this.boundarySpace = new THREE.Vector2();
      this.init();
    }
    init() { this.calcSize(); this.createAllFBO(); this.createShaderPass(); }
    getFloatType() {
      var isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
      return isIOS ? THREE.HalfFloatType : THREE.FloatType;
    }
    createAllFBO() {
      var type = this.getFloatType();
      var fboOpts = {
        type: type, depthBuffer: false, stencilBuffer: false,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping
      };
      for (var key in this.fbos) this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, fboOpts);
    }
    createShaderPass() {
      this.advection = new Advection({ cellScale: this.cellScale, fboSize: this.fboSize, dt: this.options.dt, src: this.fbos.vel_0, dst: this.fbos.vel_1 });
      this.externalForce = new ExternalForce({ cellScale: this.cellScale, cursor_size: this.options.cursor_size, dst: this.fbos.vel_1 });
      this.viscous = new Viscous({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, viscous: this.options.viscous, src: this.fbos.vel_1, dst: this.fbos.vel_viscous1, dst_: this.fbos.vel_viscous0, dt: this.options.dt });
      this.divergence = new Divergence({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.vel_viscous0, dst: this.fbos.div, dt: this.options.dt });
      this.poisson = new Poisson({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src: this.fbos.div, dst: this.fbos.pressure_1, dst_: this.fbos.pressure_0 });
      this.pressure = new Pressure({ cellScale: this.cellScale, boundarySpace: this.boundarySpace, src_p: this.fbos.pressure_0, src_v: this.fbos.vel_viscous0, dst: this.fbos.vel_0, dt: this.options.dt });
    }
    calcSize() {
      var width = Math.max(1, Math.round(this.options.resolution * Common.width));
      var height = Math.max(1, Math.round(this.options.resolution * Common.height));
      this.cellScale.set(1.0 / width, 1.0 / height);
      this.fboSize.set(width, height);
    }
    resize() {
      this.calcSize();
      for (var key in this.fbos) this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
    }
    update() {
      if (this.options.isBounce) this.boundarySpace.set(0, 0);
      else this.boundarySpace.copy(this.cellScale);
      this.advection.update({ dt: this.options.dt, isBounce: this.options.isBounce, BFECC: this.options.BFECC });
      this.externalForce.update({ cursor_size: this.options.cursor_size, mouse_force: this.options.mouse_force, cellScale: this.cellScale });
      var vel = this.fbos.vel_1;
      if (this.options.isViscous) {
        vel = this.viscous.update({ viscous: this.options.viscous, iterations: this.options.iterations_viscous, dt: this.options.dt });
      }
      this.divergence.update({ vel: vel });
      var pressure = this.poisson.update({ iterations: this.options.iterations_poisson });
      this.pressure.update({ vel: vel, pressure: pressure });
    }
  }

  class Output {
    constructor() { this.init(); }
    init() {
      this.simulation = new Simulation({
        iterations_poisson: opts.iterationsPoisson, iterations_viscous: opts.iterationsViscous,
        mouse_force: opts.mouseForce, resolution: opts.resolution, cursor_size: opts.cursorSize,
        viscous: opts.viscous, isBounce: opts.isBounce, dt: opts.dt, isViscous: opts.isViscous, BFECC: opts.BFECC
      });
      this.scene = new THREE.Scene();
      this.camera = new THREE.Camera();
      this.output = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.RawShaderMaterial({
          vertexShader: face_vert, fragmentShader: color_frag, transparent: true, depthWrite: false,
          uniforms: {
            velocity: { value: this.simulation.fbos.vel_0.texture },
            boundarySpace: { value: new THREE.Vector2() },
            palette: { value: paletteTex },
            bgColor: { value: bgVec4 }
          }
        })
      );
      this.scene.add(this.output);
    }
    resize() { this.simulation.resize(); }
    render() { Common.renderer.setRenderTarget(null); Common.renderer.render(this.scene, this.camera); }
    update() { this.simulation.update(); this.render(); }
  }

  // ==== manager: drives the render loop, owns visibility/resize handling ====
  var lastUserInteraction = performance.now();
  var running = false;
  var output = null;
  var autoDriver = null;

  function loop() {
    if (!running) return;
    if (autoDriver) autoDriver.update();
    Mouse.update();
    Common.update();
    tickMorph();
    output.update();
    rafRef.current = requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; Common._lastTick = performance.now(); loop(); }
  function pause() { running = false; if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } }

  Common.init(container);
  Mouse.init(container);
  Mouse.autoIntensity = opts.autoIntensity;
  Mouse.takeoverDuration = opts.takeoverDuration;
  Mouse.onInteract = function () {
    lastUserInteraction = performance.now();
    if (autoDriver) autoDriver.forceStop();
  };
  autoDriver = new AutoDriver(Mouse, { lastUserInteraction: lastUserInteraction }, {
    enabled: opts.autoDemo, speed: opts.autoSpeed, resumeDelay: opts.autoResumeDelay, rampDuration: opts.autoRampDuration
  });
  // AutoDriver reads manager.lastUserInteraction live -- keep it pointed at a live accessor
  // rather than the number captured above, since Mouse.onInteract updates the outer variable
  autoDriver.manager = { get lastUserInteraction() { return lastUserInteraction; } };

  container.prepend(Common.renderer.domElement);
  output = new Output();

  var onResize = function () { Common.resize(); output.resize(); };
  window.addEventListener('resize', onResize);

  var onVisibility = function () {
    if (document.hidden) pause();
    else if (isVisible) start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  var io = new IntersectionObserver(function (entries) {
    var entry = entries[0];
    isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
    if (isVisible && !document.hidden) start(); else pause();
  }, { threshold: [0, 0.01, 0.1] });
  io.observe(container);

  var resizeRaf = null;
  var ro = new ResizeObserver(function () {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(onResize);
  });
  ro.observe(container);

  start();

  return {
    setColors: setColors,
    pause: pause,
    start: start,
    destroy: function () {
      pause();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io.disconnect();
      ro.disconnect();
      Mouse.dispose();
      var canvas = Common.renderer.domElement;
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      Common.renderer.dispose();
      Common.renderer.forceContextLoss();
    }
  };
}
