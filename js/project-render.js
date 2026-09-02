// ---- Project detail rendering: builds a project's actual media (head, image/PDF gallery with
// enlarge, or video player) into a container. Depends on js/project-data.js (PROJECTS,
// applyTone, screenItemsFor, loadPdfGalleryItems) and must be loaded after it.
//
// Two consumers share this file rather than each holding their own copy: the desktop-only
// in-page project dialog (#project-page overlay, js/script.js) and the standalone mobile/tablet
// project detail page (project/<id>/index.html, js/project-page.js). Both call
// ProjectRender.renderInto() with their own page/inner elements; this file owns none of the
// open/close/focus-trap chrome around them, only what gets drawn inside. This is also exactly
// where a project's real video/PDF/full-resolution media gets instantiated -- on the mobile/tablet
// homepage this file is never loaded at all, only reached once a visitor has actually navigated
// into a project. ----
var ProjectRender = (function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  // ---- entry point: renders `project` into `inner` (page.classList gets the video/non-video
  // toggle). `pdfLoadToken` bookkeeping guards against a PDF-backed project's gallery resolving
  // after the container has already moved on to a different project (desktop dialog only -- the
  // standalone detail page never re-renders, so this is a harmless no-op there). ----
  function renderInto(page, inner, project, indexLabel) {
    inner.innerHTML = '';
    page.classList.remove('project-page--video');
    inner.appendChild(buildHead(project, indexLabel));

    if (project.type === 'video') {
      page.classList.add('project-page--video');
      inner.appendChild(buildVideo(project));
    } else if (project.pdf) {
      // pages render live from the PDF (see loadPdfGalleryItems() in js/project-data.js) --
      // brief loading state while that resolves, then the exact same buildGallery() every
      // other image project uses, so it behaves identically once the items are in hand
      var loadToken = {};
      inner._pdfLoadToken = loadToken;
      var loading = document.createElement('div');
      loading.className = 'gallery-loading';
      loading.textContent = 'Loading gallery…';
      inner.appendChild(loading);
      loadPdfGalleryItems(project).then(function (items) {
        if (inner._pdfLoadToken !== loadToken) return; // container was closed/changed meanwhile
        if (loading.parentNode) loading.remove();
        inner.appendChild(buildGallery(project, items));
      });
    } else {
      inner.appendChild(buildGallery(project, screenItemsFor(project)));
    }
  }

  function collapseEnlarged() {
    if (enlargedItem) collapseItem(enlargedItem);
  }
  function hasEnlarged() {
    return !!enlargedItem;
  }

  return { renderInto: renderInto, collapseEnlarged: collapseEnlarged, hasEnlarged: hasEnlarged };
})();
