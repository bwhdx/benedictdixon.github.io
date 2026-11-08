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

// The contents sheet: a native modal dialog, so the browser traps focus,
// Escape closes it and focus returns to the button. A click on the
// backdrop (the dialog itself, outside its panel) closes it too.
(function () {
  var sheet = document.getElementById('contents-sheet');
  var open = document.querySelector('.contents-btn');
  if (!sheet || !open || typeof sheet.showModal !== 'function') {
    if (open) open.hidden = true;
    return;
  }
  function close() { if (sheet.open) sheet.close(); }
  open.addEventListener('click', function () { sheet.showModal(); });
  sheet.querySelector('.sheet-close').addEventListener('click', close);
  sheet.addEventListener('click', function (e) {
    if (e.target === sheet || e.target.closest('a')) close();
  });
})();

// Code blocks wider than the column fade at the right edge until the
// reader has scrolled to their end (writing.css, Code blocks).
(function () {
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.article-body pre'));
  if (!blocks.length) return;
  function mark(pre) {
    pre.classList.toggle('is-clipped', pre.scrollWidth > pre.clientWidth + 1);
    pre.classList.toggle('is-scrolled-end', pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 1);
  }
  blocks.forEach(function (pre) {
    mark(pre);
    pre.addEventListener('scroll', function () { mark(pre); }, { passive: true });
  });
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { mark(e.target); }); });
    blocks.forEach(function (pre) { ro.observe(pre); });
  }
})();
