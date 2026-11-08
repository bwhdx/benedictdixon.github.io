// External link check, run by hand before publishing (`npm run check:links`);
// never in a hook, since it goes to the network. Every outside link on every
// page is requested (HEAD, then GET where a server refuses HEAD) and reported
// if it fails or redirects, so each link can point at its final address.
// Exit code 1 if any link fails; redirects alone are warnings.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = /^https:\/\/(x\.com|www\.linkedin\.com|calendar\.app\.google)\//; // refuse robots; checked by hand

function pages(dir = ROOT, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor', '.claude'].includes(f.name)) continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) pages(p, out);
    else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'manual', signal: AbortSignal.timeout(15000),
        headers: { 'user-agent': 'benedictdixon.com link check' } });
      if (method === 'HEAD' && (res.status === 405 || res.status === 403)) continue;
      return { status: res.status, location: res.headers.get('location') };
    } catch (e) {
      if (method === 'GET') return { status: 0, error: e.message };
    }
  }
  return { status: 0, error: 'no response' };
}

async function main() {
  const links = new Map();
  for (const file of pages()) {
    const html = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    for (const m of html.matchAll(/href="(https?:\/\/[^"#]+)[^"]*"/g)) {
      if (m[1].startsWith('https://benedictdixon.com')) continue;
      if (!links.has(m[1])) links.set(m[1], new Set());
      links.get(m[1]).add(path.relative(ROOT, file));
    }
  }
  let failed = 0;
  let moved = 0;
  for (const [url, where] of links) {
    if (SKIP.test(url)) continue;
    const r = await probe(url);
    const on = [...where].slice(0, 3).join(', ');
    if (r.status >= 300 && r.status < 400) { moved++; console.log(`warning  ${url} redirects to ${r.location} (${on})`); }
    else if (!(r.status >= 200 && r.status < 300)) { failed++; console.log(`error    ${url}: ${r.status || r.error} (${on})`); }
  }
  console.log(`\nChecked ${links.size} outside links: ${failed} failing, ${moved} redirecting.`);
  process.exit(failed ? 1 : 0);
}

main();
