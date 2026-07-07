// Generate per-article Open Graph images.
// Same book-cover layout as the site OG image, with the article title in the
// bottom band. Writes assets/og/<slug>.png for every article plus /ai/.
// Usage: node tools/generate-og-articles.cjs

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const gridPath = path.join(ROOT, 'assets', 'beanie_hero_16x9_navySides.json');
const outDir = path.join(ROOT, 'assets', 'og');

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
const BOTTOM_BAR = 200;
const portraitTop = TOP_BAR;
const portraitH = H - TOP_BAR - BOTTOM_BAR;

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function portraitSvg() {
  const gridAspect = cols / rows;
  const portraitAspect = W / portraitH;
  let drawW, drawH, drawX, drawY;
  if (portraitAspect > gridAspect) {
    drawW = W; drawH = W / gridAspect; drawX = 0;
    drawY = portraitTop + (portraitH - drawH) / 2;
  } else {
    drawH = portraitH; drawW = portraitH * gridAspect;
    drawX = (W - drawW) / 2; drawY = portraitTop;
  }
  const colW = drawW / cols;
  const rowH = drawH / rows;
  const wickW = Math.max(0.8, colW * 0.13);
  const bodyW = colW;
  const coverage = (v, lo = 50, hi = 200) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));

  let svg = '';
  svg += `<rect x="0" y="${portraitTop}" width="${W}" height="${portraitH}" fill="${PAPER}"/>\n`;
  svg += `<defs><clipPath id="pclip"><rect x="0" y="${portraitTop}" width="${W}" height="${portraitH}"/></clipPath></defs>\n`;
  svg += `<g clip-path="url(#pclip)">\n`;
  for (let c = 0; c < cols; c++) {
    const x = drawX + c * colW + (colW - wickW) / 2;
    svg += `<rect x="${x.toFixed(2)}" y="${drawY.toFixed(2)}" width="${wickW.toFixed(2)}" height="${drawH.toFixed(2)}" fill="${INK}"/>`;
  }
  svg += '\n';
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
  return svg;
}

function wrapTitle(title, maxChars) {
  const words = title.split(' ');
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (cur && (cur + ' ' + w).length > maxChars) lines.push(w);
    else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
  }
  return lines;
}

function articleSvg(portrait, { title, kicker, dateLabel }) {
  const bandY = H - BOTTOM_BAR;
  let svg = '';
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n`;
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${INK}"/>\n`;
  svg += portrait;

  svg += `<line x1="40" y1="${TOP_BAR}" x2="${W - 40}" y2="${TOP_BAR}" stroke="${HAIR_TOP}" stroke-width="1"/>\n`;
  svg += `<text x="40" y="${TOP_BAR - 22}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="14" fill="${PAPER}" letter-spacing="2">AN ALMANACK FOR FINANCE, OPERATIONS &amp; CODE</text>\n`;
  svg += `<text x="${W - 40}" y="${TOP_BAR - 22}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="14" fill="${PAPER_SOFT}" letter-spacing="2" text-anchor="end">VOL. I · MMXXVI · EDITION 01</text>\n`;

  svg += `<text x="40" y="${bandY + 34}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="${PAPER_SOFT}" letter-spacing="2">${esc(kicker.toUpperCase())}</text>\n`;
  if (dateLabel) {
    svg += `<text x="${W - 40}" y="${bandY + 34}" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="12" fill="${PAPER_SOFT}" letter-spacing="2" text-anchor="end">${esc(dateLabel.toUpperCase())}</text>\n`;
  }

  const lines = wrapTitle(title, 44);
  const size = lines.length > 1 ? 40 : 48;
  const firstY = lines.length > 1 ? bandY + 84 : bandY + 96;
  lines.slice(0, 2).forEach((line, i) => {
    svg += `<text x="40" y="${firstY + i * (size + 10)}" font-family="Fraunces, 'Times New Roman', serif" font-size="${size}" font-weight="500" fill="${PAPER}">${esc(line)}</text>\n`;
  });

  svg += `<line x1="40" y1="${bandY + 150}" x2="${W - 40}" y2="${bandY + 150}" stroke="${HAIR_BOT}" stroke-width="1"/>\n`;
  svg += `<text x="40" y="${bandY + 180}" font-family="Inter, system-ui, sans-serif" font-size="18" fill="${PAPER}">Benedict W. H. Dixon — an operator at the intersection of <tspan font-style="italic">AI &amp; finance.</tspan></text>\n`;
  svg += `</svg>\n`;
  return svg;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

function extract(file) {
  const html = fs.readFileSync(file, 'utf8');
  const rawTitle = (html.match(/property="og:title" content="([^"]+)"/) || [])[1];
  const rawKicker = (html.match(/<span>(§ [^<]+)<\/span>/) || [, '§ Essay'])[1];
  const date = (html.match(/"datePublished": "([^"]+)"/) || [])[1] || '';
  return {
    title: rawTitle && decodeEntities(rawTitle),
    kicker: decodeEntities(rawKicker),
    dateLabel: date,
  };
}

fs.mkdirSync(outDir, { recursive: true });
const portrait = portraitSvg();

const pages = fs.readdirSync(path.join(ROOT, 'writing'), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => ({ slug: d.name, file: path.join(ROOT, 'writing', d.name, 'index.html') }));
pages.push({ slug: 'ai', file: path.join(ROOT, 'ai', 'index.html') });

for (const { slug, file } of pages) {
  const meta = extract(file);
  if (!meta.title) { console.warn(`skip ${slug}: no og:title`); continue; }
  const svgPath = path.join(outDir, `${slug}.svg`);
  const pngPath = path.join(outDir, `${slug}.png`);
  fs.writeFileSync(svgPath, articleSvg(portrait, meta));
  execFileSync('rsvg-convert', ['-w', String(W), '-h', String(H), svgPath, '-o', pngPath]);
  execFileSync('pngquant', ['--quality=75-95', '--strip', '--force', '--output', pngPath, pngPath]);
  fs.unlinkSync(svgPath);
  console.log(`Wrote assets/og/${slug}.png`);
}
