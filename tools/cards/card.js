// Lays out one share card in card.html. Called by tools/generate-cards.cjs
// through window.renderCard(spec) once per card, on the same page:
//
//   spec.variant    'navy' | 'paper'
//   spec.titleHtml  the title, with only <em> and <br> (checked upstream)
//   spec.line       navy: the line under the title (cover line or byline)
//   spec.cover      paper: the illustration as a data: URL
//   spec.cipher     { candles, letters }: the bwhdx mark's data
//   spec.grid       navy: the portrait's brightness grid
//
// The navy portrait is drawn with the site's own renderer
// (portrait-renderers.jsx, compiled and injected by the generator before
// this runs): toneMap, layoutCandles, candleBounds, drawCandles, PALETTE.
//
// The text is set at the largest size that fits. On paper "fits" also means
// clear of the illustration: the ground is sampled under every line of the
// title and under the mark, and any ink there rejects the size. When no
// size fits, renderCard throws, so a bad card fails the build instead of
// shipping.

'use strict';

const W = 1200;
const H = 630;

// Paper: the title steps down from the largest size, trying a narrower
// column at each size before going smaller, so it wraps away from an
// illustration that reaches into the top left before it shrinks.
const PAPER = {
  sizes: range(72, 40, 2),
  widths: [600, 540, 480, 420, 360],
  maxLines: 4,
  footMargin: 48,   // the sign never sits closer than this to the foot
  clearance: 14,    // ink-free margin around each line and the mark, px
  inkTolerance: 6,  // stray ink pixels allowed in that margin (paper grain)
};

// Navy: the title first, then the line, step down until the column clears
// the top strip.
const NAVY = {
  titleSizes: range(84, 36, 2),
  lineSizes: range(26, 18, 2),
  maxLines: 3,
  topLimit: 100,    // the column's top never rises above this
};

// A hyphenated word never breaks at its hyphen ("Co-founder", "follow-on"):
// each is wrapped in a no-break span. Only text between tags is touched.
// A hyphen the title breaks at on purpose ("decision-<br>") is followed by
// a tag, so it is left alone.
function keepHyphenated(html) {
  return html.replace(/(^|>)([^<]+)/g, (_, gt, text) =>
    gt + text.replace(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu, '<span class="nb">$&</span>'));
}

// Each line the title breaks on purpose becomes its own block, so balanced
// wrapping evens out each part on its own and never leaves one word alone
// under a long line. (Balance across a forced break does not.)
const segments = (html) => html.split(/<br\s*\/?>/i).map((part) => `<span class="seg">${part}</span>`).join('');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function range(from, to, step) {
  const out = [];
  for (let v = from; v >= to; v -= step) out.push(v);
  return out;
}

const $ = (sel) => document.querySelector(sel);

async function fontsReady() {
  const faces = [
    '400 84px "Fraunces"',
    'italic 300 84px "Fraunces"',
    '400 16px "Inter"',
    '400 22px "JetBrains Mono"',
    '500 15px "JetBrains Mono"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f)));
  const missing = faces.filter((f) => !document.fonts.check(f));
  if (missing.length) throw new Error(`fonts did not load: ${missing.join(', ')}`);
}

// The bwhdx mark, drawn as the site's Cipher component draws it.
function cipherSvg({ candles, letters }) {
  const parts = candles.map(([x, top, bottom, bodyTop, bodyH, filled]) =>
    `<line x1="${x}" x2="${x}" y1="${top}" y2="${bottom}" stroke-width="2.4"/>`
    + `<rect x="${x - 4.5}" y="${bodyTop}" width="9" height="${bodyH}" stroke-width="2.4" fill="${filled ? 'currentColor' : 'none'}"/>`);
  for (const [x, ch] of letters) {
    parts.push(`<text x="${x}" y="76" text-anchor="middle" stroke="none" fill="currentColor"`
      + ` font-family="JetBrains Mono" font-size="15" font-weight="500">${ch}</text>`);
  }
  return '<svg viewBox="0 0 100 82" fill="none" stroke="currentColor" stroke-linecap="butt"'
    + ` stroke-linejoin="miter" aria-hidden="true">${parts.join('')}</svg>`;
}

async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

// Cover-fit, centred: the illustration fills the sheet, as on the site.
// Returns the drawn pixels, which the collision test reads.
async function drawGround(src) {
  const img = await loadImage(src);
  const canvas = $('.ground');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return ctx.getImageData(0, 0, W, H);
}

// The candle portrait, contained in its box at the site's pitch (about 170
// columns across the face), in three layers as the site draws it.
function drawPortrait(grid) {
  const box = $('.portrait');
  box.replaceChildren();
  const { width, height } = box.getBoundingClientRect();
  const tm = toneMap(grid);
  const faceW = Math.min(width, height * tm.aspect);
  const lay = layoutCandles(tm, width, height, {
    fit: 'contain', align: [0.5, 0.5], focus: [0.5, 0.52], pitch: Math.max(3, faceW / 170),
  });
  const bounds = candleBounds(lay, width, height);
  for (let layer = 0; layer < 3; layer++) {
    const canvas = document.createElement('canvas');
    canvas.width = bounds.w;
    canvas.height = bounds.h;
    canvas.style.left = `${bounds.x}px`;
    canvas.style.top = `${bounds.y}px`;
    box.append(canvas);
    drawCandles(canvas.getContext('2d'), lay, bounds, layer, PALETTE, 1, 1);
  }
  return lay.cells.length;
}

// Ink under a rect: navy or blue pixels, which are bluer than red; the
// paper is the reverse by a wide margin.
function inkIn(pixels, rect, pad) {
  const x0 = Math.max(0, Math.floor(rect.left - pad)), x1 = Math.min(W, Math.ceil(rect.right + pad));
  const y0 = Math.max(0, Math.floor(rect.top - pad)), y1 = Math.min(H, Math.ceil(rect.bottom + pad));
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4;
      if (pixels.data[i + 2] - pixels.data[i] > 12) n++;
    }
  }
  return n;
}

function textRects(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  return [...r.getClientRects()].filter((b) => b.width > 0 && b.height > 0);
}

function lineCount(el) {
  const lh = parseFloat(getComputedStyle(el).lineHeight);
  return Math.round((el.getBoundingClientRect().height - parseFloat(getComputedStyle(el).paddingTop)) / lh);
}

// No word wider than the column.
function overflows(el) {
  const box = el.getBoundingClientRect();
  return textRects(el).some((b) => b.right > box.right + 0.5 || b.left < box.left - 0.5);
}

function fitPaper(pixels) {
  const column = $('.column'), title = $('.title'), sign = $('.sign');
  const tried = [];
  for (const size of PAPER.sizes) {
    for (const width of PAPER.widths) {
      column.style.setProperty('--column-width', `${width}px`);
      title.style.setProperty('--title-size', `${size}px`);
      const lines = lineCount(title);
      const foot = sign.getBoundingClientRect().bottom;
      // The ink test reads what is drawn: each line of the title, the mark
      // and the address, never the column's or the sign's empty box.
      const ink = [...textRects(title), $('.mark').getBoundingClientRect(), ...textRects($('.site'))]
        .reduce((n, b) => n + inkIn(pixels, b, PAPER.clearance), 0);
      const fault = lines > PAPER.maxLines ? `${lines} lines`
        : overflows(title) ? 'overflow'
          : foot > H - PAPER.footMargin ? 'too low'
            : ink > PAPER.inkTolerance ? `${ink} ink px` : null;
      if (!fault) return { size, width, lines, tried };
      tried.push(`${size}/${width}: ${fault}`);
    }
  }
  throw new Error(`the title does not fit clear of the illustration (${tried.slice(-3).join('; ')})`);
}

function fitNavy() {
  const column = $('.column'), title = $('.title'), line = $('.line');
  for (const size of NAVY.titleSizes) {
    title.style.setProperty('--title-size', `${size}px`);
    for (const lineSize of NAVY.lineSizes) {
      line.style.setProperty('--line-size', `${lineSize}px`);
      const lines = lineCount(title);
      if (lines <= NAVY.maxLines && !overflows(title) && !overflows(line)
        && column.getBoundingClientRect().top >= NAVY.topLimit) {
        return { size, lineSize, lines };
      }
    }
  }
  throw new Error('the title and line do not fit the cover');
}

window.renderCard = async function renderCard(spec) {
  await fontsReady();
  const card = $('#card');
  card.dataset.variant = spec.variant;
  for (const el of [$('.column'), $('.title'), $('.line')]) el.removeAttribute('style');
  $('.title').innerHTML = segments(keepHyphenated(spec.titleHtml));
  $('.line').innerHTML = keepHyphenated(escapeHtml(spec.line || ''));
  $('[data-slot="mark"]').innerHTML = cipherSvg(spec.cipher);

  if (spec.variant === 'paper') {
    const pixels = await drawGround(spec.cover);
    return fitPaper(pixels);
  }
  if (spec.variant === 'navy') {
    const candles = drawPortrait(spec.grid);
    return { ...fitNavy(), candles };
  }
  throw new Error(`unknown variant ${spec.variant}`);
};
