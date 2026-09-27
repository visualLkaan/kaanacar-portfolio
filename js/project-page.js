// ---- Standalone mobile/tablet (and directly-linked, any device) project detail page ----
// This is the "one project's heavy assets at a time" half of the architecture: project/<id>/
// index.html loads only this file plus js/project-data.js and js/project-render.js -- no
// js/script.js, no loader, no Hero, no ambient canvas, no Work carousel -- so the only network
// requests this page ever makes beyond its own HTML/CSS/fonts are this one project's own
// video/PDF/images, via the exact same renderer the desktop homepage's in-page dialog uses (see
// js/project-render.js). Closing this "view" is just leaving the page (the Back link below,
// or the browser's own back button) -- a real navigation, so nothing it loaded can outlive it.
(function () {
  var page = document.getElementById('project-page');
  var inner = document.getElementById('project-page-inner');
  if (!page || !inner) return;

  // same coarse-pointer convention as this site's other mobile-tier checks (js/script.js) --
  // this page is reached in normal use only from the mobile/tablet Work carousel (see that
  // file's buildMobileWork()), but is technically reachable directly on any device, so the
  // history-navigation fixes below are gated the same way rather than assumed from the URL alone.
  var isCoarsePointer = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- mobile-only: make the in-site Back link a real "one step back" instead of a fresh
  // navigation. It's a plain <a href="../../index.html"> in every project/<id>/index.html shell
  // -- always a *new* navigation regardless of how this page was reached, which is what was
  // sending mobile visitors back to a freshly-replayed loader instead of wherever they actually
  // came from (Home mid-scroll at Projects, another project, etc). When this page was reached via
  // real in-site navigation (a same-origin referrer, with actual history to pop), history.back()
  // instead lands on that exact previous entry -- letting the browser's own scroll restoration
  // and the loader's own back_forward check (js/script.js) do the rest. Falls through to the
  // anchor's own href untouched when there's no safe same-origin history to return to (a direct
  // link, a new tab) -- exactly today's behavior in that case. ----
  var backLink = document.getElementById('project-page-back');
  if (backLink && isCoarsePointer) {
    backLink.addEventListener('click', function (e) {
      // stop any in-flight video buffering the instant Back is tapped, before either navigation
      // path below even starts -- an actively downloading/decoding <video> (a video-type
      // project's own player, autoplay-less but still preloading) is real, ongoing network/media
      // pipeline work that a mobile browser can visibly pause to tear down as part of leaving the
      // page, which is what read as "the back button is slow" even though this click handler
      // itself runs instantly. Pausing and clearing the src first means there is nothing left for
      // the navigation itself to wait on. Unconditional -- runs on both branches below, and is a
      // no-op for every non-video project (querySelector finds nothing).
      var vid = page.querySelector('video');
      if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }

      if (document.referrer && document.referrer.indexOf(location.origin + '/') === 0 && history.length > 1) {
        e.preventDefault();
        history.back();
      }
    });
  }

  var slug = (window.location.pathname.match(/\/project\/([^/]+)\/?/) || [])[1] || '';
  var index = -1, project = null;
  for (var i = 0; i < PROJECTS.length; i++) {
    if (PROJECTS[i].id === slug) { index = i; project = PROJECTS[i]; break; }
  }

  if (!project) {
    // no matching slug (a stale/typo'd link) -- a plain message rather than a blank page,
    // still with a way back; nothing project-shaped to load either way
    var msg = document.createElement('div');
    msg.className = 'project-page__head';
    var h2 = document.createElement('h2');
    h2.textContent = 'Project not found';
    msg.appendChild(h2);
    inner.appendChild(msg);
    return;
  }

  document.title = project.title + ' — Kaan Acar';
  ProjectRender.renderInto(page, inner, project, String(index + 1).padStart(2, '0'));

  // ---- mobile-only: the enlarged gallery image (level 3 -- see js/project-render.js's own
  // header comment) has no URL/page of its own, so tapping into it never used to cost a history
  // step -- the physical/gesture Back button just fell straight through to leaving this project
  // entirely, skipping the expected "Back closes the enlarged image and returns to the project"
  // step. A synthetic history entry is pushed the instant an image enlarges; popping back to the
  // entry beneath it (this project page's own, no marker) closes the enlarge instead of
  // navigating away, and closing it by any other means (tap again, tap the scrim, Escape) pops
  // that same entry via history.back() so the stack never carries a stale "enlarged" step
  // forward -- one open costs exactly one Back, however it's closed. No-ops entirely on a
  // fine-pointer device (isCoarsePointer false), so desktop's own copy of this same
  // project-render.js gallery is untouched.
  var enlargeHistoryPushed = false;
  function syncEnlargeHistory() {
    if (!isCoarsePointer) return;
    var enlarged = ProjectRender.hasEnlarged();
    if (enlarged && !enlargeHistoryPushed) {
      enlargeHistoryPushed = true;
      history.pushState({ projectEnlarge: true }, '');
    } else if (!enlarged && enlargeHistoryPushed) {
      enlargeHistoryPushed = false;
      history.back();
    }
  }

  // bubble-phase: runs after project-render's own click/keydown handler on the gallery item has
  // already toggled enlargedItem, so hasEnlarged() already reflects the new state
  page.addEventListener('click', syncEnlargeHistory);
  page.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') syncEnlargeHistory();
  });

  window.addEventListener('popstate', function (e) {
    if (!isCoarsePointer) return;
    if (e.state && e.state.projectEnlarge) return;
    enlargeHistoryPushed = false;
    if (ProjectRender.hasEnlarged()) ProjectRender.collapseEnlarged();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ProjectRender.hasEnlarged()) {
      ProjectRender.collapseEnlarged();
      syncEnlargeHistory();
    }
  });
})();
