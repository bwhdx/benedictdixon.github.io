// Generate the Open Graph cover image.
// Reads the brightness grid used by the hero, renders the candlestick face,
// composes it inside a book-cover layout (navy bands top/bottom, cream centre),
// and writes assets/og-image.svg. Convert to PNG with:
//   magick assets/og-image.svg assets/og-image.png

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const gridPath = path.join(ROOT, 'assets', 'beanie_hero_16x9_navySides.json');
const outSvg   = path.join(ROOT, 'assets', 'og-image.svg');

const grid = JSON.parse(fs.readFileSync(gridPath, 'utf8'));
const { cols, rows, data } = grid;

const INK = '#1c267a';
const PAPER = '#d6c585';
const PAPER_SOFT = 'rgba(214,197,133,0.65)';
const HAIR_TOP = 'rgba(214,197,133,0.4)';
const HAIR_BOT = 'rgba(214,197,133,0.25)';

const W = 1200;
const H = 630;
const TOP_BAR = 60;
const BOTTOM_BAR = 170;
const portraitTop = TOP_BAR;
const portraitH = H - TOP_BAR - BOTTOM_BAR; // 400

// Cover-fit the grid into the portrait area
const gridAspect = cols / rows;
const portraitAspect = W / portraitH;
let drawW, drawH, drawX, drawY;
if (portraitAspect > gridAspect) {
  drawW = W;
  drawH = W / gridAspect;
  drawX = 0;
  drawY = portraitTop + (portraitH - drawH) / 2;
} else {
  drawH = portraitH;
  drawW = portraitH * gridAspect;
  drawX = (W - drawW) / 2;
  drawY = portraitTop;
}

const colW = drawW / cols;
const rowH = drawH / rows;
const wickW = Math.max(0.8, colW * 0.13);
const bodyW = colW;

function coverage(v, lo = 50, hi = 200) {
  const t = (v - lo) / (hi - lo);
  return Math.max(0, Math.min(1, t));
}

let svg = '';
svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n`;

// Navy fills the whole canvas; cream rect just for the portrait area.
svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${INK}"/>\n`;
svg += `<rect x="0" y="${portraitTop}" width="${W}" height="${portraitH}" fill="${PAPER}"/>\n`;

// Clip candle drawing to the portrait area.
svg += `<defs><clipPath id="pclip"><rect x="0" y="${portraitTop}" width="${W}" height="${portraitH}"/></clipPath></defs>\n`;
svg += `<g clip-path="url(#pclip)">\n`;

// Navy wicks every column
for (let c = 0; c < cols; c++) {
  const x = drawX + c * colW + (colW - wickW) / 2;
  svg += `<rect x="${x.toFixed(2)}" y="${drawY.toFixed(2)}" width="${wickW.toFixed(2)}" height="${drawH.toFixed(2)}" fill="${INK}"/>`;
}
svg += '\n';

// Candle bodies with gamma curve (matches live renderer)
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const cov = 1 - coverage(data[r][c], 50, 200);
    if (cov > 0.05) {
      const filled = Math.pow(cov, 0.65);
      const w = wickW + (bodyW - wickW) * filled;
      const x = drawX + c * colW + (colW - w) / 2;
      const y = drawY + r * rowH;
      svg += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(w + 0.4).toFixed(2)}" height="${(rowH + 0.5).toFixed(2)}" fill="${INK}"/>`;
    }
  }
  svg += '\n';
}

svg += `</g>\n`;

// Top meta strip
svg += `<line x1="40" y1="${TOP_BAR}" x2="${W - 40}" y2="${TOP_BAR}" stroke="${HAIR_TOP}" stroke-width="1"/>\n`;
svg += `<text x="40" y="${TOP_BAR - 22}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="14" fill="${PAPER}" letter-spacing="2">AN ALMANACK FOR FINANCE, OPERATIONS &amp; CODE</text>\n`;
svg += `<text x="${W - 40}" y="${TOP_BAR - 22}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="14" fill="${PAPER_SOFT}" letter-spacing="2" text-anchor="end">VOL. I · MMXXVI · EDITION 01</text>\n`;

// Bottom band
const bandY = H - BOTTOM_BAR;
svg += `<line x1="40" y1="${bandY + 30}" x2="${W - 40}" y2="${bandY + 30}" stroke="${HAIR_BOT}" stroke-width="1"/>\n`;
svg += `<text x="40" y="${bandY + 22}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="${PAPER_SOFT}" letter-spacing="2">§ COVER</text>\n`;
svg += `<text x="${W - 40}" y="${bandY + 22}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="${PAPER_SOFT}" letter-spacing="2" text-anchor="end">PORTRAIT RENDERED IN 14,560 CANDLES</text>\n`;

// Title
svg += `<text x="40" y="${bandY + 100}" font-family="Fraunces, 'Times New Roman', serif" font-size="64" font-weight="500" fill="${PAPER}">Benedict W. H. <tspan font-style="italic">Dixon.</tspan></text>\n`;

// Tagline
svg += `<line x1="40" y1="${bandY + 120}" x2="${W - 40}" y2="${bandY + 120}" stroke="${HAIR_BOT}" stroke-width="1"/>\n`;
svg += `<text x="40" y="${bandY + 152}" font-family="Inter, system-ui, sans-serif" font-size="20" fill="${PAPER}">An operator at the intersection of <tspan font-style="italic">finance, blockchain &amp; AI.</tspan></text>\n`;

svg += `</svg>\n`;

fs.writeFileSync(outSvg, svg);
console.log(`Wrote ${outSvg} (${(svg.length / 1024).toFixed(1)} KB)`);
