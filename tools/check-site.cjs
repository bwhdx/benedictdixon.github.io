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
// It never writes. Exit code 1 if any error is found; warnings alone
// exit 0.

const fs = require('fs');
const path = require('path');

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
  const colophon = (html.match(/<strong>Published<\/strong>\s*([^<]+)</) || [])[1]?.trim();
  if (colophon !== long) error(rel, `colophon Published is ${colophon ?? 'missing'}, expected ${long}`);

  // The listing.
  const entry = listing.get(slug);
  if (!entry) error(rel, 'not in the writing/index.html listing (an orphan page)');
  else if (entry.date !== short) error(rel, `listing date is ${entry.date ?? 'missing'}, expected ${short}`);
  const ld = listingLd.get(url);
  if (!ld) error(rel, 'not in the writing/index.html CollectionPage JSON-LD');
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
for (const rel of pages) {
  if (!exists(rel)) {
    // A missing essay is already reported by the reverse check above.
    if (!rel.startsWith('writing/') || rel === 'writing/index.html') error('sitemap.xml', `lists /${rel.replace(/index\.html$/, '')}, which has no file`);
    continue;
  }
  const tag = (stripComments(read(rel)).match(beaconTag) || [])[0];
  if (!tag) { error(rel, 'no Cloudflare Web Analytics beacon'); continue; }
  let token;
  try { token = JSON.parse(attrs(tag)['data-cf-beacon'] || '{}').token; } catch { token = undefined; }
  if (!token) error(rel, 'beacon has no data-cf-beacon token');
  else if (token === BEACON_PLACEHOLDER) placeholders.push(rel);
}
if (placeholders.length) {
  error('site', `beacon token is still the placeholder ${BEACON_PLACEHOLDER} on ${placeholders.length} of ${pages.length} pages; see README, Analytics`);
}

// ── Report ───────────────────────────────────────────────

const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warning');
for (const p of [...errors, ...warnings]) console.log(`${p.level.padEnd(7)}  ${p.where}: ${p.msg}`);
if (problems.length) console.log('');
console.log(`Checked ${essays.length} essays (${redirects.length} retired redirect skipped) and ${pages.length} pages: ${errors.length} errors, ${warnings.length} warnings.`);
process.exitCode = errors.length ? 1 : 0;
