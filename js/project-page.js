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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ProjectRender.hasEnlarged()) ProjectRender.collapseEnlarged();
  });
})();
