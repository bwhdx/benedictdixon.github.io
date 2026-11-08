// Scroll motion for the almanack: the candle progress row, the chapter
// plates and section openers, the career ledger, and the cover portrait's
// response to scrolling. Plain script with no JSX, so the writing pages load
// the compiled file directly and the home page gets it in bundle.js.
//
// The motion itself is CSS (site.css and writing.css, section Motion):
// where the browser has scroll-driven animations (animation-timeline), it
// runs entirely there, on the compositor. Elsewhere it falls back to:
//   - an IntersectionObserver that marks [data-reveal] elements as they
//     arrive, which CSS turns into short transitions;
//   - a scroll-linked cover, written once per frame.
// The progress row is a chart of the page's sections drawn here, and is
// always driven by one passive scroll listener, coalesced to one write per
// frame.
// Everything is transform and opacity. Reads happen before writes, layout
// is only measured on resize, and prefers-reduced-motion turns all of it
// off (CSS shows every element in place) except the progress row, which
// tracks the reader's position in place, without animation.
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var SCROLL_DRIVEN = !!(window.CSS && CSS.supports &&
    CSS.supports('animation-timeline: view()') && CSS.supports('animation-range: entry 0% exit 100%'));
  var REVEAL_MARGIN = '0px 0px -8% 0px';
  // What reveals: marked elements on the home page; on the writing pages,
  // the section headings and the listing's category heads.
  var REVEAL = '[data-reveal], .article-body > h2, .listing .category-head';
  var started = false;

  function reduced() { return !!(reduceQuery && reduceQuery.matches); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // ── The candle progress row ───────────────────────────────
  // A small candlestick chart of the page itself, one candle per section:
  // the home page's chapters, an essay's headed sections, or even groups of
  // paragraphs where an essay has too few headings to chart. The data is
  // honest: a body's height is the section's length in words, the upper
  // wick reaches to its longest paragraph and the lower one to its median
  // paragraph, all scaled against the page (square root, as for area). Every body is centred on the
  // row's midline, the way real candles open and close around a level, so
  // the heights vary but the row can never trend up or down.
  // Sections read are filled, sections ahead are hollow, and the one being
  // read is drawn in full ink with its body filling from the foot as the
  // reader goes through it. Each candle is a button that jumps to its
  // section. Layout is read on resize only; scrolling writes one transform.
  var CP_PITCH = 22;       // px between candle centres (and the hit width)
  var CP_ROW_H = 18;       // px of chart; the baseline sits beneath it
  var CP_MID = CP_ROW_H / 2;
  var CP_BODY_MIN = 3, CP_BODY_MAX = 11;  // px, body height range (odd, one centre row)
  var CP_WICK_MIN = 1, CP_WICK_SPAN = 2;  // px beyond the body
  var CP_FEW_HEADINGS = 4; // below this, an essay is charted by paragraphs
  var CP_GROUPS = 8;       // how many paragraph groups to aim for
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  var BLOCKS = 'p, li, blockquote, pre, dd, figcaption, h3, h4';

  function words(text) {
    var m = (text || '').match(/\S+/g);
    return m ? m.length : 0;
  }
  function textOf(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function fmt(n) { return n.toLocaleString('en-GB'); }
  function plural(n) { return fmt(n) + (n === 1 ? ' word' : ' words'); }

  // Leaf text blocks only: a list item's own paragraphs are not counted twice.
  function blocksIn(nodes) {
    var out = [];
    nodes.forEach(function (node) {
      if (node.nodeType !== 1) return;
      var list = node.matches(BLOCKS) ? [node] : [];
      list = list.concat(Array.prototype.slice.call(node.querySelectorAll(BLOCKS)));
      list.forEach(function (b) { if (!b.querySelector(BLOCKS)) out.push(b); });
    });
    return out;
  }

  // A section's length is every word in it; its paragraphs give the wicks.
  function stats(blocks, nodes) {
    var counts = blocks.map(function (b) { return words(textOf(b)); })
      .filter(function (n) { return n > 0; });
    var sorted = counts.slice().sort(function (a, b) { return a - b; });
    var total = nodes ? nodes.reduce(function (a, n) { return a + words(n.textContent); }, 0)
      : counts.reduce(function (a, b) { return a + b; }, 0);
    return {
      words: total,
      longest: sorted.length ? sorted[sorted.length - 1] : 0,
      median: sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0,
    };
  }

  // The page's sections, in reading order: { el, focus, name, words,
  // longest, median }. el is where the section starts; focus is what takes
  // focus when a candle is chosen.
  function findSections() {
    var chapters = Array.prototype.slice.call(document.querySelectorAll('section.chapter'));
    if (chapters.length) {
      return chapters.map(function (ch, i) {
        var title = document.getElementById(ch.getAttribute('aria-labelledby') || '') ||
          ch.querySelector('h2');
        var s = stats(blocksIn([ch]), [ch]);
        s.el = ch;
        s.focus = title || ch;
        s.name = 'Chapter ' + ROMAN[i] + (title ? ', ' + textOf(title).replace(/\.$/, '') : '');
        return s;
      });
    }
    var body = document.querySelector('.article-body') || document.querySelector('main');
    if (!body) return [];
    var kids = Array.prototype.slice.call(body.children);
    var heads = kids.filter(function (k) { return k.tagName === 'H2'; });
    if (heads.length >= CP_FEW_HEADINGS) {
      var out = [];
      var intro = kids.slice(0, kids.indexOf(heads[0]));
      var introStats = stats(blocksIn(intro), intro);
      if (introStats.words > 0) {
        introStats.el = intro[0];
        introStats.focus = intro[0];
        introStats.name = 'Opening';
        out.push(introStats);
      }
      heads.forEach(function (h, i) {
        var next = heads[i + 1];
        var part = kids.slice(kids.indexOf(h) + 1, next ? kids.indexOf(next) : kids.length);
        var s = stats(blocksIn(part), part);
        s.el = h;
        s.focus = h;
        s.name = 'Section ' + ROMAN[i] + ', ' + textOf(h).replace(/\.$/, '');
        out.push(s);
      });
      return out;
    }
    // Too few headings: even groups of paragraphs, cut only between blocks.
    var blocks = blocksIn(kids).filter(function (b) { return words(textOf(b)) > 0; });
    if (!blocks.length) return [];
    var total = stats(blocks).words;
    var target = total / Math.min(CP_GROUPS, blocks.length);
    var groups = [];
    var cur = [], acc = 0;
    blocks.forEach(function (b, i) {
      cur.push(b);
      acc += words(textOf(b));
      var left = blocks.length - i - 1;
      if ((acc >= target * (groups.length + 1) && left > 0) || left === 0) { groups.push(cur); cur = []; }
    });
    return groups.map(function (g, i) {
      var s = stats(g);
      s.el = g[0];
      s.focus = g[0];
      s.name = 'Part ' + (i + 1) + ' of ' + groups.length;
      return s;
    });
  }

  // "Section II, How we got here" and "Section III, ..." -> "Sections II to III".
  function spanName(first, last) {
    var a = first.replace(/,.*$/, '').split(' '), b = last.replace(/,.*$/, '').split(' ');
    if (a.length > 1 && a[0] === b[0]) return a[0] + 's ' + a[1] + ' to ' + b[1];
    return a.join(' ') + ' to ' + b.join(' ');
  }

  // Phones: if the row cannot hold every candle, neighbours are merged.
  function fitSections(sections, max) {
    if (sections.length <= max) return sections;
    var per = Math.ceil(sections.length / max);
    var out = [];
    for (var i = 0; i < sections.length; i += per) {
      var g = sections.slice(i, i + per);
      out.push({
        el: g[0].el,
        focus: g[0].focus,
        name: g.length > 1 ? spanName(g[0].name, g[g.length - 1].name) : g[0].name,
        words: g.reduce(function (a, s) { return a + s.words; }, 0),
        longest: Math.max.apply(null, g.map(function (s) { return s.longest; })),
        median: g[Math.floor((g.length - 1) / 2)].median,
      });
    }
    return out;
  }

  function span(cls) {
    var el = document.createElement('span');
    el.className = cls;
    return el;
  }

  function capacity(bar) { return Math.max(1, Math.floor(bar.clientWidth / CP_PITCH)); }

  // Draws the chart into the row and returns its controller.
  function buildChart(bar, all) {
    var max = capacity(bar);
    var sections = fitSections(all, max);
    var maxWords = Math.max.apply(null, sections.map(function (s) { return s.words; }).concat(1));
    var maxPara = Math.max.apply(null, sections.map(function (s) { return s.longest; }).concat(1));
    var frag = document.createDocumentFragment();
    var candles = sections.map(function (s, i) {
      // Square-root scale, as for area: one long section does not flatten
      // the rest, and the order of lengths is kept.
      var half = Math.round((CP_BODY_MAX - CP_BODY_MIN) / 2 * Math.sqrt(s.words / maxWords));
      var bodyH = CP_BODY_MIN + 2 * half;
      var top = Math.floor(CP_MID - bodyH / 2);
      var hi = CP_WICK_MIN + CP_WICK_SPAN * Math.sqrt(s.longest / maxPara);
      var lo = CP_WICK_MIN + CP_WICK_SPAN * Math.sqrt(s.median / maxPara);
      var wickTop = Math.max(0, Math.round(top - hi));
      var wickBottom = Math.min(CP_ROW_H, Math.round(top + bodyH + lo));
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cp-candle';
      btn.setAttribute('aria-label', s.name + ', ' + plural(s.words));
      btn.dataset.state = 'ahead';
      var wick = span('cp-wick');
      wick.style.top = wickTop + 'px';
      wick.style.height = (wickBottom - wickTop) + 'px';
      var body = span('cp-body');
      body.style.top = top + 'px';
      body.style.height = bodyH + 'px';
      var fill = span('cp-fill');
      body.appendChild(fill);
      btn.appendChild(wick);
      btn.appendChild(body);
      btn.addEventListener('click', function () { jumpTo(s); });
      frag.appendChild(btn);
      return { btn: btn, fill: fill, section: s };
    });
    bar.textContent = '';
    bar.appendChild(frag);
    bar.style.setProperty('--cp-count', String(candles.length));
    return { bar: bar, candles: candles, count: all.length, tops: [], current: -2, frac: -1, at: -1 };
  }

  function jumpTo(s) {
    var head = parseFloat(getComputedStyle(root).getPropertyValue('--runner-h')) || 66;
    var y = s.el.getBoundingClientRect().top + window.scrollY - head - 16;
    var target = s.focus;
    if (!target.hasAttribute('tabindex') && !target.matches('a, button, input, select, textarea')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
    window.scrollTo({ top: Math.max(0, y), behavior: reduced() ? 'auto' : 'smooth' });
  }

  // Section starts in document coordinates; the end of the last is the
  // end of its own content.
  function measureChart(chart) {
    var y = window.scrollY;
    chart.tops = chart.candles.map(function (c) { return c.section.el.getBoundingClientRect().top + y; });
    var last = chart.candles[chart.candles.length - 1].section;
    var lastEl = last.el.tagName === 'SECTION' ? last.el : (last.el.closest('.article-body, main') || last.el);
    chart.end = lastEl.getBoundingClientRect().bottom + y;
    chart.head = parseFloat(getComputedStyle(root).getPropertyValue('--runner-h')) || 66;
  }

  // The reading line runs from the foot of the head at the top of the page
  // to the foot of the screen at the bottom, so the last section completes
  // when the page does.
  function writeChart(chart, y, vh, maxScroll) {
    var p = maxScroll > 0 ? clamp01(y / maxScroll) : 1;
    var line = y + chart.head + (vh - chart.head) * p;
    var tops = chart.tops;
    var n = tops.length;
    var cur = -1;
    for (var i = 0; i < n; i++) if (tops[i] <= line) cur = i;
    var frac = 0;
    if (cur >= 0) {
      var end = cur + 1 < n ? tops[cur + 1] : chart.end;
      frac = end > tops[cur] ? clamp01((line - tops[cur]) / (end - tops[cur])) : 1;
      if (p >= 1) { cur = n - 1; frac = 1; }
    }
    if (cur !== chart.current) {
      chart.candles.forEach(function (c, i) {
        var state = i < cur ? 'read' : i === cur ? 'current' : 'ahead';
        if (c.btn.dataset.state !== state) c.btn.dataset.state = state;
        if (state !== 'current') c.fill.style.transform = '';
      });
      chart.current = cur;
      chart.frac = -1;
    }
    if (cur >= 0) {
      var q = Math.round(frac * 100) / 100;
      if (q !== chart.frac) {
        chart.frac = q;
        chart.candles[cur].fill.style.transform = 'scaleY(' + q + ')';
      }
    }
    // The ink line along the strip: equal cells, so the reader's place is
    // the current section plus how far into it, over the count.
    var at = cur < 0 ? 0 : Math.round(((cur + frac) / n) * 1000) / 1000;
    if (at !== chart.at) {
      chart.at = at;
      chart.bar.style.setProperty('--cp-at', String(at));
    }
  }

  // ── The cover ─────────────────────────────────────────────
  // As the cover scrolls away the portrait drifts down at about a third of
  // the page's speed, so it trails behind, and its three candle layers fade
  // one after another, thinning the face out. Ranges match site.css.
  var COVER_DRIFT = 0.38;               // of the portrait box's height
  var LAYER_RANGES = [[0.08, 0.5], [0.18, 0.66], [0.3, 0.84]];

  function coverFallback(hero) {
    var drift = hero.querySelector('.hero-drift');
    var box = hero.querySelector('.hero-portrait');
    if (!drift || !box) return null;
    var heroH = 1, boxH = 1, top = 0;
    function measure() {
      heroH = Math.max(1, hero.offsetHeight);
      boxH = box.offsetHeight;
      top = hero.getBoundingClientRect().top + window.scrollY;
    }
    measure();
    window.addEventListener('resize', measure);
    var last = -1;
    var layers = [];
    return function (scrollY) {
      var p = clamp01((scrollY - top) / heroH);
      // The layers mount once the portrait's data arrives; look until then.
      if (!layers.length) { layers = drift.querySelectorAll('.portrait-layer'); last = -1; }
      if (p === last) return;
      last = p;
      drift.style.transform = 'translate3d(0,' + (p * COVER_DRIFT * boxH).toFixed(1) + 'px,0)';
      for (var i = 0; i < layers.length; i++) {
        var r = LAYER_RANGES[i] || LAYER_RANGES[LAYER_RANGES.length - 1];
        layers[i].style.opacity = (1 - clamp01((p - r[0]) / (r[1] - r[0]))).toFixed(3);
      }
    };
  }

  // ── Reveals, without scroll timelines ─────────────────────
  // Elements already on screen are marked in the same task as the class
  // that would hide them, so nothing in view ever blinks out.
  function revealFallback() {
    var els = Array.prototype.slice.call(document.querySelectorAll(REVEAL));
    if (!els.length) return;
    var vh = window.innerHeight;
    var tops = els.map(function (el) { return el.getBoundingClientRect().top; });
    root.classList.add('motion-js');
    els.forEach(function (el, i) { if (tops[i] < vh) el.classList.add('is-in'); });
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: REVEAL_MARGIN });
    els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  }

  function init() {
    if (started) return;
    started = true;
    var bar = document.querySelector('.candle-progress');
    var chart = null;
    if (bar) {
      var sections = findSections();
      if (sections.length) chart = buildChart(bar, sections);
      else bar.hidden = true;
    }

    var hero = document.getElementById('hero');
    var cover = !SCROLL_DRIVEN && hero && !reduced() ? coverFallback(hero) : null;
    if (!SCROLL_DRIVEN && !reduced()) revealFallback();
    if (!chart && !cover) return;

    var frame = 0;
    var dirty = true;
    function update() {
      frame = 0;
      var y = window.scrollY;
      var vh = window.innerHeight;
      if (chart) {
        if (dirty) { measureChart(chart); dirty = false; }
        writeChart(chart, y, vh, root.scrollHeight - vh);
      }
      if (cover) cover(y);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function remeasure() {
      // A narrower screen may hold fewer candles, a wider one more.
      if (chart && Math.min(chart.count, capacity(bar)) !== chart.candles.length) {
        chart = buildChart(bar, findSections());
      }
      dirty = true;
      schedule();
    }
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure);
    // Fonts, images and late content move the sections without a resize.
    if (chart && 'ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);
  }

  window.ScrollMotion = { init: init, scrollDriven: SCROLL_DRIVEN };
})();
