// The site's shared facts, read by the build, the share cards and the
// publish check, so each is written once.
//
//   COVER_LINE   the line under his name on the cover (and on the cards)
//   essays()     every live essay, read from its own page: the page is the
//                source of truth, and everything that lists essays (the
//                home page, the sitemap, the feed, llms.txt, the 404 page)
//                is generated from this one list
//
// Read-only: nothing here writes a file.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://benedictdixon.com';

// The cover line. One sentence or two, plain text; it is set under his name
// on the cover and on the home share card. Swap it here, then run
// `npm run build` and `npm run build:og`.
const COVER_LINE = 'Technical founder and operator. I build the product and run the company around it.';

// The analytics beacon is live on a page when its script tag is outside an
// HTML comment (README, Analytics). The colophon's privacy note follows it,
// so the note can never claim more or less than the page does.
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
function beaconLive(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').includes(`src="${BEACON_SRC}"`);
}
function privacyNote() {
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return beaconLive(home)
    ? 'No cookies. Anonymous page counts by Cloudflare Web Analytics.'
    : 'No cookies, and no analytics.';
}

// The book's chapters: the home page's contents, its contents sheet, the
// running head and the plates, and the contents sheet on every other page.
const CHAPTERS = [
  { id: 'about', n: 'I', title: 'Beyond the terminal', label: 'About' },
  { id: 'career', n: 'II', title: 'A decade-plus, by the year', label: 'Career' },
  { id: 'projects', n: 'III', title: 'Selected work', label: 'Work' },
  { id: 'writing', n: 'IV', title: 'In print and at the lectern', label: 'Writing and talks' },
  { id: 'contact', n: 'V', title: 'Compare notes', label: 'Contact' },
];

// The pages beyond the five chapters, as both contents sheets list them.
const ELSEWHERE = [
  { href: '/writing/', title: 'All writing' },
  { href: '/ai/', title: 'How I work with AI' },
  { href: '/hosts/', title: 'For podcast hosts' },
];

// His ruling on markets: the site keeps clear of them. This essay stays
// published at its address and in the listing, but is left out of the
// generated summaries and the machine-read lists that describe him.
const KEEP_OUT_OF_SUMMARIES = new Set(['prediction-markets']);

// Reading speed for the stated reading time, in words a minute.
const WPM = 230;

// Essays this many minutes or longer get a generated contents list.
const CONTENTS_MINUTES = 10;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

const stripTags = (html) => decode(html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' '));

// The article body: everything inside <div class="article-body"> up to the
// author's note that follows it, less anything the build generated there.
function articleBody(html) {
  const start = html.indexOf('<div class="article-body">');
  if (start < 0) return '';
  const end = html.indexOf('<aside class="author-bio"', start);
  const body = html.slice(start, end < 0 ? undefined : end);
  return body.replace(/<!-- build:[a-z-]+ -->[\s\S]*?<!-- \/build:[a-z-]+ -->/g, ' ');
}

function countWords(text) {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%$&/-]*/gu) || []).length;
}

const readMinutes = (words) => Math.max(1, Math.ceil(words / WPM));

function blogPosting(html) {
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const d = JSON.parse(m[1]);
    if (d['@type'] === 'BlogPosting') return d;
  }
  return null;
}

function meta(html, key) {
  const re = new RegExp(`<meta (?:name|property)="${key.replace(/[.:]/g, '\\$&')}" content="([^"]*)"`);
  const m = html.match(re);
  return m ? decode(m[1]) : null;
}

// "2026-08-05" -> "5 Aug 2026" and "5 August 2026".
function printed(iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  const month = MONTHS[mo - 1];
  return { short: `${d} ${month.slice(0, 3)} ${y}`, long: `${d} ${month} ${y}` };
}

// An essay's cover: the original (assets/covers/<slug>.jpg, 1400 px wide)
// and its alt text from assets/covers/covers.json. An original without alt
// text is an error, never a silent empty alt.
const COVERS_DIR = path.join(ROOT, 'assets', 'covers');
const COVER_WIDTHS = [480, 960, 1400];
const COVER_SIZE = { width: 1400, height: 787 };
let coverAlts = null;
function coverOf(slug) {
  const rel = `assets/covers/${slug}.jpg`;
  if (!fs.existsSync(path.join(ROOT, rel))) return null;
  coverAlts ||= JSON.parse(fs.readFileSync(path.join(COVERS_DIR, 'covers.json'), 'utf8')).covers;
  const alt = coverAlts[slug] && coverAlts[slug].alt;
  if (!alt) throw new Error(`${rel} has no alt text in assets/covers/covers.json`);
  return { file: rel, base: `/assets/covers/${slug}`, alt };
}

// A cover as <picture>: AVIF and WebP, the JPEG as the fallback, at the
// widths tools/build-covers.sh writes. The same markup as CoverPicture in
// site-content.jsx, for the static pages. width and height give the box
// its ratio before the image arrives, so nothing moves when it does.
function coverPicture(cover, { widths = COVER_WIDTHS, sizes, alt = '', eager = false, className }) {
  const src = (w, ext) => (w === 1400 ? `${cover.base}.${ext}` : `${cover.base}-${w}.${ext}`);
  const set = (ext) => widths.map((w) => `${src(w, ext)} ${w}w`).join(', ');
  const fallback = widths.includes(960) ? 960 : widths[0];
  const load = eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"';
  const esc = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<picture${className ? ` class="${className}"` : ''}>`
    + `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`
    + `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`
    + `<img src="${src(fallback, 'jpg')}" srcset="${set('jpg')}" sizes="${sizes}" alt="${esc(alt)}"`
    + ` width="${COVER_SIZE.width}" height="${COVER_SIZE.height}"${load}></picture>`;
}

// Every live essay, newest first. A page marked noindex (the retired
// redirect) is not an essay.
function essays() {
  const dir = path.join(ROOT, 'writing');
  const out = [];
  for (const slug of fs.readdirSync(dir)) {
    const file = path.join(dir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (/<meta name="robots" content="noindex/.test(html)) continue;
    const post = blogPosting(html);
    if (!post) throw new Error(`writing/${slug}/index.html has no BlogPosting JSON-LD`);
    const h1 = (html.match(/<h1 class="ttl">([\s\S]*?)<\/h1>/) || [])[1] || post.headline;
    const words = countWords(stripTags(articleBody(html)));
    out.push({
      slug,
      file: path.relative(ROOT, file),
      url: `${ORIGIN}/writing/${slug}/`,
      path: `/writing/${slug}/`,
      headline: post.headline,
      ogTitle: meta(html, 'og:title'),
      titleHtml: h1.trim(),
      description: post.description,
      datePublished: post.datePublished,
      dateModified: post.dateModified || post.datePublished,
      section: post.articleSection,
      keywords: post.keywords || [],
      discussionUrl: post.discussionUrl || null,
      words,
      minutes: readMinutes(words),
      cover: coverOf(slug),
    });
  }
  return out.sort((a, b) => (a.datePublished < b.datePublished ? 1 : a.datePublished > b.datePublished ? -1 : a.slug.localeCompare(b.slug)));
}

module.exports = {
  ROOT, ORIGIN, COVER_LINE, CHAPTERS, ELSEWHERE, KEEP_OUT_OF_SUMMARIES, BEACON_SRC, beaconLive, privacyNote, WPM, CONTENTS_MINUTES, MONTHS,
  decode, stripTags, articleBody, countWords, readMinutes, blogPosting, meta, printed, essays,
  COVER_WIDTHS, COVER_SIZE, coverPicture,
};
