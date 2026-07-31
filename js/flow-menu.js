// ---- Contact scene: a vanilla-JS/CSS take on React Bits' Flowing Menu ----
// (https://reactbits.dev/components/flowing-menu -- source read directly from
// github.com/DavidHDev/react-bits before porting, same "reimplement the effect, don't pull in the
// library" convention as js/scenes.js's Split Text and css/style.css's Shiny Text/Side Rays).
//
// Two deliberate departures from the source:
//  1. The hover-triggered vertical reveal and the continuous horizontal auto-scroll are split
//     across two separate elements (.flow-marquee for the Y transform+transition, its child
//     .flow-marquee__track for the X keyframe animation) instead of the source's single element
//     carrying both via GSAP. A CSS `transition` and an `animation` can't cleanly share one
//     element's `transform` property, and this project deliberately scopes GSAP to the loader's
//     crowd canvas only (see js/script.js's Loader IIFE) rather than reaching for it here.
//  2. Marquee repetitions are cloned from a single seed element once at init (see buildTrack)
//     rather than the source's resize-aware recalculation -- a fixed, generous repeat count is
//     simpler and safe for content this short (a small logo + a handle/email), at the cost of not
//     re-optimizing on an extreme resize.
//
// Reduced motion needs no special-casing here (unlike js/scenes.js): the sitewide
// `*{ animation:none !important; transition:none !important; }` rule already stops both the
// continuous marquee scroll and the reveal transition, leaving instant, non-animated show/hide --
// consistent with how every other hover-interactive element on this site already degrades.

export function initFlowMenu() {
  var items = document.querySelectorAll('.flow-item');
  if (!items.length) return;

  var REPEATS_PER_GROUP = 10; // safely exceeds any realistic viewport width for this short content

  function buildTrack(item) {
    var track = item.querySelector('.flow-marquee__track');
    var seed = track ? track.querySelector('.flow-marquee__seed') : null;
    if (!track || !seed) return;
    var frag = document.createDocumentFragment();
    for (var g = 0; g < 2; g++) {
      var group = document.createElement('div');
      group.className = 'flow-marquee__group';
      for (var i = 0; i < REPEATS_PER_GROUP; i++) {
        group.appendChild(seed.cloneNode(true));
      }
      frag.appendChild(group);
    }
    track.innerHTML = '';
    track.appendChild(frag);
  }

  function nearestEdge(clientY, rect) {
    var y = clientY - rect.top;
    return y < rect.height / 2 ? 'top' : 'bottom';
  }

  // Reveal needs to jump instantly to the NEW entry edge before animating in -- otherwise, if the
  // marquee last exited toward the opposite edge, the transition would visibly sweep it across the
  // full row instead of sliding in cleanly from the edge the cursor just entered. Same problem
  // GSAP's own .set()-then-.to() timeline solves in the source component.
  function reveal(marquee, edge) {
    marquee.style.transition = 'none';
    marquee.dataset.edge = edge;
    marquee.classList.remove('is-visible');
    void marquee.offsetHeight; // force reflow so the instant jump commits before re-enabling the transition
    marquee.style.transition = '';
    marquee.classList.add('is-visible');
  }

  // Hiding never needs the instant-jump trick -- the marquee is already visible (transform:0%), so
  // setting the exit edge and removing .is-visible in the same tick animates smoothly from 0% to
  // that edge's off-screen position, no snapping required.
  function hide(marquee, edge) {
    marquee.dataset.edge = edge;
    marquee.classList.remove('is-visible');
  }

  var isTouch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  items.forEach(function (item) {
    buildTrack(item);
    var marquee = item.querySelector('.flow-marquee');
    if (!marquee) return;

    if (isTouch) {
      // First tap reveals the marquee without navigating; a second tap on the now-revealed row
      // navigates normally -- the standard "replace hover with tap" pattern for this kind of
      // reveal-on-hover interaction.
      item.addEventListener('click', function (e) {
        if (marquee.classList.contains('is-visible')) return;
        e.preventDefault();
        items.forEach(function (other) {
          if (other === item) return;
          var otherMarquee = other.querySelector('.flow-marquee');
          if (otherMarquee) hide(otherMarquee, 'top');
        });
        reveal(marquee, 'top');
      });
    } else {
      item.addEventListener('mouseenter', function (e) {
        var rect = item.getBoundingClientRect();
        reveal(marquee, nearestEdge(e.clientY, rect));
      });
      item.addEventListener('mouseleave', function (e) {
        var rect = item.getBoundingClientRect();
        hide(marquee, nearestEdge(e.clientY, rect));
      });
    }
  });

  if (isTouch) {
    document.addEventListener('click', function (e) {
      if (e.target.closest('.flow-item')) return;
      items.forEach(function (item) {
        var marquee = item.querySelector('.flow-marquee');
        if (marquee) hide(marquee, 'top');
      });
    });
  }
}
