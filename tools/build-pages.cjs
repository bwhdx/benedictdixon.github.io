// Keep the static pages and the machine-read lists in step with the essays.
// Run by `npm run build`; idempotent, so a second run changes nothing.
//
// The essay pages are written by hand (Site publishing standards). This
// derives everything that can be derived from them, so none of it is kept
// by hand and none of it can drift:
//
//   every page     typographer's quotes in text, titles and descriptions
//                  (never inside code, pre, scripts or URLs); the contents
//                  sheet in the head; the share card's alt text
//   each essay     its cover at the top; word count and reading time
//                  (kicker and JSON-LD); a contents list for long essays;
//                  the Further reading entries; the closing colophon line
//   the listing    each essay's reading time and cover, the newest essay's
//                  row set large
//   404.html       the three newest essays
//   sitemap.xml, feed.xml and the essay list in llms.txt, from the essays
//
// Generated blocks sit between <!-- build:NAME --> and <!-- /build:NAME -->
// markers and are rewritten whole on every run.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const D = require('./site-data.cjs');

const { ROOT, ORIGIN } = D;
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const changed = [];
function write(rel, text) {
  if (read(rel) === text) return;
  fs.writeFileSync(path.join(ROOT, rel), text);
  changed.push(rel);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Typographer's quotes ─────────────────────────────────

// After one of these (or at the start) a quote opens; otherwise it closes,
// and a single quote inside a word is an apostrophe.
const OPENS_AFTER = /[\s([{\u2014\u2013\-\u201C\u2018/]/;
function curly(text, before = ' ') {
  let out = '';
  let prev = before;
  for (const c of text) {
    if (c === "'") out += !prev || OPENS_AFTER.test(prev) ? '\u2018' : '\u2019';
    else if (c === '"') out += !prev || OPENS_AFTER.test(prev) ? '\u201C' : '\u201D';
    else out += c;
    prev = out.slice(-1);
  }
  return out;
}

const SKIP = /^<(script|style|pre|code|textarea)\b/i;
const BLOCK = /^<\/?(p|h[1-6]|li|ol|ul|div|br|td|th|tr|title|blockquote|section|header|footer|figcaption|figure|nav|main|article|aside|dt|dd|dl)\b/i;
const QUOTED_ATTRS = /\s(alt|title|aria-label|data-default)="([^"]*)"/g;
const QUOTED_METAS = new Set(['description', 'og:title', 'og:description', 'og:image:alt',
  'twitter:title', 'twitter:description', 'twitter:image:alt']);
const JSON_TEXT = /("(?:headline|description|name|caption)": ")((?:[^"\\]|\\.)*)(")/g;

const unq = (s) => s.replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
const curlyAttr = (v) => curly(unq(v));

function curlyTag(tag) {
  let t = tag.replace(QUOTED_ATTRS, (m, k, v) => ` ${k}="${curlyAttr(v)}"`);
  const key = (t.match(/^<meta (?:name|property)="([^"]+)"/) || [])[1];
  if (key && QUOTED_METAS.has(key)) t = t.replace(/ content="([^"]*)"/, (m, v) => ` content="${curlyAttr(v)}"`);
  return t;
}

function curlyHtml(html) {
  const parts = html.split(/(<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|<textarea\b[\s\S]*?<\/textarea>|<[^>]+>)/i);
  let prev = ' ';
  return parts.map((part, i) => {
    if (i % 2 === 0) {
      if (!part) return part;
      const out = curly(unq(part), prev);
      prev = out.slice(-1);
      return out;
    }
    if (part.startsWith('<!--')) return part;
    if (/^<script type="application\/ld\+json">/.test(part)) {
      return part.replace(JSON_TEXT, (m, a, v, b) => a + curly(v.replace(/\\"/g, '"')) + b);
    }
    if (SKIP.test(part)) { prev = 'x'; return part; }
    if (BLOCK.test(part)) prev = ' ';
    return curlyTag(part);
  }).join('');
}

// ── Blocks ───────────────────────────────────────────────

function block(html, name, body, where) {
  const re = new RegExp(`<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->`);
  if (!re.test(html)) throw new Error(`${where}: no build:${name} block`);
  return html.replace(re, `<!-- build:${name} -->${body}<!-- /build:${name} -->`);
}
// Removes a block and the whitespace after it, which insertion adds back.
const stripBlocks = (html, name) => html.replace(new RegExp(`<!-- build:${name} -->[\\s\\S]*?<!-- /build:${name} -->\\s*`, 'g'), '');

const plainTitle = (e) => D.decode(e.titleHtml.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').replace(/\.$/, '').trim();
const roman = (n) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'][n - 1];
const slugify = (s) => D.decode(s.replace(/<[^>]+>/g, '')).toLowerCase().normalize('NFKD')
  .replace(/[\u2019']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Where the article body's first element (its opening paragraph or
// quote) ends, counting nested elements of the same name.
function endOfFirstChild(body, where) {
  const m = body.match(/^<div class="article-body">\s*<([a-z0-9]+)\b/);
  if (!m) throw new Error(`${where}: the article body has no first element`);
  const tag = m[1];
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'g');
  re.lastIndex = m.index + m[0].length - tag.length - 1;
  let depth = 0;
  for (let t; (t = re.exec(body));) {
    depth += t[1] ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  throw new Error(`${where}: the article body's first <${tag}> never closes`);
}

function tocItem(href, title, note, current) {
  return `<li><a href="${href}"${current ? ' aria-current="page"' : ''}><span class="toc-t">${esc(title)}</span>`
    + `<span class="toc-dots" aria-hidden="true"></span><span class="toc-f">${esc(note)}</span></a></li>`;
}

// The book's contents in a dialog, for the head of every static page. The
// same chapters as the home page's contents sheet (site-data CHAPTERS).
function contentsSheet(page) {
  const chapters = D.CHAPTERS.map((c) => `<li><a href="/#${c.id}"${c.id === page.chapter ? ' aria-current="location"' : ''}>`
    + `<span class="toc-n">${c.n}</span><span class="toc-t">${esc(c.title)}</span>`
    + `<span class="toc-dots" aria-hidden="true"></span><span class="toc-f">${esc(c.label)}</span></a></li>`).join('');
  const more = D.ELSEWHERE.map((l) => `<a href="${l.href}"${l.href === page.path ? ' aria-current="page"' : ''}>${esc(l.title)}</a>`).join('');
  return '\n    <dialog id="contents-sheet" class="contents-sheet" aria-labelledby="contents-sheet-title">'
    + '<div class="sheet-panel"><div class="sheet-head"><h2 id="contents-sheet-title">Contents</h2>'
    + '<button type="button" class="sheet-close">Close</button></div>'
    + `<ol class="toc toc-sheet">${chapters}</ol><p class="sheet-more">${more}</p></div></dialog>\n    `;
}

function shareAlt(html, card) {
  if (!card) return html;
  const alt = esc(curly(card.alt));
  return html
    .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${alt}$2`)
    .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/, `$1${alt}$2`);
}

// ── Essays ───────────────────────────────────────────────

// The cover opens the essay, above its head: the page's first and largest
// image, so it loads at once and first (never lazily). Its alt text says
// what the illustration shows; the title it carries is the heading below.
const ESSAY_COVER_SIZES = '(max-width: 960px) calc(100vw - 48px), 960px';
function essayCover(html, e) {
  html = stripBlocks(html, 'cover');
  if (!e.cover) return html;
  const figure = `<!-- build:cover --><figure class="essay-cover">${D.coverPicture(e.cover, {
    sizes: ESSAY_COVER_SIZES, alt: e.cover.alt, eager: true,
  })}</figure><!-- /build:cover -->\n\n      `;
  const at = html.indexOf('<article class="article">');
  if (at < 0) throw new Error(`${e.file}: no <article class="article">`);
  const head = html.indexOf('<header class="article-head">', at);
  if (head < 0) throw new Error(`${e.file}: no article head`);
  return html.slice(0, head) + figure + html.slice(head);
}

function essayPage(e, byPath, cards) {
  let html = read(e.file);
  const where = e.file;
  html = essayCover(html, e);

  // The reading time never breaks across lines (no-break spaces).
  html = html.replace(/(<div class="kicker-row">\s*<span>[^<]*<\/span>\s*<span>[^<]*? · )~?\d+[ \u00A0]min[ \u00A0]read(<\/span>)/,
    `$1${e.minutes}\u00A0min\u00A0read$2`);
  html = html.replace(/"wordCount": \d+/, `"wordCount": ${e.words}`);

  // A contents list for long essays, after the opening paragraph, and a
  // way back to it at the end of each part.
  html = stripBlocks(html, 'contents');
  html = stripBlocks(html, 'back');
  const bodyStart = html.indexOf('<div class="article-body">');
  const bodyEnd = html.indexOf('<aside class="author-bio"', bodyStart);
  let body = html.slice(bodyStart, bodyEnd);
  body = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (m, t) => `<h2 id="${slugify(t)}">${t}</h2>`);
  if (e.minutes >= D.CONTENTS_MINUTES) {
    const heads = [...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
    const items = heads.map((h, i) => `<li><a href="#${h[1]}"><span class="toc-n">${roman(i + 1)}</span>`
      + `<span class="toc-t">${h[2].replace(/<[^>]+>/g, '')}</span><span class="toc-dots" aria-hidden="true"></span></a></li>`).join('');
    const contents = '<!-- build:contents --><nav class="essay-contents" id="contents" aria-labelledby="contents-title">'
      + `<p class="essay-contents-title" id="contents-title">In this essay</p><ol class="toc">${items}</ol></nav><!-- /build:contents -->\n\n        `;
    const back = '<!-- build:back --><p class="to-contents"><a href="#contents">Back to contents</a></p><!-- /build:back -->';
    const opener = endOfFirstChild(body, where);
    body = body.slice(0, opener) + body.slice(opener).replace(/^\s*/, (ws) => ws + contents);
    let first = true;
    body = body.replace(/<h2 id=/g, (m) => {
      if (first) { first = false; return m; }
      return `${back}\n        ${m}`;
    });
    const close = body.lastIndexOf('</div>');
    body = `${body.slice(0, close)}${back}\n      ${body.slice(close)}`;
  }
  html = html.slice(0, bodyStart) + body + html.slice(bodyEnd);

  // Further reading: the entries are the links already in the block.
  const further = (html.match(/<!-- build:further -->([\s\S]*?)<!-- \/build:further -->/) || [])[1];
  if (further === undefined) throw new Error(`${where}: no build:further block`);
  const items = [...further.matchAll(/<a href="([^"]+)"/g)].map((m) => {
    const t = byPath[m[1]];
    if (!t) throw new Error(`${where}: Further reading links to ${m[1]}, which is not an essay`);
    return tocItem(t.path, plainTitle(t), `${D.printed(t.datePublished).short}, ${t.minutes} min`);
  }).join('');
  html = block(html, 'further', `<ol class="toc">${items}</ol>`, where);

  const chapterLabel = ((html.match(/<div class="kicker-row">\s*<span>([^<]+)<\/span>/) || [])[1] || 'Chapter IV, essay').trim();
  html = block(html, 'colophon',
    `<p class="article-end">Published ${D.printed(e.datePublished).long}. ${esc(D.decode(chapterLabel))}. ${e.words.toLocaleString('en-GB')} words.</p>`, where);

  html = block(html, 'contents-sheet', contentsSheet({ chapter: 'writing', path: e.path }), where);
  html = shareAlt(html, cards[e.slug]);
  // The BlogPosting image is the share card; its caption says what it shows.
  if (cards[e.slug]) html = html.replace(/("image": \{[^}]*"caption": ")(?:[^"\\]|\\.)*(")/, (m, a, b) => a + JSON.stringify(cards[e.slug].alt).slice(1, -1) + b);
  write(where, curlyHtml(html));
}

// ── Other pages ──────────────────────────────────────────

// The listing's rows: each essay's cover as a thumbnail, decorative (the
// title beside it names the essay), loaded as the reader nears it. The
// newest essay's row is set large, its cover across the column.
const THUMB_SIZES = '(max-width: 480px) 112px, 168px';
const FEATURE_SIZES = '(max-width: 960px) calc(100vw - 48px), 608px';
function listing(byPath, newest, card) {
  let html = read('writing/index.html');
  html = html.replace(/(<a class="post" href="([^"]+)">[\s\S]*?<span class="meta">[^<]*? · )~?\d+ min(<\/span>)/g, (m, a, href, b) => {
    const e = byPath[href];
    if (!e) throw new Error(`writing/index.html lists ${href}, which is not an essay`);
    return `${a}${e.minutes} min${b}`;
  });
  // Removed without the whitespace after it, which the row's own markup keeps.
  html = html.replace(/<!-- build:thumb -->[\s\S]*?<!-- \/build:thumb -->/g, '');
  html = html.replace(/<li(?: class="post-featured")?><a class="post" href="([^"]+)">/g, (m, href) => {
    const e = byPath[href];
    const featured = e === newest;
    const thumb = e.cover
      ? `<!-- build:thumb --><span class="post-cover">${D.coverPicture(e.cover, featured
        ? { sizes: FEATURE_SIZES, eager: true }
        : { widths: [480, 960], sizes: THUMB_SIZES })}</span><!-- /build:thumb -->`
      : '';
    return `<li${featured ? ' class="post-featured"' : ''}><a class="post" href="${href}">${thumb}`;
  });
  html = block(html, 'contents-sheet', contentsSheet({ chapter: 'writing', path: '/writing/' }), 'writing/index.html');
  html = shareAlt(html, card);
  write('writing/index.html', curlyHtml(html));
}

function otherPage(rel, page, card) {
  let html = read(rel);
  html = block(html, 'contents-sheet', contentsSheet(page), rel);
  html = shareAlt(html, card);
  write(rel, curlyHtml(html));
}

function notFound(list) {
  const items = list.slice(0, 3).map((e) => tocItem(e.path, plainTitle(e), D.printed(e.datePublished).short)).join('');
  write('404.html', curlyHtml(block(read('404.html'), 'newest', `<ol class="toc">${items}</ol>`, '404.html')));
}

function home(card) {
  write('index.html', shareAlt(read('index.html'), card));
}

// ── Machine-read lists ───────────────────────────────────

// A page's last change: today if it differs from the last commit, else the
// date already in the sitemap. Essays use their own dateModified.
function lastmod(rel, previous) {
  try {
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', rel], { cwd: ROOT, stdio: 'ignore' });
    return previous;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function sitemap(list) {
  const old = read('sitemap.xml');
  const prev = (loc) => (old.match(new RegExp(`<loc>${loc.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}</loc>\\s*<lastmod>([^<]+)</lastmod>`)) || [])[1];
  // The home page and the listing show the essays, so they are at least
  // as new as the newest essay.
  const newest = list.reduce((m, e) => (e.dateModified > m ? e.dateModified : m), '');
  const page = (rel, loc, floor = '') => {
    const l = lastmod(rel, prev(loc) || floor || newest);
    return floor > l ? floor : l;
  };
  const homeCard = 'Benedict W. H. Dixon on the cover of An Almanack: his portrait drawn in candles.';
  const urls = [
    `  <url>\n    <loc>${ORIGIN}/</loc>\n    <lastmod>${page('index.html', `${ORIGIN}/`, newest)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n`
      + `    <image:image>\n      <image:loc>${ORIGIN}/assets/og-image.png</image:loc>\n      <image:title>Benedict W. H. Dixon, An Almanack</image:title>\n      <image:caption>${esc(homeCard)}</image:caption>\n    </image:image>\n  </url>`,
    `  <url>\n    <loc>${ORIGIN}/writing/</loc>\n    <lastmod>${page('writing/index.html', `${ORIGIN}/writing/`, newest)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    `  <url>\n    <loc>${ORIGIN}/ai/</loc>\n    <lastmod>${page('ai/index.html', `${ORIGIN}/ai/`)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    `  <url>\n    <loc>${ORIGIN}/hosts/</loc>\n    <lastmod>${page('hosts/index.html', `${ORIGIN}/hosts/`)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ...list.map((e) => `  <url>\n    <loc>${e.url}</loc>\n    <lastmod>${e.dateModified}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.7</priority>\n  </url>`),
  ];
  write('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    + `${urls.join('\n')}\n</urlset>\n`);
}

function feed(list) {
  const updated = list.reduce((m, e) => (e.dateModified > m ? e.dateModified : m), '');
  const entries = list.map((e) => {
    const cats = [e.section, e.keywords[0]].filter(Boolean);
    return `  <entry>\n    <title>${esc(e.ogTitle || e.headline)}</title>\n`
      + `    <link href="${e.url}" rel="alternate" type="text/html"/>\n    <id>${e.url}</id>\n`
      + `    <published>${e.datePublished}T00:00:00Z</published>\n    <updated>${e.dateModified}T00:00:00Z</updated>\n`
      + `    <summary>${esc(e.description)}</summary>\n`
      + cats.map((c) => `    <category term="${esc(c)}"/>\n`).join('')
      + '  </entry>\n';
  }).join('\n');
  write('feed.xml', `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Benedict W. H. Dixon · An Almanack</title>
  <subtitle>Essays on operations, entrepreneurship, AI, blockchain and what gets built.</subtitle>
  <link href="${ORIGIN}/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${ORIGIN}/" rel="alternate" type="text/html"/>
  <updated>${updated}T00:00:00Z</updated>
  <id>${ORIGIN}/</id>
  <author>
    <name>Benedict W. H. Dixon</name>
    <email>me@benedictdixon.com</email>
    <uri>${ORIGIN}/</uri>
  </author>
  <rights>© ${updated.slice(0, 4)} Benedict W. H. Dixon. All rights reserved.</rights>
  <icon>${ORIGIN}/favicons/favicon.svg</icon>
  <logo>${ORIGIN}/assets/og-image.png</logo>
  <generator uri="${ORIGIN}/">benedictdixon.com</generator>

${entries}</feed>
`);
}

// llms.txt: the hand-written summary stays; the essay list is generated.
function llms(list) {
  const items = list.filter((e) => e.section === 'Building & Technology' && !D.KEEP_OUT_OF_SUMMARIES.has(e.slug))
    .map((e) => `- [${e.headline}](${e.url}): ${e.description}`).join('\n');
  write('llms.txt', block(read('llms.txt'), 'essays', `\n${items}\n`, 'llms.txt'));
}

// ── Run ──────────────────────────────────────────────────

function main() {
  const list = D.essays();
  const byPath = Object.fromEntries(list.map((e) => [e.path, e]));
  const cardsFile = path.join(ROOT, 'assets', 'og', 'cards.json');
  const cards = fs.existsSync(cardsFile) ? JSON.parse(fs.readFileSync(cardsFile, 'utf8')).cards : {};
  for (const e of list) essayPage(e, byPath, cards);
  // Reading times can change with the curly pass, never the words; reread.
  const fresh = D.essays();
  const freshByPath = Object.fromEntries(fresh.map((e) => [e.path, e]));
  listing(freshByPath, freshByPath[fresh[0].path], cards.home);
  otherPage('ai/index.html', { chapter: null, path: '/ai/' }, cards.ai);
  otherPage('hosts/index.html', { chapter: null, path: '/hosts/' }, cards.home);
  notFound(fresh);
  home(cards.home);
  sitemap(fresh);
  feed(fresh);
  llms(fresh);
  console.log(changed.length ? `Pages: updated ${changed.join(', ')}` : 'Pages: up to date');
}

if (require.main === module) main();
module.exports = { curly, curlyHtml, slugify };
