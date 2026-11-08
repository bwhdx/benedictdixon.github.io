// Read-only publish check. Run before every publish: `npm run check`.
//
// For each essay in writing/<slug>/index.html it checks that the four
// publish files agree (Site publishing standards: essay, listing,
// sitemap, feed): the listing entry and its JSON-LD, the sitemap URL,
// the feed entry, the canonical and og:url, the Open Graph and Twitter
// card tags, and the publish date everywhere it is written. It also
// checks the reverse (nothing indexed that no longer exists), the
// feed's top-level <updated>, the "Discuss on X" slot, and that every
// page carries the analytics beacon with a real token.
//
// It also checks what tools/build-pages.cjs and tools/prerender.cjs
// derive, so a stale build fails here: reading times and word counts,
// the newest essay in every list, the share cards against their inputs,
// links without an accessible name, faint ink used for text, and the
// standing ruling that the site keeps clear of markets.
//
// It never writes. Exit code 1 if any error is found; warnings alone
// exit 0.

const fs = require('fs');
const path = require('path');
const D = require('./site-data.cjs');

const ROOT = path.join(__dirname, '..');
const ORIGIN = 'https://benedictdixon.com';
const PERSON_ID = `${ORIGIN}/#person`;
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
const BEACON_PLACEHOLDER = 'CF_BEACON_TOKEN';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

const problems = [];
const error = (where, msg) => problems.push({ level: 'error', where, msg });
const warn = (where, msg) => problems.push({ level: 'warning', where, msg });

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');
const decode = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3]);
  }
  return out;
}

// Every <meta> keyed by its name or property; repeated keys (article:tag) collect.
function metas(html) {
  const out = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = a.property || a.name;
    if (key && a.content !== undefined) (out[key] ||= []).push(a.content);
  }
  return out;
}

function jsonLd(html, where) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(m[1])); } catch (e) { error(where, `JSON-LD does not parse: ${e.message}`); }
  }
  return out;
}

// "2026-08-05" -> the site's two printed forms, "5 Aug 2026" and "5 August 2026".
function printed(iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  const month = MONTHS[mo - 1];
  return { short: `${d} ${month.slice(0, 3)} ${y}`, long: `${d} ${month} ${y}` };
}

const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const essayUrl = (slug) => `${ORIGIN}/writing/${slug}/`;
const slugOf = (url) => (url.match(/^https:\/\/benedictdixon\.com\/writing\/([^/]+)\/$/) || [])[1];

// ── The indexes ──────────────────────────────────────────

const sitemapSrc = read('sitemap.xml');
const sitemap = new Map();
for (const m of sitemapSrc.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1];
  const lastmod = (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
  if (loc) sitemap.set(loc, lastmod);
}

const feedSrc = read('feed.xml');
const feed = new Map();
for (const m of feedSrc.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
  const id = (m[1].match(/<id>([^<]+)<\/id>/) || [])[1];
  const published = (m[1].match(/<published>([^<]+)<\/published>/) || [])[1];
  const updated = (m[1].match(/<updated>([^<]+)<\/updated>/) || [])[1];
  if (id) feed.set(id, { published, updated });
}

const listingSrc = stripComments(read('writing/index.html'));
const listing = new Map();
for (const m of listingSrc.matchAll(/<a class="post" href="\/writing\/([^/"]+)\/">([\s\S]*?)<\/a><\/li>/g)) {
  const date = (m[2].match(/<span class="meta">(\d{1,2} \w{3} \d{4})/) || [])[1];
  listing.set(m[1], { date });
}
const listingLd = new Map();
for (const block of jsonLd(listingSrc, 'writing/index.html')) {
  for (const part of block.hasPart || []) {
    if (part.url) listingLd.set(part.url, part);
  }
}

// ── Each essay ───────────────────────────────────────────

const slugs = fs.readdirSync(path.join(ROOT, 'writing'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && exists(`writing/${d.name}/index.html`))
  .map((d) => d.name)
  .sort();

const essays = [];
const redirects = [];
for (const slug of slugs) {
  const rel = `writing/${slug}/index.html`;
  const raw = read(rel);
  if (/<meta http-equiv="refresh"/i.test(raw)) { redirects.push(slug); continue; }
  essays.push(slug);
  checkEssay(slug, rel, raw);
}

function checkEssay(slug, rel, raw) {
  const html = stripComments(raw);
  const url = essayUrl(slug);
  const meta = metas(html);
  const one = (key) => (meta[key] || [])[0];

  // Canonical and og:url.
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].map((m) => attrs(m[0]).href);
  if (canonicals.length !== 1) error(rel, `expected one canonical, found ${canonicals.length}`);
  else if (canonicals[0] !== url) error(rel, `canonical is ${canonicals[0]}, expected ${url}`);
  if (one('og:url') !== url) error(rel, `og:url is ${one('og:url')}, expected ${url}`);

  // Open Graph and Twitter card tags.
  const fixed = {
    'og:type': 'article', 'og:image:width': '1200', 'og:image:height': '630',
    'twitter:card': 'summary_large_image', 'twitter:site': '@bwhdx', 'twitter:creator': '@bwhdx',
  };
  for (const [key, want] of Object.entries(fixed)) {
    if (one(key) !== want) error(rel, `${key} is ${one(key) ?? 'missing'}, expected ${want}`);
  }
  for (const key of ['og:title', 'og:description', 'og:image', 'og:image:alt', 'twitter:image', 'twitter:image:alt', 'description']) {
    if (!one(key)) error(rel, `${key} is missing or empty`);
  }
  const image = one('og:image');
  if (image && one('twitter:image') !== image) error(rel, 'twitter:image differs from og:image');
  if (image?.startsWith(`${ORIGIN}/`) && !exists(image.slice(ORIGIN.length + 1))) {
    error(rel, `og:image file is missing: ${image.slice(ORIGIN.length)}`);
  }

  // The publish date, as the head declares it.
  const published = one('article:published_time');
  if (!isIsoDate(published)) { error(rel, `article:published_time is ${published ?? 'missing'}, expected YYYY-MM-DD`); return; }
  const { short, long } = printed(published);

  // JSON-LD BlogPosting.
  const posting = jsonLd(html, rel).find((b) => b['@type'] === 'BlogPosting');
  let modified;
  if (!posting) error(rel, 'no BlogPosting JSON-LD');
  else {
    if (posting.url !== url) error(rel, `BlogPosting url is ${posting.url}`);
    if (posting.mainEntityOfPage !== url) error(rel, `BlogPosting mainEntityOfPage is ${posting.mainEntityOfPage}`);
    if (posting.datePublished !== published) error(rel, `BlogPosting datePublished ${posting.datePublished} ≠ article:published_time ${published}`);
    modified = posting.dateModified;
    if (!isIsoDate(modified)) error(rel, `BlogPosting dateModified is ${modified ?? 'missing'}`);
    else if (modified < published) error(rel, `BlogPosting dateModified ${modified} is before datePublished ${published}`);
    if (posting.author?.['@id'] !== PERSON_ID) error(rel, 'BlogPosting author @id is not the #person entity');
    if (posting.image?.url !== image) error(rel, 'BlogPosting image.url differs from og:image');
  }

  // The printed dates: the kicker row and the colophon.
  const kicker = (html.match(/<div class="kicker-row">[\s\S]*?<\/div>/) || [''])[0];
  if (!kicker.includes(`<span>${short} `)) error(rel, `kicker-row date is not ${short}`);
  const colophon = (html.match(/<p class="article-end">Published ([^.<]+)\./) || [])[1]?.trim();
  if (colophon !== long) error(rel, `colophon line Published is ${colophon ?? 'missing'}, expected ${long}`);

  // The listing.
  const entry = listing.get(slug);
  if (!entry) error(rel, 'not in the writing/index.html listing (an orphan page)');
  else if (entry.date !== short) error(rel, `listing date is ${entry.date ?? 'missing'}, expected ${short}`);
  const ld = listingLd.get(url);
  if (D.KEEP_OUT_OF_SUMMARIES.has(slug)) {
    if (ld) error(rel, 'is in the writing/index.html JSON-LD, but site-data keeps it out of the machine-read lists');
  } else if (!ld) error(rel, 'not in the writing/index.html CollectionPage JSON-LD');
  else if (ld.datePublished !== published) error(rel, `listing JSON-LD datePublished ${ld.datePublished} ≠ ${published}`);

  // The sitemap.
  if (!sitemap.has(url)) error(rel, 'not in sitemap.xml');
  else {
    const lastmod = sitemap.get(url);
    if (!isIsoDate(lastmod)) error(rel, `sitemap lastmod is ${lastmod ?? 'missing'}`);
    else if (lastmod < published) error(rel, `sitemap lastmod ${lastmod} is before the publish date ${published}`);
    else if (modified && isIsoDate(modified) && lastmod !== modified) {
      warn(rel, `sitemap lastmod ${lastmod} ≠ BlogPosting dateModified ${modified}`);
    }
  }

  // The feed.
  const item = feed.get(url);
  if (!item) error(rel, 'not in feed.xml');
  else {
    if (item.published !== `${published}T00:00:00Z`) error(rel, `feed published is ${item.published}, expected ${published}T00:00:00Z`);
    if (!item.updated || item.updated < item.published) error(rel, `feed updated ${item.updated ?? 'missing'} is before published`);
  }

  // The "Discuss on X" slot: empty (commented out) or set, and set in both places.
  const link = (html.match(/<a class="discuss"[^>]*>/) || [])[0];
  const discussionUrl = posting?.discussionUrl;
  if (link) {
    const href = attrs(link).href || '';
    if (!/^https:\/\/x\.com\/\S+$/.test(href) || href.includes('X_DISCUSSION_URL')) {
      error(rel, `Discuss on X link is not an https://x.com/ URL: ${href}`);
    }
    if (discussionUrl !== href) error(rel, `Discuss on X link ${href} ≠ BlogPosting discussionUrl ${discussionUrl ?? '(unset)'}`);
  } else if (discussionUrl) {
    error(rel, `BlogPosting discussionUrl is set (${discussionUrl}) but the footer has no Discuss on X link`);
  } else if (!raw.includes('class="discuss"')) {
    warn(rel, 'no Discuss on X slot in the footer');
  }
}

// ── The reverse: indexed URLs must point at live essays ──

const live = new Set(essays.map(essayUrl));
const redirected = new Set(redirects.map(essayUrl));
const reverse = (file, urls) => {
  for (const u of urls) {
    if (!slugOf(u)) continue;
    if (redirected.has(u)) error(file, `lists the retired page ${u}`);
    else if (!live.has(u)) error(file, `lists ${u}, which has no essay`);
  }
};
reverse('sitemap.xml', sitemap.keys());
reverse('feed.xml', feed.keys());
reverse('writing/index.html', [...listing.keys()].map(essayUrl));
reverse('writing/index.html (JSON-LD)', listingLd.keys());

// ── The feed's top-level <updated> ───────────────────────

const feedUpdated = (feedSrc.replace(/<entry>[\s\S]*?<\/entry>/g, '').match(/<updated>([^<]+)<\/updated>/) || [])[1];
const newest = [...feed.values()].map((e) => e.updated).filter(Boolean).sort().pop();
if (feedUpdated !== newest) error('feed.xml', `top-level updated is ${feedUpdated}, newest entry is ${newest}`);

// ── The analytics beacon, on every page a reader can reach ──

const pages = ['404.html'];
for (const loc of sitemap.keys()) {
  if (!loc.startsWith(`${ORIGIN}/`) || !loc.endsWith('/')) continue;
  pages.push(`${loc.slice(ORIGIN.length + 1)}index.html`);
}
const beaconTag = new RegExp(`<script[^>]*src="${BEACON_SRC.replace(/[.]/g, '\\.')}"[^>]*>`);
const placeholders = [];
const off = [];
const OFF_FORM = new RegExp(`<!-- off until the token is set: <script[^>]*src="${BEACON_SRC.replace(/[.]/g, '\\.')}"`);
for (const rel of pages) {
  if (!exists(rel)) {
    // A missing essay is already reported by the reverse check above.
    if (!rel.startsWith('writing/') || rel === 'writing/index.html') error('sitemap.xml', `lists /${rel.replace(/index\.html$/, '')}, which has no file`);
    continue;
  }
  const raw = read(rel);
  const tag = (stripComments(raw).match(beaconTag) || [])[0];
  if (!tag) {
    if (OFF_FORM.test(raw)) off.push(rel);
    else error(rel, 'no Cloudflare Web Analytics beacon, live or switched off');
    continue;
  }
  let token;
  try { token = JSON.parse(attrs(tag)['data-cf-beacon'] || '{}').token; } catch { token = undefined; }
  if (!token) error(rel, 'beacon has no data-cf-beacon token');
  else if (token === BEACON_PLACEHOLDER) placeholders.push(rel);
}
if (off.length && off.length < pages.length - placeholders.length) {
  error('site', `analytics is on for some pages and off for ${off.length}: ${off.slice(0, 3).join(', ')}…; switch it on or off everywhere`);
} else if (off.length) {
  warn('site', `analytics is switched off on all ${off.length} pages until the token is set; see README, Analytics`);
}
if (placeholders.length) {
  error('site', `beacon token is still the placeholder ${BEACON_PLACEHOLDER} on ${placeholders.length} of ${pages.length} pages; see README, Analytics`);
}

// ── What the build derives ───────────────────────────────

const list = D.essays();
const byPath = Object.fromEntries(list.map((e) => [e.path, e]));
const newestEssay = list[0];

for (const e of list) {
  const html = stripComments(read(e.file));
  const kicker = (html.match(/<div class="kicker-row">[\s\S]*?<\/div>/) || [''])[0];
  const stated = Number((kicker.match(/ · (\d+)[ \u00A0]min[ \u00A0]read</) || [])[1]);
  if (stated !== e.minutes) error(e.file, `reading time is ${stated || 'missing'} min, the text is ${e.words} words (${e.minutes} min); run npm run build`);
  const posting = jsonLd(html, e.file).find((b) => b['@type'] === 'BlogPosting');
  if (posting && posting.wordCount !== e.words) error(e.file, `JSON-LD wordCount ${posting.wordCount} ≠ ${e.words} words; run npm run build`);
  const contents = html.includes('class="essay-contents"');
  if ((e.minutes >= D.CONTENTS_MINUTES) !== contents) error(e.file, `contents list ${contents ? 'present' : 'missing'} for a ${e.minutes} min essay; run npm run build`);
  if (!/<!-- build:further --><ol class="toc"><li>/.test(read(e.file))) error(e.file, 'Further reading is empty');
}
for (const m of listingSrc.matchAll(/<a class="post" href="([^"]+)">[\s\S]*?<span class="meta">[^<]*? · (\d+) min<\/span>/g)) {
  const e = byPath[m[1]];
  if (e && Number(m[2]) !== e.minutes) error('writing/index.html', `${m[1]} reads ${m[2]} min, the essay is ${e.minutes}; run npm run build`);
}

// The newest essay is in every list a reader or a crawler is given.
const where = (rel, test) => { if (!test(read(rel))) error(rel, `does not list the newest essay, ${newestEssay.path}; run npm run build`); };
where('sitemap.xml', (x) => x.includes(`<loc>${newestEssay.url}</loc>`));
where('feed.xml', (x) => x.includes(`<id>${newestEssay.url}</id>`));
where('404.html', (x) => x.includes(`href="${newestEssay.path}"`));
if (!D.KEEP_OUT_OF_SUMMARIES.has(newestEssay.slug) && newestEssay.section === 'Building & Technology') {
  where('llms.txt', (x) => x.includes(`(${newestEssay.url})`));
}
// The home page's facts come from the same list (window.SITE in bundle.js).
const bundle = read('bundle.js');
const site = JSON.parse((bundle.match(/^window\.SITE = (.*);$/m) || [])[1] || 'null');
if (!site) error('bundle.js', 'no window.SITE; run npm run build');
else {
  for (const e of list) {
    const s = site.essays[e.path];
    if (!s || s.minutes !== e.minutes) error('bundle.js', `${e.path} is stale in window.SITE; run npm run build`);
  }
  if (site.coverLine !== D.COVER_LINE) error('bundle.js', 'the cover line differs from tools/site-data.cjs; run npm run build');
}

// The home page is prerendered from the same bundle; its colophon's
// privacy note must match whether the beacon is live.
const home = read('index.html');
const root = (home.match(/<div id="root">([\s\S]*?)<\/div>\s*<!-- prerender:end -->/) || [])[1];
if (!root || root.length < 1000) error('index.html', 'the prerendered page is missing; run npm run build');
else {
  if (!root.includes(D.privacyNote().replace(/'/g, '&#x27;'))) error('index.html', `the colophon does not say "${D.privacyNote()}"; run npm run build`);
  if (!root.includes(D.COVER_LINE.split(' ').slice(0, 4).join(' '))) error('index.html', 'the prerendered cover line is stale; run npm run build');
}

// ── Accessibility ────────────────────────────────────────

// Every link has a name: its text (without aria-hidden parts) or a label.
const staticPages = ['index.html', '404.html', 'writing/index.html', 'ai/index.html', 'hosts/index.html', ...list.map((e) => e.file)];
for (const rel of staticPages) {
  const html = stripComments(read(rel)).replace(/<script\b[\s\S]*?<\/script>/g, '');
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const a = attrs(`<a ${m[1]}>`);
    const text = m[2].replace(/<svg\b[^>]*aria-hidden="true"[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!text && !a['aria-label']) error(rel, `a link to ${a.href} has no accessible name`);
  }
}
// Faint ink is for rules and decoration only, never text.
for (const rel of ['site.css', 'writing.css']) {
  for (const m of read(rel).matchAll(/(?:^|[;{\s])color:\s*var\(--ink-mute\)/g)) error(rel, `--ink-mute is used for text (${m[0].trim()}); it is 2.3:1 on the paper`);
}

// ── His ruling: the site keeps clear of markets ──────────

for (const rel of staticPages) {
  if (/href="https?:\/\/(www\.)?kash\.bot/.test(read(rel))) error(rel, 'links to kash.bot; Kash is named in plain words only');
}
if (/kash\.bot/.test(read('site-content.jsx'))) error('site-content.jsx', 'links to kash.bot; Kash is named in plain words only');
const person = jsonLd(home, 'index.html').find((b) => b.mainEntity && b.mainEntity['@type'] === 'Person');
for (const k of person?.mainEntity.knowsAbout || []) {
  if (/market|stablecoin|tokenomic|trading/i.test(k)) error('index.html', `Person knowsAbout lists "${k}"`);
}
if (/markets? and what gets built/i.test(listingSrc)) error('writing/index.html', 'the essays blurb names markets');

// ── Share cards ──────────────────────────────────────────

const cardsTool = path.join(__dirname, 'generate-cards.cjs');
if (exists('tools/generate-cards.cjs')) {
  const pending = [];
  for (const c of require(cardsTool).cardStatus()) {
    if (!c.ok) error(c.file, `share card is stale or missing (${c.reason}); run npm run build:og`);
    else if (/pending/i.test(c.reason || '')) pending.push(c.key);
  }
  if (pending.length) warn('assets/og', `${pending.length} share cards are drawn from essay covers still awaiting approval, outside the repo: ${pending.join(', ')}`);
}

// ── Report ───────────────────────────────────────────────

const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warning');
for (const p of [...errors, ...warnings]) console.log(`${p.level.padEnd(7)}  ${p.where}: ${p.msg}`);
if (problems.length) console.log('');
console.log(`Checked ${essays.length} essays (${redirects.length} retired redirect skipped) and ${pages.length} pages: ${errors.length} errors, ${warnings.length} warnings.`);
process.exitCode = errors.length ? 1 : 0;
