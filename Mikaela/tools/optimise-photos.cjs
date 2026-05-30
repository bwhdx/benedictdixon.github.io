// Scan recipes/<slug>/ for originals (any .jpg/.jpeg/.png whose name doesn't
// end in -480/-960/-1440 and doesn't end in .webp), then generate sized
// variants for responsive srcset use. Run after dropping a phone photo into
// the repo: `npm run photos`.
//
// Outputs, per source:
//   hero.jpg         → hero-480.webp, hero-960.webp, hero-1440.webp
//                      hero-480.jpg,  hero-960.jpg,  hero-1440.jpg
//
// Skip files that already have variants newer than the source.

const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp is not installed. Run `npm install` first.');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const RECIPES_DIR = path.join(ROOT, 'recipes');
const WIDTHS = [480, 960, 1440];
const VARIANT_SUFFIX_RE = /-(?:480|960|1440)\.(?:webp|jpg|jpeg|png)$/i;

async function processRecipeDir(dir) {
  const files = fs.readdirSync(dir);
  const sources = files.filter(f => {
    return /\.(jpe?g|png)$/i.test(f) && !VARIANT_SUFFIX_RE.test(f);
  });

  for (const src of sources) {
    const srcPath = path.join(dir, src);
    const base = src.replace(/\.(jpe?g|png)$/i, '');
    const srcStat = fs.statSync(srcPath);

    for (const w of WIDTHS) {
      for (const fmt of ['webp', 'jpg']) {
        const outName = `${base}-${w}.${fmt}`;
        const outPath = path.join(dir, outName);
        if (fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs > srcStat.mtimeMs) {
          continue;
        }
        await sharp(srcPath)
          .resize({ width: w, withoutEnlargement: true })
          [fmt === 'webp' ? 'webp' : 'jpeg']({ quality: 82 })
          .toFile(outPath);
        console.log(`  ${path.relative(ROOT, outPath)}`);
      }
    }
  }
}

async function main() {
  if (!fs.existsSync(RECIPES_DIR)) {
    console.log('No recipes/ directory yet.');
    return;
  }
  const slugs = fs.readdirSync(RECIPES_DIR).filter(name => {
    const full = path.join(RECIPES_DIR, name);
    return fs.statSync(full).isDirectory() && !name.startsWith('.');
  });
  for (const slug of slugs) {
    console.log(`recipes/${slug}/`);
    await processRecipeDir(path.join(RECIPES_DIR, slug));
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
