// The share cards (Open Graph and Twitter images), 1200 x 630 PNG, drawn
// from the template in tools/cards/ in headless Chromium with the site's
// own fonts and candle portrait renderer.
//
//   node tools/generate-cards.cjs [--covers-dir <dir>] [--verbose]
//
//   home     assets/og-image.png        the navy cover: portrait, name, cover line
//   ai       assets/og/ai.png           the navy cover with the page's title
//   <slug>   assets/og/<slug>.png       per essay: the paper card with its
//                                      cover illustration, or the navy cover
//                                      with its title when it has no cover
//
// An essay's cover is its repo cover (assets/covers/<slug>.jpg). With
// --covers-dir, an essay without one is drawn from <dir>/cover-<slug>-plain.png
// if that exists: a pending cover, read to render the card and never copied
// into the repo.
//
// --verbose prints, for each paper card, the sizes the fit rejected and why.
//
// Writes assets/og/cards.json, the manifest: per card its file, alt text,
// a hash of every input, and the cover it was drawn from. cardStatus()
// (exported, no browser) recomputes the hashes from the current inputs, so
// the publish check fails on a stale or missing card.
//
// Needs pngquant on PATH and a Playwright Chromium (tools/browser.cjs).

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { execFileSync } = require('child_process');
const { ROOT, COVER_LINE, essays, decode } = require('./site-data.cjs');

// Bump when the rendering changes outside the hashed template files (the
// compression settings, the card geometry, the inputs fed to the template).
const TEMPLATE_VERSION = 1;

const W = 1200;
const H = 630;
// Platforms take up to 5 MB; small cards load fast in a feed.
const MAX_BYTES = 240 * 1024;
const NAME = 'Benedict W. H. Dixon';
const NAME_HTML = 'Benedict W.&nbsp;H. <em>Dixon.</em>';

const CARDS_DIR = path.join(__dirname, 'cards');
const TEMPLATE_FILES = ['card.html', 'card.css', 'card.js'].map((f) => path.join(CARDS_DIR, f));
const FONT_FILES = ['fraunces-latin.woff2', 'fraunces-italic-latin.woff2', 'inter-latin.woff2', 'jetbrains-mono-latin.woff2']
  .map((f) => path.join(ROOT, 'assets', 'fonts', f));
const GRID_FILE = path.join(ROOT, 'assets', 'beanie_hero_16x9_navySides.json');
const RENDERER_FILE = path.join(ROOT, 'portrait-renderers.jsx');
const CIPHER_SOURCE = path.join(ROOT, 'site-content.jsx');
const MANIFEST = path.join(ROOT, 'assets', 'og', 'cards.json');

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
const sha256 = (...parts) => {
  const h = crypto.createHash('sha256');
  for (const p of parts) h.update(p).update('\0');
  return h.digest('hex');
};
const fileHash = (file) => sha256(fs.readFileSync(file));

// The bwhdx mark's data, read from the site's Cipher component so the mark
// has one source. Fails loudly if the shape of that source changes.
function cipherData() {
  const src = fs.readFileSync(CIPHER_SOURCE, 'utf8');
  const block = (name) => {
    const m = src.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\]);`));
    if (!m) throw new Error(`${rel(CIPHER_SOURCE)}: ${name} not found`);
    return JSON.parse(m[1].replace(/\/\/.*$/gm, '').replace(/'/g, '"').replace(/,(\s*[\]}])/g, '$1'));
  };
  return { candles: block('CIPHER_CANDLES'), letters: block('CIPHER_LETTERS') };
}

// Titles are page markup; only <em> and <br> may reach the template.
function checkTitle(html, where) {
  const tags = html.match(/<[^>]*>/g) || [];
  const bad = tags.filter((t) => !/^<\/?em>$|^<br\s*\/?>$/.test(t));
  if (bad.length) throw new Error(`${where}: title has markup the card cannot take: ${bad.join(' ')}`);
  // The card sets each part between breaks as its own block, so emphasis
  // must open and close within a part.
  for (const part of html.split(/<br\s*\/?>/)) {
    if ((part.match(/<em>/g) || []).length !== (part.match(/<\/em>/g) || []).length) {
      throw new Error(`${where}: title has <em> across a line break`);
    }
  }
  return html;
}

// The title as read: a break after a hyphen joins the word, any other is a space.
const plainTitle = (html) => decode(html.replace(/-\s*<br\s*\/?>/g, '-').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ''))
  .replace(/\s+/g, ' ').trim();

function pageTitle(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = html.match(/<h1 class="ttl">([\s\S]*?)<\/h1>/);
  if (!m) throw new Error(`${file}: no <h1 class="ttl">`);
  return m[1].trim();
}

// Every card, in manifest order, with everything that decides its pixels.
// coverFor(essay) returns { source, file, path } or null; file is absent
// when the cover cannot be read (a pending cover, from cardStatus).
function plan(coverFor) {
  const navy = (key, file, titleHtml, line, alt) => ({
    key, file, variant: 'navy', titleHtml, line, alt, cover: null,
  });
  const cards = [
    navy('home', 'assets/og-image.png', NAME_HTML, COVER_LINE,
      `Share card for ${NAME}'s site: a portrait of him drawn in ochre candlesticks on a navy book cover,`
      + ` with his name and the line "${COVER_LINE}"`),
  ];
  const ai = checkTitle(pageTitle('ai/index.html'), 'ai/index.html');
  cards.push(navy('ai', 'assets/og/ai.png', ai, NAME,
    `Share card: the title "${plainTitle(ai)}" by ${NAME} on a navy book cover, beside a portrait of him drawn in ochre candlesticks.`));
  for (const e of essays()) {
    const titleHtml = checkTitle(e.titleHtml, e.file);
    const title = plainTitle(titleHtml);
    const file = `assets/og/${e.slug}.png`;
    const cover = coverFor(e);
    cards.push(cover
      ? {
        key: e.slug, file, variant: 'paper', titleHtml, line: null, cover,
        alt: `Share card: the essay title "${title}" set in navy on ochre paper, beside the essay's illustration`
          + ' in blue ink, with the bwhdx candle mark and benedictdixon.com.',
      }
      : navy(e.slug, file, titleHtml, NAME,
        `Share card: the essay title "${title}" by ${NAME} on a navy book cover, beside a portrait of him drawn in ochre candlesticks.`));
  }
  return cards;
}

// The hash of everything but the cover's bytes; the card's hash then folds
// in the cover's own hash, so a pending cover can be checked without it.
function baseHash(card, shared) {
  return sha256(
    `template ${TEMPLATE_VERSION}`, shared.template, shared.fonts, JSON.stringify(shared.cipher),
    card.variant, card.titleHtml, card.line || '',
    card.variant === 'navy' ? shared.grid : '', card.variant === 'navy' ? shared.renderer : '',
    card.cover ? `${card.cover.source}:${card.cover.path}` : '',
  );
}
const cardHash = (base, coverSha) => sha256(base, coverSha || '');

function sharedInputs() {
  return {
    template: sha256(...TEMPLATE_FILES.map(fileHash)),
    fonts: sha256(...FONT_FILES.map(fileHash)),
    grid: fileHash(GRID_FILE),
    renderer: fileHash(RENDERER_FILE),
    cipher: cipherData(),
  };
}

function repoCover(e) {
  return e.cover ? { source: 'repo', path: e.cover, file: path.join(ROOT, e.cover) } : null;
}

function readManifest() {
  return fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : null;
}

// For the publish check: is every card present and drawn from the current
// inputs? A card drawn from a pending cover cannot have its cover re-read;
// it passes when everything else matches and the essay still has no repo
// cover (the repo cover would win on the next run).
function cardStatus() {
  const manifest = readManifest();
  const recorded = (manifest && manifest.cards) || {};
  const shared = sharedInputs();
  const pending = (e) => {
    const c = recorded[e.slug] && recorded[e.slug].cover;
    return c && c.source === 'pending' ? { source: 'pending', path: c.path, sha256: c.sha256 } : null;
  };
  const cards = plan((e) => repoCover(e) || pending(e));
  const out = [];
  for (const card of cards) {
    const status = (ok, reason) => out.push({ key: card.key, file: card.file, ok, reason });
    const entry = recorded[card.key];
    if (!manifest) { status(false, `no manifest at ${rel(MANIFEST)}; run the card generator`); continue; }
    if (!entry) { status(false, 'not in the card manifest; run the card generator'); continue; }
    if (!fs.existsSync(path.join(ROOT, card.file))) { status(false, 'the card image is missing'); continue; }
    if (entry.file !== card.file) { status(false, `the manifest names ${entry.file}`); continue; }
    if (!entry.cover && card.cover) { status(false, 'drawn without a cover, but the essay now has one'); continue; }
    if (entry.cover && entry.cover.source === 'pending' && card.cover && card.cover.source === 'repo') {
      status(false, 'drawn from a pending cover, but the essay now has a repo cover'); continue;
    }
    const coverSha = card.cover ? (card.cover.file ? fileHash(card.cover.file) : card.cover.sha256) : null;
    const expected = cardHash(baseHash(card, shared), coverSha);
    if (entry.hash !== expected) { status(false, 'stale: an input changed since the card was drawn'); continue; }
    if (card.cover && card.cover.source === 'pending') {
      status(true, `drawn from a pending cover outside the repo (${card.cover.path}); the cover itself cannot be re-checked`);
    } else status(true, 'current');
  }
  const keys = new Set(cards.map((c) => c.key));
  for (const [key, entry] of Object.entries(recorded)) {
    if (!keys.has(key)) out.push({ key, file: entry.file, ok: false, reason: 'in the manifest but no longer a page' });
  }
  return out;
}

// ── Rendering ───────────────────────────────────────────

function args(argv) {
  const out = { coversDir: null, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--covers-dir' && argv[i + 1]) out.coversDir = path.resolve(argv[++i]);
    else if (argv[i] === '--verbose') out.verbose = true;
    else throw new Error(`unknown argument ${argv[i]}; usage: node tools/generate-cards.cjs [--covers-dir <dir>] [--verbose]`);
  }
  if (out.coversDir && !fs.statSync(out.coversDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`--covers-dir ${out.coversDir} is not a directory`);
  }
  return out;
}

// A pending cover is recorded by file name only: where it sits on this
// machine is no business of the repo.
function coverResolver(coversDir) {
  return (e) => {
    const own = repoCover(e);
    if (own || !coversDir) return own;
    const file = path.join(coversDir, `cover-${e.slug}-plain.png`);
    return fs.existsSync(file) ? { source: 'pending', path: path.basename(file), file } : null;
  };
}

// The site's renderer, compiled from its JSX source as the build does, so
// the card's portrait is the cover's portrait.
function rendererScript() {
  const babel = require('@babel/core');
  const { code } = babel.transformSync(fs.readFileSync(RENDERER_FILE, 'utf8'), {
    filename: RENDERER_FILE, babelrc: false, configFile: false, presets: ['@babel/preset-react'],
  });
  return code;
}

const dataUrl = (file, bytes) => {
  const type = /\.png$/i.test(file) ? 'image/png' : /\.jpe?g$/i.test(file) ? 'image/jpeg' : null;
  if (!type) throw new Error(`${file}: not a PNG or JPEG`);
  return `data:${type};base64,${bytes.toString('base64')}`;
};

// Quantised to a palette at the highest quality that fits the budget: the
// navy cards fit at the top of the ladder, the paper cards' grain costs
// bytes and steps them down. The card replaces the old one only once it is
// within the budget.
const QUALITY_LADDER = [85, 80, 75, 70, 65, 60];
function compress(src, dest) {
  const packed = `${src}.min.png`;
  for (const max of QUALITY_LADDER) {
    execFileSync('pngquant', [`--quality=0-${max}`, '--speed=1', '--strip', '--force', '--output', packed, src]);
    const bytes = fs.statSync(packed).size;
    if (bytes <= MAX_BYTES) {
      fs.copyFileSync(packed, dest);
      return { bytes, quality: max };
    }
  }
  throw new Error(`${rel(dest)} does not fit the ${MAX_BYTES / 1024} KB budget at quality ${QUALITY_LADDER.at(-1)}`);
}

async function generate({ coversDir, verbose }) {
  const { launch } = require('./browser.cjs');
  const shared = sharedInputs();
  const cards = plan(coverResolver(coversDir));
  const grid = JSON.parse(fs.readFileSync(GRID_FILE, 'utf8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cards-'));
  const manifest = { version: TEMPLATE_VERSION, cards: {} };
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    await page.goto(pathToFileURL(TEMPLATE_FILES[0]).href);
    await page.addScriptTag({ content: rendererScript() });
    await page.evaluate((g) => { window.CARD_GRID = g; }, grid);
    for (const card of cards) {
      // The cover is read once: the bytes drawn are the bytes hashed.
      const coverBytes = card.cover ? fs.readFileSync(card.cover.file) : null;
      const spec = {
        variant: card.variant, titleHtml: card.titleHtml, line: card.line, cipher: shared.cipher,
        cover: coverBytes ? dataUrl(card.cover.file, coverBytes) : null,
      };
      let fit;
      try {
        fit = await page.evaluate((s) => window.renderCard({ ...s, grid: window.CARD_GRID }), spec);
      } catch (err) {
        throw new Error(`${card.key}: ${err.message}`);
      }
      if (pageErrors.length) throw new Error(`${card.key}: script error in the template: ${pageErrors.join('; ')}`);
      const raw = path.join(tmp, `${card.key}.png`);
      await page.locator('#card').screenshot({ path: raw, animations: 'disabled' });
      const out = path.join(ROOT, card.file);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const { bytes, quality } = compress(raw, out);
      const coverSha = coverBytes ? sha256(coverBytes) : null;
      manifest.cards[card.key] = {
        file: card.file,
        alt: card.alt,
        hash: cardHash(baseHash(card, shared), coverSha),
        cover: card.cover ? { source: card.cover.source, path: card.cover.path, sha256: coverSha } : null,
      };
      const how = card.variant === 'paper' ? `paper, ${card.cover.source} cover, title ${fit.size}px in ${fit.width}px`
        : `navy, title ${fit.size}px, line ${fit.lineSize}px`;
      console.log(`${card.file}  ${(bytes / 1024).toFixed(0)} KB at q${quality}  (${how}, ${fit.lines} lines)`);
      if (verbose && fit.tried && fit.tried.length) console.log(`    rejected: ${fit.tried.join('; ')}`);
    }
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${cards.length} cards and ${rel(MANIFEST)}`);
}

module.exports = { cardStatus };

if (require.main === module) {
  Promise.resolve().then(() => generate(args(process.argv.slice(2)))).catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
