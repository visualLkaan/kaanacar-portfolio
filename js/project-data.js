// ---- Work: fully data-driven project model ----
// Add a project by editing PROJECTS only. Cards, the layered exhibition gallery and the
// video page are all generated from this array -- no HTML or CSS edits are ever required.
// image projects: { type:'image', images: <count> }
// video projects:  { type:'video', supporting: <count of extra images/videos below the video> }
//
// Shared by three consumers, deliberately kept in one file so none of them ever holds a second
// copy of this data: the homepage carousel (js/script.js), the homepage's own in-page project
// dialog (desktop only, js/script.js), and the standalone mobile/tablet project detail pages
// (project/<id>/index.html, js/project-page.js). This file and js/project-render.js are loaded
// before both js/script.js and js/project-page.js.
//
// `coverFallback` is new: a small static plate/frame image used ONLY as the mobile/tablet
// homepage card cover for a project whose real `cover` would otherwise require live PDF
// rendering (pdf.js) or buffering a video -- both explicitly disallowed on the mobile/tablet
// homepage (see PROJECT_MEDIA_MOBILE_TIER below and buildProjectCard() in js/script.js). It is
// never used on desktop and never used on the project detail page, where the real PDF/video
// still loads exactly as before. Two pdf-only projects (kanye-west, breaking-the-grid) have no
// existing static image asset to reuse for this, so they intentionally have no `coverFallback`
// and fall back further, to the plain tone-gradient card -- see js/script.js's buildProjectCard()
// for that path; their title/category/year still surface via the carousel's own info panel the
// moment either becomes the active card, so this isn't a silently unlabeled card.
var PROJECTS = [
  // `videoPreview` opts a video project into a hover-to-play carousel preview (a muted, looping
  // <video> in place of the static cover) instead of the default tone-gradient-plus-play-icon
  // card every other video project uses -- same single file for both `videoPreview` and `video`,
  // same convention as fight-club-titles/fight-club-soap below. Desktop only, see above.
  { id: 'who-i-am',     title: 'WHO I AM',                category: 'Blender / 3D Motion', year: '2026', size: 'md', type: 'video',
    description: 'A cinematic Blender identity piece -- the same footage that once opened this site’s own about section, now shown here as a standalone motion project.',
    videoPreview: 'assets/projects/who-i-am/who-i-am.mp4',
    video: 'assets/projects/who-i-am/who-i-am.mp4',
    coverFallback: 'assets/projects/who-i-am/cover-fallback.jpg' },
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
  // static plates appended to the gallery after the PDF pages, in array order. This live-render
  // cover is desktop only (and the detail page, any tier) -- see `coverFallback` above.
  { id: 'white-noise',  title: 'WHITE NOISE',             category: 'Book Cover',        year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/white-noise/white-noise.pdf',
    coverFallback: 'assets/projects/white-noise/bookcover-mockup.jpg',
    extraImages: [
      'assets/projects/white-noise/bookcover-mockup.jpg'
    ] },
  { id: 'kanye-west',   title: 'KANYE WEST',              category: 'Editorial Design',  year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/kanye-west/kanye-west.pdf' }, // no coverFallback -- see file header
  { id: 'breaking-the-grid', title: 'BREAKING THE GRID',  category: 'Swiss Style',       year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/breaking-the-grid/breaking-the-grid.pdf' }, // no coverFallback -- see file header
  { id: 'didot-specimen', title: 'DIDOT TYPE SPECIMEN',  category: 'Typography',        year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/didot-specimen/didot-specimen.pdf',
    coverFallback: 'assets/projects/didot-specimen/didot-type-specimen.jpg',
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
    video: 'assets/projects/reach/reach-full.mp4',
    coverFallback: 'assets/projects/reach/cover-fallback.jpg' },
  { id: 'fight-club-titles', title: 'FIGHT CLUB — Title Sequence', category: 'Motion / Title Design', year: '2026', size: 'md', type: 'video',
    // same single file for both -- `videoPreview` and `video` don't have to differ, the preview
    // mechanism only ever plays/loops/resets it silently in the card, independent of the full,
    // controls-enabled playback `buildVideo()` renders once the project is actually opened
    videoPreview: 'assets/projects/fight-club-titles/fight-club-titles.mp4',
    video: 'assets/projects/fight-club-titles/fight-club-titles.mp4',
    coverFallback: 'assets/projects/fight-club-titles/cover-fallback.jpg' },
  { id: 'unknown-place', title: 'UNKNOWN PLACE',   category: 'Book Cover',        year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/unknown-place/unknown-place.pdf', // cover only (1 page) -- no gallery
    coverFallback: 'assets/projects/unknown-place/photo1.jpeg',
    pdfPagesInGallery: false, // plates of its own; the gallery comes entirely from autoImages below
    // `photo1.jpeg` is the first gallery plate; `autoImages` probes `photo2`, `photo3`, ... in the
    // browser (see loadAutoImageSequence() above) so dropping more `photoN` files into this
    // project's folder later adds them to the gallery in filename order with zero code changes
    autoImages: { dir: 'assets/projects/unknown-place/', prefix: 'photo', start: 1,
      extensions: ['jpeg', 'jpg', 'png', 'webp'] } },
  { id: 'fight-club-soap', title: 'Fight Club Soap', category: '3D Product Visualization', year: '2026', size: 'md', type: 'video',
    description: 'A cinematic 3D recreation of the iconic Fight Club soap, modeled, textured and rendered in Blender with a focus on realistic materials, lighting and presentation.',
    videoPreview: 'assets/projects/fight-club-soap/fight-club-soap.mp4',
    video: 'assets/projects/fight-club-soap/fight-club-soap.mp4',
    coverFallback: 'assets/projects/fight-club-soap/cover-fallback.jpg' },
  { id: 'scarface', title: 'SCARFACE', category: 'Alternative Film Poster', year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/scarface/main-photo.pdf', // cover only (1 page) -- no gallery pages of its own
    coverFallback: 'assets/projects/scarface/scarface-artwork.jpg',
    pdfPagesInGallery: false, // the gallery is the one real artwork plate below, not this cover
    extraImages: [
      'assets/projects/scarface/scarface-artwork.jpg'
    ] },
  { id: 'messi', title: 'MESSI', category: 'Illustration', year: '2026', size: 'md', type: 'image',
    pdf: 'assets/projects/messi/main-photo.pdf', // cover only (1 page) -- no gallery pages of its own
    coverFallback: 'assets/projects/messi/messi-artwork.jpg',
    pdfPagesInGallery: false, // the gallery is the one real artwork plate below, not this cover
    extraImages: [
      'assets/projects/messi/messi-artwork.jpg'
    ] },
  // unlike the pdf-only projects above, MOLA has its own dedicated cover photo -- so unlike
  // those, page 1 of its pdf is real gallery content rather than a redundant cover render, and
  // is included in the gallery accordingly (see the `project.cover` check in
  // loadPdfGalleryItems() below)
  { id: 'mola', title: 'MOLA', category: 'Brand Identity', year: '2026', size: 'md', type: 'image',
    cover: 'assets/projects/mola/main-photo.jpeg',
    pdf: 'assets/projects/mola/mola-brand-identity.pdf' }
];

// ---- resolve every PROJECTS asset path to an absolute URL, once, right here ----
// Every path above is written site-root-relative ('assets/projects/...'), matching how they've
// always been referenced from index.html -- which IS the site root, so that worked unmodified.
// The exact same string means something different from a page one directory deeper
// (project/<id>/index.html, see js/project-page.js): a bare relative path there resolves
// against *that page's own* URL instead of the site root, silently pointing at
// 'project/<id>/assets/projects/...', which doesn't exist. Rather than have every consumer of
// PROJECTS (buildProjectCard in js/script.js, ProjectRender, this file's own pdf.js/palette
// loaders) special-case which page is asking, every path is rewritten to a full absolute URL
// exactly once, right here, anchored to this script's own resolved location
// (document.currentScript.src) -- js/project-data.js is always loaded via the same
// site-root-relative path ('js/project-data.js' from index.html, '../../js/project-data.js'
// from a project page), so its own resolved URL is a reliable stand-in for "the site root"
// regardless of what subpath the site happens to be deployed under (a plain domain root, a
// GitHub Pages project subpath, etc.) and regardless of which page loads this file.
(function () {
  var selfUrl = document.currentScript ? document.currentScript.src : '';
  var SITE_ROOT = new URL('../', selfUrl.replace(/[^/]*$/, '')).href;
  function resolve(p) { return p ? new URL(p, SITE_ROOT).href : p; }
  PROJECTS.forEach(function (project) {
    if (project.cover) project.cover = resolve(project.cover);
    if (project.coverFallback) project.coverFallback = resolve(project.coverFallback);
    if (project.pdf) project.pdf = resolve(project.pdf);
    if (project.video) project.video = resolve(project.video);
    if (project.videoPreview) project.videoPreview = resolve(project.videoPreview);
    if (Array.isArray(project.images)) project.images = project.images.map(resolve);
    if (Array.isArray(project.extraImages)) project.extraImages = project.extraImages.map(resolve);
    if (project.autoImages) project.autoImages.dir = resolve(project.autoImages.dir);
  });
})();

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
// visually distinct by index the same way it always was. On mobile/tablet (see
// PROJECT_MEDIA_MOBILE_TIER below) it is also the deliberate result for any project whose
// extraction source would otherwise require a PDF/video fetch, not just a genuine failure.
var WASH_PALETTE = [
  ['#3B4FD6', '#7C93FF'], ['#C4522E', '#FF7A4D'], ['#2E7D4F', '#4CAF7D'], ['#B8842A', '#FFC24C'],
  ['#5B4FE0', '#9B90F2'], ['#8A5A34', '#D9925C'], ['#7C3FD6', '#C77DFF'], ['#1F8A7A', '#4FD6C0'],
  ['#D6553A', '#FF9470'], ['#2E6FD6', '#6FA8FF']
];

// ---- Mobile/tablet media-loading tier ----
// Same isCoarsePointer + smaller-of-width/height convention js/script.js already uses for the
// loader/hero/prism tiering (see that file's own isCoarsePointer comment) -- a landscape iPad
// reports an innerWidth well past 1024px despite being the same memory-constrained device as its
// own portrait orientation, so pointer type is checked first and, only for a coarse pointer, the
// smaller of width/height stands in for "device size" instead of raw innerWidth. Computed
// independently here (not read from js/script.js) because this file is also loaded standalone by
// the project detail pages (project/<id>/index.html via js/project-page.js), which never load
// js/script.js at all.
//
// This is the single switch behind the architecture change: on this tier, the homepage must never
// instantiate a project's actual video/PDF -- getProjectMainImageEl() below (feeding the Work
// carousel's background-wash color extraction) and buildProjectCard() in js/script.js (feeding the
// card cover itself) both check it before touching project.video/project.videoPreview/project.pdf,
// falling back to project.cover / project.coverFallback / a plain tone gradient instead. The
// project detail page is a separate document entirely (see file header) and is never subject to
// this tier -- once a visitor is actually on a project's own page, loading that one project's real
// media is exactly the point.
var PROJECT_MEDIA_MOBILE_TIER = (function () {
  var coarse = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var w = coarse ? Math.min(window.innerWidth, window.innerHeight) : window.innerWidth;
  return coarse && w <= 1024;
})();

// ---- PDF-backed projects: page 1 is rendered as the carousel cover, every page after that as
// the gallery, live in the browser via pdf.js (self-hosted in assets/vendor/pdfjs, no CDN).
// This is the actual mechanism behind the "add pages to the PDF and they just appear" project
// convention -- there is no export/build step and no per-page file naming to keep in sync.
// Desktop-homepage and project-detail-page only -- see PROJECT_MEDIA_MOBILE_TIER above; nothing
// in this section is ever called on the mobile/tablet homepage. ----
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

// page 1 is what both the carousel's own cover AND (for pdf-backed projects) the color-sync
// sampler in getProjectMainImageEl() below need -- those two call sites used to each render their
// own separate copy, at two different scales (1.3 for the cover, 1 for sampling), silently
// doubling pdf.js's real rasterization work for every pdf-backed project every time. Page 1 is the
// only page either one ever needs, so it's cached by project here and rendered exactly once, at
// the cover's own (higher, retina-ready) scale -- the sampler reads pixels from that same result
// just as well as it would from a smaller render of its own, since it already downsamples via
// canvas quantization (see extractPaletteFromSource below) regardless of source resolution.
var pdfPageOneCache = {}; // project.pdf -> Promise<url>, rendered once, shared by cover + sampler
var PDF_COVER_SCALE = 1.3;
function getPdfPageOneUrl(project) {
  if (!pdfPageOneCache[project.pdf]) {
    pdfPageOneCache[project.pdf] = renderPdfPageToUrl(project, 1, PDF_COVER_SCALE);
  }
  return pdfPageOneCache[project.pdf];
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
// whose source PDF is a full case-study deck rather than a page-per-gallery-plate spread. Only
// ever called from the project detail page (js/project-page.js) or the desktop in-page dialog
// (js/script.js) -- never from the mobile/tablet homepage.
function loadPdfGalleryItems(project) {
  return getPdfDocument(project).then(function (doc) {
    var pageNumbers = [];
    if (project.pdfPagesInGallery !== false) {
      // page 1 is only skipped here because it's already shown elsewhere as the live-rendered
      // cover (see getProjectMainImageEl()/buildProjectCard() above) -- a project with its own
      // separate `cover` image never renders page 1 anywhere else, so it belongs in the gallery
      // too instead of being silently dropped
      var startPage = project.cover ? 1 : 2;
      for (var p = startPage; p <= doc.numPages; p++) pageNumbers.push(p);
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
// Drives the Work background wash (updateWash(), js/script.js) -- the hero's own background
// (js/prism-bg.js) has a fixed color identity and does not consume this palette. ----
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
// mobile/tablet homepage: never fetches a PDF or buffers a video just to sample a background
// color -- project.cover/project.coverFallback (both plain static images) are the only sources
// this tier will ever read; anything without one of those resolves null and updateWash() falls
// back to WASH_PALETTE's own cyclic swatch, exactly as it already does for a genuine extraction
// failure. Desktop and the project detail page are unaffected -- both still extract from the real
// PDF page 1 / video frame for full-fidelity color.
function getProjectMainImageEl(project) {
  if (project.cover) return loadImageEl(project.cover);
  if (PROJECT_MEDIA_MOBILE_TIER) {
    return project.coverFallback ? loadImageEl(project.coverFallback) : Promise.resolve(null);
  }
  if (project.pdf) return getPdfPageOneUrl(project).then(loadImageEl);
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
