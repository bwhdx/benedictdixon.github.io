// The running head on the writing pages: it names the section being read.
// One IntersectionObserver over the section headings. The root's top edge
// is moved down to the foot of the head and its bottom edge far below the
// screen, so a heading stops intersecting only by crossing that line
// upward, however far one jump scrolls. A heading above the line has been
// passed; the last one passed is the current section, and before the
// first the head shows the essay's own title.
// No scroll handler. The candle progress row and the section openers are
// scroll-motion.js, loaded just before this file.
if (window.ScrollMotion) window.ScrollMotion.init();
(function () {
  var head = document.querySelector('.runhead-t');
  var headings = Array.prototype.slice.call(
    document.querySelectorAll('.article-body > h2, .listing .cat-ttl')
  );
  if (!head || !headings.length || !('IntersectionObserver' in window)) return;

  var LINE = 80; // px: the foot of the running head, plus a little air
  var fallback = head.getAttribute('data-default') || head.textContent;
  var passed = new Set();

  function label(el) {
    return (el.innerText || el.textContent).replace(/\s+/g, ' ').trim().replace(/\.$/, '');
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting && e.boundingClientRect.top < LINE) passed.add(e.target);
      else passed.delete(e.target);
    });
    var current = null;
    headings.forEach(function (h) { if (passed.has(h)) current = h; });
    var text = current ? label(current) : fallback;
    if (head.textContent !== text) head.textContent = text;
  }, { rootMargin: '-' + LINE + 'px 0px 100000px 0px' });

  headings.forEach(function (h) { io.observe(h); });
})();
