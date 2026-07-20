// ---- Setup ----
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var header = document.getElementById('site-header');
var frameTop = document.getElementById('frame-top');
var frameBottom = document.getElementById('frame-bottom');

// ---- Work: fully data-driven project model ----
// Add a project by editing PROJECTS only. Cards, the layered exhibition gallery and the
// video page are all generated from this array -- no HTML or CSS edits are ever required.
// image projects: { type:'image', images: <count> }
// video projects:  { type:'video', supporting: <count of extra images/videos below the video> }
var PROJECTS = [
  { id: 'linka',        title: 'LinkA — E-Dating App',    category: 'UI / UX',            year: '2026', size: 'lg', type: 'image',
    cover: 'assets/projects/linka/cover.jpg',
    images: [
      'assets/projects/linka/plate-01.jpg',
      'assets/projects/linka/plate-02.jpg',
      'assets/projects/linka/plate-03.jpg',
      'assets/projects/linka/plate-04.jpg',
      'assets/projects/linka/plate-05.jpg',
      'assets/projects/linka/plate-06.jpg'
    ] },
  // `pdf` projects have no `cover`/`images` -- the cover (page 1) and every following page
  // (the gallery, in order) are rendered live from the PDF itself in the visitor's browser
  // (see loadPdfjs()/renderPdfPageToUrl() below), so adding pages to the file is the only step
  // ever needed; nothing here or in the gallery-building code has to change. `extraImages` are
  // static plates appended to the gallery after the PDF pages, in array order.
  { id: 'white-noise',  title: 'WHITE NOISE',             category: 'Book Cover',        year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/white-noise/white-noise.pdf',
    extraImages: [
      'assets/projects/white-noise/bookcover-mockup.jpg'
    ] },
  { id: 'kanye-west',   title: 'KANYE WEST',              category: 'Editorial Design',  year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/kanye-west/kanye-west.pdf' },
  { id: 'breaking-the-grid', title: 'BREAKING THE GRID',  category: 'Swiss Style',       year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/breaking-the-grid/breaking-the-grid.pdf' },
  { id: 'didot-specimen', title: 'DIDOT TYPE SPECIMEN',  category: 'Typography',        year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/didot-specimen/didot-specimen.pdf',
    pdfPagesInGallery: false, // cover still renders from PDF page 1 as normal; the PDF's other
    // pages (a case-study deck, not gallery plates) are excluded -- gallery is extraImages only
    extraImages: [
      'assets/projects/didot-specimen/didot-type-specimen.jpg'
    ] },
  // `videoPreview` opts a video project into a hover-to-play carousel preview (a muted, looping
  // <video> in place of the static cover -- see buildProjectCard()/the card hover handlers below)
  // instead of the default tone-gradient-plus-play-icon card every other video project uses.
  { id: 'reach',         title: 'REACH',                   category: 'Animation / Music Video', year: '2026', size: 'md', type: 'video',
    videoPreview: 'assets/projects/reach/reach-preview.mp4',
    video: 'assets/projects/reach/reach-full.mp4' },
  { id: 'fight-club-titles', title: 'FIGHT CLUB — Title Sequence', category: 'Motion / Title Design', year: '2026', size: 'md', type: 'video',
    // same single file for both -- `videoPreview` and `video` don't have to differ, the preview
    // mechanism only ever plays/loops/resets it silently in the card, independent of the full,
    // controls-enabled playback `buildVideo()` renders once the project is actually opened
    videoPreview: 'assets/projects/fight-club-titles/fight-club-titles.mp4',
    video: 'assets/projects/fight-club-titles/fight-club-titles.mp4' },
  { id: 'unknown-place', title: 'UNKNOWN PLACE',   category: 'Book Cover',        year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/unknown-place/unknown-place.pdf', // cover only (1 page) -- no gallery
    pdfPagesInGallery: false, // plates of its own; the gallery comes entirely from autoImages below
    // `photo1.jpeg` is the first gallery plate; `autoImages` probes `photo2`, `photo3`, ... in the
    // browser (see loadAutoImageSequence() above) so dropping more `photoN` files into this
    // project's folder later adds them to the gallery in filename order with zero code changes
    autoImages: { dir: 'assets/projects/unknown-place/', prefix: 'photo', start: 1,
      extensions: ['jpeg', 'jpg', 'png', 'webp'] } },
  { id: 'fight-club-soap', title: 'Fight Club Soap', category: '3D Product Visualization', year: '2026', size: 'md', type: 'video',
    description: 'A cinematic 3D recreation of the iconic Fight Club soap, modeled, textured and rendered in Blender with a focus on realistic materials, lighting and presentation.',
    videoPreview: 'assets/projects/fight-club-soap/fight-club-soap.mp4',
    video: 'assets/projects/fight-club-soap/fight-club-soap.mp4' },
  { id: 'scarface', title: 'SCARFACE', category: 'Alternative Film Poster', year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/scarface/main-photo.pdf', // cover only (1 page) -- no gallery pages of its own
    pdfPagesInGallery: false, // the gallery is the one real artwork plate below, not this cover
    extraImages: [
      'assets/projects/scarface/scarface-artwork.jpg'
    ] },
  { id: 'messi', title: 'MESSI', category: 'Illustration', year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/messi/main-photo.pdf', // cover only (1 page) -- no gallery pages of its own
    pdfPagesInGallery: false, // the gallery is the one real artwork plate below, not this cover
    extraImages: [
      'assets/projects/messi/messi-artwork.jpg'
    ] }
];

// deterministic gradient palette -- every tone used anywhere (cards, gallery plates, supporting
// media) comes from this cycle by index, so adding projects/images never needs new CSS
var TONE_PALETTE = [
  ['#EDEAE3', '#CBD3E8'], ['#EFEAE6', '#E3CFC3'], ['#E7EAE3', '#C9D6C1'], ['#EEE7E3', '#DCC7B0'],
  ['#E7E7EE', '#C6C6DE'], ['#ECEAE5', '#D9CFC2'], ['#E9E4EA', '#CBC2DE'], ['#E6EBE9', '#BFD8D0'],
  ['#EDE6E0', '#E0C9B8'], ['#E4E7EE', '#C3CEE0']
];
function applyTone(el, i) {
  var t = TONE_PALETTE[((i % TONE_PALETTE.length) + TONE_PALETTE.length) % TONE_PALETTE.length];
  el.style.setProperty('--tone-a', t[0]);
  el.style.setProperty('--tone-b', t[1]);
}

// fallback-only wash palette for the Work carousel's background: the real palette for every
// project is now extracted live from its own cover/PDF-page/video-frame (see
// extractPaletteFromSource()/getProjectPalette() above) and fed into updateWash() below. This
// cyclic array only ever gets used if that extraction genuinely fails for a given project (e.g.
// an undecodable source) -- degradation, not the primary mechanism -- so it's kept saturated and
// visually distinct by index the same way it always was.
var WASH_PALETTE = [
  ['#3B4FD6', '#7C93FF'], ['#C4522E', '#FF7A4D'], ['#2E7D4F', '#4CAF7D'], ['#B8842A', '#FFC24C'],
  ['#5B4FE0', '#9B90F2'], ['#8A5A34', '#D9925C'], ['#7C3FD6', '#C77DFF'], ['#1F8A7A', '#4FD6C0'],
  ['#D6553A', '#FF9470'], ['#2E6FD6', '#6FA8FF']
];

// ---- PDF-backed projects: page 1 is rendered as the carousel cover, every page after that as
// the gallery, live in the browser via pdf.js (self-hosted in assets/vendor/pdfjs, no CDN).
// This is the actual mechanism behind the "add pages to the PDF and they just appear" project
// convention -- there is no export/build step and no per-page file naming to keep in sync. ----
// captured synchronously at parse time (this is a classic, non-module script, so
// import.meta is unavailable) -- gives an absolute base for the vendor paths below
// regardless of what page/path this script is served from
var scriptUrl = document.currentScript ? document.currentScript.src : '';
var vendorBase = scriptUrl.replace(/[^/]*$/, '../assets/vendor/pdfjs/');

var pdfjsModulePromise = null;
function loadPdfjs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import(vendorBase + 'pdf.min.mjs').then(function (mod) {
      mod.GlobalWorkerOptions.workerSrc = vendorBase + 'pdf.worker.min.mjs';
      return mod;
    });
  }
  return pdfjsModulePromise;
}

var pdfDocumentCache = {}; // project.pdf path -> Promise<PDFDocumentProxy>, parsed only once
function getPdfDocument(project) {
  if (!pdfDocumentCache[project.pdf]) {
    pdfDocumentCache[project.pdf] = loadPdfjs().then(function (pdfjsLib) {
      return pdfjsLib.getDocument({ url: project.pdf }).promise;
    });
  }
  return pdfDocumentCache[project.pdf];
}

// renders one page to an <img>-ready URL at a given CSS-pixel scale (device-pixel-ratio aware,
// so covers/plates stay crisp on retina displays the same way a real exported image would)
function renderPdfPageToUrl(project, pageNumber, cssScale) {
  return getPdfDocument(project).then(function (doc) {
    return doc.getPage(pageNumber);
  }).then(function (page) {
    var viewport = page.getViewport({ scale: cssScale * (window.devicePixelRatio || 1) });
    var canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    var ctx = canvas.getContext('2d');
    return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) { resolve(URL.createObjectURL(blob)); }, 'image/png');
      });
    });
  });
}

// `autoImages` opts a project into a filesystem-free auto-discovery gallery: instead of listing
// every plate's path by hand (`extraImages`), it probes sequential filenames
// (`<dir><prefix><n>.<ext>`, n starting at `start`) directly in the browser -- an <img> either
// loads or 404s, no server directory listing needed on this static, buildless site. Stops at the
// first index that matches none of `extensions`, so dropping `photo2.jpg`, `photo3.jpg`, etc.
// into the folder later makes them appear in the gallery in filename order with zero code changes.
function probeImageExists(url) {
  return new Promise(function (resolve) {
    var img = new Image();
    img.onload = function () { resolve(true); };
    img.onerror = function () { resolve(false); };
    img.src = url;
  });
}
function loadAutoImageSequence(seq) {
  var exts = seq.extensions || ['jpg', 'jpeg', 'png', 'webp'];
  function findAt(n) {
    return exts.reduce(function (chain, ext) {
      return chain.then(function (found) {
        if (found) return found;
        var url = seq.dir + seq.prefix + n + '.' + ext;
        return probeImageExists(url).then(function (ok) { return ok ? url : null; });
      });
    }, Promise.resolve(null));
  }
  function loop(n, acc) {
    return findAt(n).then(function (url) {
      if (!url) return acc;
      acc.push(url);
      return loop(n + 1, acc);
    });
  }
  return loop(seq.start || 1, []);
}

// resolves to this project's gallery items (every page after the cover, in order) -- however
// many pages exist right now; the gallery-building code itself never needs to know the count.
// `pdfPagesInGallery: false` opts a project out of this (cover still renders from page 1 as
// normal) so its gallery is made up of `extraImages`/`autoImages` alone -- used by didot-specimen,
// whose source PDF is a full case-study deck rather than a page-per-gallery-plate spread.
function loadPdfGalleryItems(project) {
  return getPdfDocument(project).then(function (doc) {
    var pageNumbers = [];
    if (project.pdfPagesInGallery !== false) {
      for (var p = 2; p <= doc.numPages; p++) pageNumbers.push(p);
    }
    return Promise.all(pageNumbers.map(function (p) {
      return renderPdfPageToUrl(project, p, 2).then(function (url) {
        return { kind: 'image', src: url };
      });
    }));
  }).then(function (items) {
    (project.extraImages || []).forEach(function (src) { items.push({ kind: 'image', src: src }); });
    if (!project.autoImages) return items;
    return loadAutoImageSequence(project.autoImages).then(function (urls) {
      urls.forEach(function (src) { items.push({ kind: 'image', src: src }); });
      return items;
    });
  });
}

// ---- gallery items for a project's page, normalized across the placeholder-count / real-array /
// video conventions -- see README ----
function screenItemsFor(project) {
  var list = [];
  if (project.type === 'video') {
    list.push({ kind: 'video', src: project.video || '' });
    for (var i = 0; i < (project.supporting || 0); i++) list.push({ kind: 'placeholder', tone: i + 5 });
  } else if (Array.isArray(project.images)) {
    project.images.forEach(function (src) { list.push({ kind: 'image', src: src }); });
  } else {
    for (var j = 0; j < (project.images || 0); j++) list.push({ kind: 'placeholder', tone: j + 3 });
  }
  return list;
}

// ---- Project palette extraction: the single source of truth for "what color is this project."
// Analyzes each project's own main image (cover / rendered PDF page 1 / video preview's first
// frame) live in the browser -- a downscaled canvas + quantized-histogram dominant-color sample,
// picking the two most distinct prominent clusters (or, for a near-monochrome source, deriving a
// second tone from the first via an HSL lightness shift, the same "darker/lighter pair" shape
// WASH_PALETTE below already uses). Nothing here is hand-picked per project; nothing samples an
// image twice (results are cached per project id, since a cover never changes after first look).
// Both the Work background wash (updateWash(), further down) and the Liquid Ether layer
// (setSiteColors()) are driven from this one pipeline so they can never drift apart. ----
function loadImageEl(src) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}
function loadVideoFrameEl(src) {
  return new Promise(function (resolve, reject) {
    var vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.addEventListener('error', reject, { once: true });
    vid.addEventListener('loadeddata', function onLoaded() {
      vid.removeEventListener('loadeddata', onLoaded);
      vid.addEventListener('seeked', function () { resolve(vid); }, { once: true });
      // a hair past frame 0 -- some encodes leave the literal first frame black
      vid.currentTime = Math.min(0.2, (vid.duration || 1) / 2);
    });
    vid.src = src;
  });
}
function getProjectMainImageEl(project) {
  if (project.cover) return loadImageEl(project.cover);
  if (project.pdf) return renderPdfPageToUrl(project, 1, 1).then(loadImageEl);
  if (project.videoPreview || project.video) return loadVideoFrameEl(project.videoPreview || project.video);
  return Promise.resolve(null);
}

function rgbDistance(a, b) {
  var dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
function rgbToHex(rgb) {
  return '#' + rgb.map(function (v) {
    var n = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return n.length < 2 ? '0' + n : n;
  }).join('');
}
// derives a second tone from the same hue when a source is too close to monochrome for a real
// second cluster to exist -- an HSL lightness shift, computed rather than authored
function deriveToneVariant(rgb) {
  var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var l = (max + min) / 2, d = max - min, h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  var l2 = l > 0.5 ? l - 0.3 : l + 0.3;
  l2 = Math.max(0.08, Math.min(0.92, l2));
  var cc = (1 - Math.abs(2 * l2 - 1)) * s;
  var x = cc * (1 - Math.abs((h / 60) % 2 - 1));
  var m = l2 - cc / 2;
  var seg = Math.floor(h / 60) % 6;
  var rp = [cc, x, 0, 0, x, cc][seg], gp = [x, cc, cc, x, 0, 0][seg], bp = [0, 0, x, cc, cc, x][seg];
  return [(rp + m) * 255, (gp + m) * 255, (bp + m) * 255];
}
function extractPaletteFromSource(source) {
  var W = 48, H = 48;
  var c = document.createElement('canvas');
  c.width = W; c.height = H;
  var ctx = c.getContext('2d', { willReadFrequently: true });
  var data;
  try {
    ctx.drawImage(source, 0, 0, W, H);
    data = ctx.getImageData(0, 0, W, H).data;
  } catch (e) {
    return null; // undecodable/tainted source -- caller falls back to WASH_PALETTE
  }
  var LEVELS = 6;
  var buckets = {};
  for (var i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent
    var r = data[i], g = data[i + 1], b = data[i + 2];
    var key = Math.min(LEVELS - 1, (r / 256 * LEVELS) | 0) + '_' +
      Math.min(LEVELS - 1, (g / 256 * LEVELS) | 0) + '_' +
      Math.min(LEVELS - 1, (b / 256 * LEVELS) | 0);
    var bucket = buckets[key];
    if (!bucket) bucket = buckets[key] = { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++; bucket.r += r; bucket.g += g; bucket.b += b;
  }
  var list = Object.keys(buckets).map(function (k) { return buckets[k]; });
  if (!list.length) return null;
  list.sort(function (a, b) { return b.count - a.count; });
  function avg(bk) { return [bk.r / bk.count, bk.g / bk.count, bk.b / bk.count]; }
  var first = avg(list[0]);
  var second = null;
  for (var j = 1; j < list.length; j++) {
    var cand = avg(list[j]);
    if (rgbDistance(first, cand) > 60) { second = cand; break; }
  }
  if (!second) second = deriveToneVariant(first);
  return [rgbToHex(first), rgbToHex(second)];
}

var projectPaletteCache = {}; // project.id -> Promise<[hex,hex] | null>
function getProjectPalette(project) {
  if (!projectPaletteCache[project.id]) {
    projectPaletteCache[project.id] = getProjectMainImageEl(project).then(function (source) {
      return source ? extractPaletteFromSource(source) : null;
    }).catch(function () { return null; });
  }
  return projectPaletteCache[project.id];
}

// ---- Liquid Glass (hero-scoped): lazily mounted the first time a real extracted palette is
// ready (so it never flashes a placeholder color), skipped entirely under reduced motion like
// every other motion effect in this file. setSiteColors() is the one entry point both
// updateWash() (Work carousel, below) and the initial page-load palette funnel through -- both
// call it synchronously from the same palette result, so the wash and the glass material always
// update in the same frame. See js/liquid-glass.js for the actual WebGL shader and its own
// morph-on-setColors() cinematic blend (tuned to match the wash's own CSS transition exactly). ----
var liquidGlassApi = null, liquidGlassLoading = false;
function setSiteColors(pair) {
  if (!pair) return;
  if (liquidGlassApi) { liquidGlassApi.setColors(pair); return; }
  if (liquidGlassLoading || reducedMotion) return;
  liquidGlassLoading = true;
  import('./liquid-glass.js').then(function (mod) {
    var mount = document.getElementById('hero-liquid-glass');
    if (!mount) return;
    liquidGlassApi = mod.createLiquidGlass(mount, { colors: pair });
  });
}

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

  if (reducedMotion || !canvas || typeof gsap === 'undefined') {
    loader.style.display = 'none';
    hero.classList.add('show');
    header.classList.add('show');
    return;
  }

  var ctx = canvas.getContext('2d');

  // drop the character sprite sheet here: an R x C grid of equal-size cells, one character per
  // cell (the source's own default asset is Open Peeps' "all-peeps.png", 15x7) -- rows/cols must
  // match whatever sheet is actually placed at this path
  var config = { src: 'assets/loader/peeps.png', rows: 15, cols: 7 };

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

  // ---- factory (verbatim from the source) ----
  function createPeep(args) {
    var image = args.image, rect = args.rect;
    var peep = {
      image: image, rect: [], width: 0, height: 0, drawArgs: [],
      x: 0, y: 0, anchorY: 0, scaleX: 1, walk: null,
      setRect: function (r) {
        peep.rect = r;
        peep.width = r[2];
        peep.height = r[3];
        peep.drawArgs = [peep.image].concat(r, [0, 0, peep.width, peep.height]);
      },
      render: function (c) {
        c.save();
        c.translate(peep.x, peep.y);
        c.scale(peep.scaleX, 1);
        c.drawImage(peep.image, peep.rect[0], peep.rect[1], peep.rect[2], peep.rect[3], 0, 0, peep.width, peep.height);
        c.restore();
      }
    };
    peep.setRect(rect);
    return peep;
  }

  // ---- main (verbatim from the source) ----
  var img = document.createElement('img');
  var stage = { width: 0, height: 0 };
  var allPeeps = [], availablePeeps = [], crowd = [];

  function createPeeps() {
    var rows = config.rows, cols = config.cols;
    var width = img.naturalWidth, height = img.naturalHeight;
    var total = rows * cols;
    var rectWidth = width / rows;
    var rectHeight = height / cols;

    for (var i = 0; i < total; i++) {
      allPeeps.push(createPeep({
        image: img,
        rect: [(i % rows) * rectWidth, ((i / rows) | 0) * rectHeight, rectWidth, rectHeight]
      }));
    }
  }

  function initCrowd() {
    while (availablePeeps.length) {
      addPeepToCrowd().walk.progress(Math.random());
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(devicePixelRatio, devicePixelRatio);
    crowd.forEach(function (peep) { peep.render(ctx); });
    ctx.restore();
  }

  function resize() {
    if (!canvas) return;
    stage.width = canvas.clientWidth;
    stage.height = canvas.clientHeight;
    canvas.width = stage.width * devicePixelRatio;
    canvas.height = stage.height * devicePixelRatio;

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

  img.onload = init;
  img.onerror = function () {
    // sprite sheet not in place yet -- fail open rather than leave the site stuck behind a
    // loader that can never finish
    loader.style.display = 'none';
    hero.classList.add('show');
    header.classList.add('show');
  };
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

    var tl = gsap.timeline({
      onComplete: function () {
        gsap.ticker.remove(render);
        loader.remove();
      }
    });

    tl.to(typeLayer, { scale: 1.06, duration: 1, ease: 'power3.inOut', transformOrigin: '50% 50%' }, 0);
    tl.to(typeLayer, { opacity: 0, duration: 0.9, ease: 'power3.inOut' }, 0.05);
    tl.to(canvas, { opacity: 0, duration: 1, ease: 'power3.inOut' }, 0.1);
    tl.to(loader, { opacity: 0, duration: 1, ease: 'power3.inOut' }, 0.15);
  }
})();

// ---- Ambient background: one continuous canvas, mouse-reactive drifting light behind the whole page ----
(function () {
  var blobs = Array.prototype.slice.call(document.querySelectorAll('.ambient-blob'));
  if (!blobs.length || reducedMotion) return;

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
})();

// ---- Hero name: cursor-reactive gradient reveal, plus a two-layer parallax riding the same
// damped cursor position (curX/curY below) -- no second mousemove listener, no new tracking
// state, just two more small transforms derived from the value this IIFE already computes every
// frame. Typography (#hero-name-wrap) moves slightly more than the background glass
// (#hero-liquid-glass), matching the "typography 1-3px, background slightly less" depth cue --
// both capped low enough to read as physical settling, not floating. ----
(function () {
  var heroName = document.querySelector('.hero-name');
  var hero = document.getElementById('hero');
  if (!heroName || !hero || reducedMotion) return;

  var nameWrap = document.getElementById('hero-name-wrap');
  var glassMount = document.getElementById('hero-liquid-glass');

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

    heroName.style.setProperty('--mx', curX + '%');
    heroName.style.setProperty('--my', curY + '%');

    var normX = (curX - 50) / 50, normY = (curY - 50) / 50;
    if (nameWrap) {
      nameWrap.style.transform = 'translate3d(' + (normX * 2.5).toFixed(2) + 'px,' + (normY * 1.8).toFixed(2) + 'px,0)';
    }
    if (glassMount) {
      glassMount.style.transform = 'translate3d(' + (normX * 1.1).toFixed(2) + 'px,' + (normY * 0.7).toFixed(2) + 'px,0)';
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

  var MAX_SCALE = 0.02; // 1 -> 1.02
  var MAX_BLUR = 1.5;   // px

  var targetT = 0, curT = 0;

  function updateTarget() {
    var heroHeight = hero.offsetHeight || 1;
    targetT = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
  }
  window.addEventListener('scroll', updateTarget, { passive: true });
  updateTarget();

  function loop() {
    curT += (targetT - curT) * 0.12;
    hero.style.transform = 'scale(' + (1 + curT * MAX_SCALE).toFixed(4) + ')';
    hero.style.filter = curT > 0.001 ? 'blur(' + (curT * MAX_BLUR).toFixed(2) + 'px)' : 'none';
    requestAnimationFrame(loop);
  }
  loop();
})();

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

// ---- Scroll progress in bottom frame bar ----
(function () {
  var scrollPctEl = document.getElementById('scroll-pct');
  if (!scrollPctEl) return;

  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var pct = Math.round((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100);
    scrollPctEl.textContent = 'SCROLL ' + String(pct).padStart(2, '0') + '%';
  }, { passive: true });
})();

// ---- Scroll reveal for sections ----
(function () {
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
})();

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
  var enlargedItem = null;   // currently enlarged gallery image, if any
  var currentScrim = null;

  function buildHead(project, indexLabel) {
    var head = document.createElement('div');
    head.className = 'project-page__head';
    var num = document.createElement('span');
    num.className = 'num';
    num.textContent = indexLabel;
    var h2 = document.createElement('h2');
    h2.textContent = project.title;
    var meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = project.category + ' — ' + project.year;
    head.appendChild(num);
    head.appendChild(h2);
    head.appendChild(meta);
    // optional per-project blurb -- most projects don't set this, so most heads are unchanged
    if (project.description) {
      var desc = document.createElement('p');
      desc.className = 'description';
      desc.textContent = project.description;
      head.appendChild(desc);
    }
    return head;
  }

  // ---- FLIP-style enlarge/collapse for a gallery image -- items sit in normal flex flow (not
  // absolutely positioned), so collapsing restores `position` to '' rather than 'absolute' ----
  function expandItem(item, scrim) {
    if (enlargedItem) collapseItem(enlargedItem);
    var startRect = item.getBoundingClientRect();

    item.dataset.baseWidth = item.style.width;
    item.dataset.returnRect = JSON.stringify({ left: startRect.left, top: startRect.top, width: startRect.width, height: startRect.height });

    item.style.position = 'fixed';
    item.style.left = startRect.left + 'px';
    item.style.top = startRect.top + 'px';
    item.style.width = startRect.width + 'px';
    item.style.height = startRect.height + 'px';
    item.classList.add('enlarged');
    scrim.classList.add('show');
    enlargedItem = item;
    currentScrim = scrim;

    void item.offsetWidth; // force reflow so the size change below actually transitions

    var targetH = Math.min(window.innerHeight * 0.82, startRect.height * 3.2);
    var aspect = startRect.width / startRect.height;
    var targetW = targetH * aspect;
    if (targetW > window.innerWidth * 0.88) { targetW = window.innerWidth * 0.88; targetH = targetW / aspect; }

    item.style.left = ((window.innerWidth - targetW) / 2) + 'px';
    item.style.top = ((window.innerHeight - targetH) / 2) + 'px';
    item.style.width = targetW + 'px';
    item.style.height = targetH + 'px';
  }

  function collapseItem(item) {
    var r = JSON.parse(item.dataset.returnRect);
    item.style.left = r.left + 'px';
    item.style.top = r.top + 'px';
    item.style.width = r.width + 'px';
    item.style.height = r.height + 'px';
    if (currentScrim) currentScrim.classList.remove('show');
    item.classList.remove('enlarged');
    if (enlargedItem === item) enlargedItem = null;

    function restore() {
      item.style.position = '';
      item.style.left = '';
      item.style.top = '';
      item.style.width = item.dataset.baseWidth;
      item.style.height = '';
    }
    if (reducedMotion) {
      restore();
    } else {
      item.addEventListener('transitionend', function handler(e) {
        if (e.propertyName !== 'width') return;
        item.removeEventListener('transitionend', handler);
        restore();
      });
    }
  }

  // ---- level 2, image projects: the case study's own images in exact source order --
  // drag-to-scroll or wheel, click any image to enlarge it ----
  function buildGallery(project, items) {
    var wrap = document.createElement('div');
    wrap.className = 'gallery-track';
    var scrim = document.createElement('div');
    scrim.className = 'gallery-scrim';

    // plain vertical mouse-wheel scrolls the strip horizontally; native trackpad horizontal
    // swipe and Shift+wheel already move scrollLeft on their own (overflow-x:auto)
    wrap.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      wrap.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });

    var dragging = false, dragMoved = false, dragStartX = 0, dragStartScroll = 0;
    wrap.addEventListener('mousedown', function (e) {
      dragging = true; dragMoved = false;
      dragStartX = e.pageX;
      dragStartScroll = wrap.scrollLeft;
      wrap.classList.add('dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var dx = e.pageX - dragStartX;
      if (Math.abs(dx) > 4) dragMoved = true;
      wrap.scrollLeft = dragStartScroll - dx;
    });
    window.addEventListener('mouseup', function () {
      dragging = false;
      wrap.classList.remove('dragging');
    });

    items.forEach(function (item, i) {
      var el = document.createElement('div');
      el.className = 'gallery-item';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');

      if (item.kind === 'image') {
        var img = document.createElement('img');
        img.src = item.src;
        img.alt = project.title + ' — image ' + String(i + 1).padStart(2, '0');
        img.loading = 'lazy';
        img.draggable = false;
        el.appendChild(img);
        el.setAttribute('aria-label', 'Enlarge image ' + String(i + 1).padStart(2, '0') + ' of ' + items.length);
      } else {
        applyTone(el, i + 3);
        el.setAttribute('aria-label', 'Enlarge plate ' + String(i + 1).padStart(2, '0'));
      }

      var label = document.createElement('span');
      label.className = 'gallery-label';
      label.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
      el.appendChild(label);

      function toggle() {
        if (dragMoved) return; // this click was the tail end of a drag-to-scroll, not an open
        if (el.classList.contains('enlarged')) collapseItem(el);
        else expandItem(el, scrim);
      }
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        toggle();
      });

      wrap.appendChild(el);
    });

    scrim.addEventListener('click', function () {
      if (enlargedItem) collapseItem(enlargedItem);
    });

    wrap.appendChild(scrim);
    return wrap;
  }

  // ---- level 2, video projects: a clean page, no filmstrip ----
  function buildVideo(project) {
    var content = document.createElement('div');
    content.className = 'project-page-video-content';

    var box = document.createElement('div');
    box.className = 'project-video';
    applyTone(box, 0);
    var ph = document.createElement('div');
    ph.className = 'project-video__placeholder';
    ph.textContent = 'Add this project’s video (set a src on the <video> element)';
    var vid = document.createElement('video');
    vid.controls = true;
    vid.playsInline = true;
    // the placeholder is `position:absolute`, which always paints above the plain in-flow
    // <video> regardless of DOM order -- harmless while there's no real src to hide (reel,
    // launch-film), but it would permanently mask an actual video once one is set, so it's only
    // appended when there still isn't one
    if (project.video) {
      vid.src = project.video;
    } else {
      box.appendChild(ph);
    }
    box.appendChild(vid);
    content.appendChild(box);

    if (project.supporting) {
      var sgrid = document.createElement('div');
      sgrid.className = 'supporting-grid';
      for (var i = 0; i < project.supporting; i++) {
        var s = document.createElement('div');
        s.className = 'supporting-item';
        applyTone(s, i + 5);
        sgrid.appendChild(s);
      }
      content.appendChild(sgrid);
    }
    return content;
  }

  function renderPage(project, indexLabel) {
    inner.innerHTML = '';
    page.classList.remove('project-page--video');
    inner.appendChild(buildHead(project, indexLabel));

    if (project.type === 'video') {
      page.classList.add('project-page--video');
      inner.appendChild(buildVideo(project));
    } else if (project.pdf) {
      // pages render live from the PDF (see loadPdfGalleryItems() at the top of the file) --
      // brief loading state while that resolves, then the exact same buildGallery() every
      // other image project uses, so it behaves identically once the items are in hand
      var loadToken = {};
      inner._pdfLoadToken = loadToken;
      var loading = document.createElement('div');
      loading.className = 'gallery-loading';
      loading.textContent = 'Loading gallery…';
      inner.appendChild(loading);
      loadPdfGalleryItems(project).then(function (items) {
        if (inner._pdfLoadToken !== loadToken) return; // page was closed/changed meanwhile
        if (loading.parentNode) loading.remove();
        inner.appendChild(buildGallery(project, items));
      });
    } else {
      inner.appendChild(buildGallery(project, screenItemsFor(project)));
    }
  }

  openProjectPage = function (project, index, cardEl) {
    activeCardEl = cardEl;
    renderPage(project, String(index + 1).padStart(2, '0'));
    document.body.style.overflow = 'hidden';
    page.classList.add('open');
    page.setAttribute('aria-hidden', 'false');
    closeBtn.focus();
  };

  function closeProjectPage() {
    page.classList.remove('open');
    page.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    enlargedItem = null;
    currentScrim = null;
    if (activeCardEl) activeCardEl.focus({ preventScroll: true });
    setTimeout(function () { inner.innerHTML = ''; }, reducedMotion ? 0 : 520);
  }

  closeBtn.addEventListener('click', closeProjectPage);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (enlargedItem) { collapseItem(enlargedItem); return; }
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

// ---- Work: 3D interactive carousel (drag/wheel/keys to rotate; click flies into the project
// page above). Entirely driven by PROJECTS -- adding a project never touches this code. This
// ring only ever shows the 8 project covers -- it is the homepage level, not a container for
// case-study content. Motion signature (easeInOutCubic tween, damped/capped inertia, a small
// scale "grab tension" while dragging, idle auto-drift, no bounce/elastic anywhere) is adapted
// from studying apechain.com's actual drag/carousel code -- see chat for the writeup. ----
(function () {
  var root = document.getElementById('work-carousel');
  if (!root) return;

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
  var cards = [];                 // [{ el, inner, angle, index, item }]
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

  function cardSize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    // large, immersive panels occupying most of the viewport (sized for their true rendered,
    // post-recentering scale -- see render()'s note on the perspective-magnification fix)
    var width = Math.min(1200, Math.max(300, vw < 760 ? vw * 0.88 : vw * 0.72));
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

    if (project.cover) {
      var img = document.createElement('img');
      img.className = 'carousel-card__cover';
      img.src = project.cover;
      img.alt = project.title + ' — cover';
      img.loading = 'lazy';
      img.draggable = false;
      inner.appendChild(img);
    } else if (project.pdf) {
      // page 1 of the PDF, rendered live -- the tone gradient already applied above shows
      // through as a letterbox exactly like a real `cover` image (object-fit:contain) until
      // (and if) the render resolves, and stays as the letterbox regardless once it does
      var pdfCoverImg = document.createElement('img');
      pdfCoverImg.className = 'carousel-card__cover';
      pdfCoverImg.alt = project.title + ' — cover';
      pdfCoverImg.draggable = false;
      inner.appendChild(pdfCoverImg);
      renderPdfPageToUrl(project, 1, 1.3).then(function (url) { pdfCoverImg.src = url; });
    } else if (project.videoPreview) {
      // paused on its first frame by default -- no `autoplay`/`loop`-while-idle here, playback
      // is only ever started from the card's mouseenter handler below, while this card is the
      // active/centered one; loop only takes effect once .play() actually runs on hover
      var previewVid = document.createElement('video');
      previewVid.className = 'carousel-card__preview';
      previewVid.src = project.videoPreview;
      previewVid.muted = true;
      previewVid.loop = true;
      previewVid.playsInline = true;
      previewVid.preload = 'auto';
      inner.appendChild(previewVid);
    }

    // `videoPreview` projects communicate "this is a video" through the hover-playing preview
    // itself (see requirements), so they deliberately skip the static play-icon overlay other
    // video projects (reel, launch-film) show
    if (project.type === 'video' && !project.videoPreview) {
      var play = document.createElement('div');
      play.className = 'carousel-card__play';
      play.innerHTML = '<span>▶</span>';
      inner.appendChild(play);
    }

    card.appendChild(inner);
    return card;
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
  // through, never a hard cut. The same extracted pair also drives the Liquid Ether layer
  // (setSiteColors(), which runs its own cinematic morph on the WebGL side) so both background
  // systems always agree and neither invents its own color. ----
  function applyPalette(t) {
    wash.style.setProperty('--wash-a', t[0]);
    wash.style.setProperty('--wash-b', t[1]);
    setSiteColors(t);
  }
  function updateWash(idx) {
    var project = PROJECTS[idx];
    var fallback = WASH_PALETTE[((idx % WASH_PALETTE.length) + WASH_PALETTE.length) % WASH_PALETTE.length];
    getProjectPalette(project).then(function (extracted) {
      // the user may have already rotated on to a different project by the time extraction
      // resolves (PDF render / video seek can take a beat) -- a superseded result is dropped
      // rather than yanking the wash/Liquid Ether backward to a project that's no longer active
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
  // drag, wheel, keyboard or autoplay -- exactly like the wash/info updating live in the
  // reference instead of waiting for a click or a settle. ----
  var displayedIndex = -1;
  function syncActiveIndex() {
    var idx = nearestIndex();
    if (idx === displayedIndex) return;
    displayedIndex = idx;
    updateWash(idx);
    updateInfo(idx);
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
      var el = buildProjectCard(project, i);
      el.style.width = size.width + 'px';
      el.style.height = size.height + 'px';
      var angle = i * angleStep;
      el.style.transform = 'translate(-50%,-50%) rotateY(' + angle + 'deg) translateZ(' + radius + 'px)';

      var inner = el.querySelector('.carousel-card__inner');
      var record = { el: el, inner: inner, angle: angle, index: i, item: project };
      cards.push(record);

      el.addEventListener('mouseenter', function () {
        inner.classList.add('is-hovered');
        // only the centered/active card's preview plays on hover -- off-center cards stay on
        // their paused first frame even if the pointer happens to pass over them
        if (project.videoPreview && el.classList.contains('is-active')) {
          var pv = inner.querySelector('.carousel-card__preview');
          if (pv) { pv.currentTime = 0; pv.play().catch(function () {}); }
        }
      });
      el.addEventListener('mouseleave', function () {
        inner.classList.remove('is-hovered');
        if (project.videoPreview) {
          var pv = inner.querySelector('.carousel-card__preview');
          if (pv) { pv.pause(); pv.currentTime = 0; }
        }
      });

      ring.appendChild(el);
    });

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
    var dir = wheelAccum > 0 ? 1 : -1;
    wheelGestureTriggered = true;
    var count = cards.length;
    var nextIdx = ((nearestIndex() + dir) % count + count) % count;
    rotateToIndex(nextIdx);
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
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      var count = cards.length;
      var nextIdx = ((nearestIndex() + dir) % count + count) % count;
      rotateToIndex(nextIdx);
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

  if (!reducedMotion) {
    var bgT = 0;
    (function bgLoop() {
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
    })();
  }

  // ---- the background wash + particles are only meaningfully visible while the Work section
  // itself is on screen -- fades in/out with scroll rather than staying lit over other sections ----
  var workSection = document.getElementById('work');
  if (workSection) {
    var bgVisibilityObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        workBg.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { threshold: 0.12 });
    bgVisibilityObserver.observe(workSection);
  }

  buildRing();
})();

// ---- Back to top ----
(function () {
  var btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
