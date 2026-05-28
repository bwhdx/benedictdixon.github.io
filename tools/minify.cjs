// Compact the brightness-grid JSONs in place. CSS is left readable; the
// transfer-size win on CSS is already captured by GitHub Pages' gzip,
// while parse-time is negligible. The JSONs are pure data, no source
// to preserve.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

['beanie_hero_16x9_navySides.json', 'beanie_morph_grid.json'].forEach((name) => {
  const p = path.join(ROOT, 'assets', name);
  const raw = fs.readFileSync(p, 'utf8');
  const min = JSON.stringify(JSON.parse(raw));
  fs.writeFileSync(p, min);
  console.log(`${name}: ${(raw.length / 1024).toFixed(1)} KB → ${(min.length / 1024).toFixed(1)} KB`);
});
