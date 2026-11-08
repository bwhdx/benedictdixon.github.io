// Lays out one share card in card.html. Called by tools/generate-cards.cjs
// through window.renderCard(spec) once per card, on the same page:
//
//   spec.variant    'navy' | 'cover'
//   spec.titleHtml  navy: the title, with only <em> and <br> (checked upstream)
//   spec.line       navy: the line under the title (cover line or byline)
//   spec.cover      cover: the essay's cover as a data: URL
//   spec.grid       navy: the portrait's brightness grid
//
// The navy portrait is drawn with the site's own renderer
// (portrait-renderers.jsx, compiled and injected by the generator before
// this runs): toneMap, layoutCandles, candleBounds, drawCandles, PALETTE.
//
// On navy the text is set at the largest size that fits. When no size
// fits, renderCard throws, so a bad card fails the build instead of
// shipping. A cover card is the essay's cover, which already carries its
// title, mark and address, so nothing is set over it.

'use strict';

const W = 1200;
const H = 630;

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
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f)));
  const missing = faces.filter((f) => !document.fonts.check(f));
  if (missing.length) throw new Error(`fonts did not load: ${missing.join(', ')}`);
}

async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

// Cover-fit, centred: the 16:9 cover fills the 1200 x 630 sheet, losing
// an even sliver at the top and the foot.
async function drawGround(src) {
  const img = await loadImage(src);
  const canvas = $('.ground');
  const ctx = canvas.getContext('2d');
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
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

  if (spec.variant === 'cover') {
    await drawGround(spec.cover);
    return { lines: 0 };
  }
  if (spec.variant === 'navy') {
    const candles = drawPortrait(spec.grid);
    return { ...fitNavy(), candles };
  }
  throw new Error(`unknown variant ${spec.variant}`);
};
