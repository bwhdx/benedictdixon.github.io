# Benedict W. H. Dixon · An Almanack

Personal site for [benedictdixon.com](https://benedictdixon.com), set as a book: a navy cover with a portrait drawn in candles from a brightness sample of a photograph, a contents page, five chapters, and the essays.

## Stack

- **Static**: HTML, CSS and React, deployed on GitHub Pages. The home page is rendered to HTML at build (`tools/prerender.cjs`) and React takes it over in the browser (`boot.jsx`, `hydrateRoot`), so the cover and chapters arrive with the first response.
- **React 18**: pre-compiled JSX (no in-browser Babel). React and React-DOM are self-hosted in `vendor/`; the prerender uses the same version from `node_modules` and fails if they differ.
- **Type**: Fraunces (display and text, with its true italic), Inter (labels), JetBrains Mono (the mark). Self-hosted Latin subsets in `assets/fonts/`, with metric-matched local fallbacks so the font swap barely moves a line.
- **Palette**: royal navy `#1c267a` on warm ochre paper `#d0b57a` with a fine seeded grain (two small SVG noise tiles in `site.css` and `writing.css`). The mark is the five-candle bwhdx cipher.

## Local dev

```bash
npm install
npm run build          # compile *.jsx, bundle, prerender the home page, update the static pages
npm run build:og       # regenerate every share card (tools/generate-cards.cjs)
npm run build:covers   # write the essay covers' sizes and formats (macOS sips, cwebp)
npm run build:favicons # rasterise favicons/*.png from the two SVG sources
npm run check          # read-only publish check; run before every publish
npm run check:links    # every outside link, over the network; run by hand before publishing
```

The build tools that render (share cards) use Playwright's Chromium headless shell: `npx playwright-core install chromium-headless-shell`, or set `CHROMIUM_PATH`.

**One source for each fact.** `tools/site-data.cjs` holds the cover line (`COVER_LINE`, swap it there, then `npm run build` and `npm run build:og`), the chapters, and the list of essays, read from the essay pages themselves. Everything that lists essays is generated from that list by `tools/build-pages.cjs`: each essay's word count and reading time, the contents list of long essays, Further reading, the closing colophon line, the listing's reading times, the 404 page's newest essays, `sitemap.xml`, `feed.xml` and the essay list in `llms.txt`. It also sets typographer's quotes in every page's text, titles and descriptions. Generated parts sit between `<!-- build:NAME -->` markers and are rewritten whole on each run; the build is idempotent.

**Publishing an essay** is now: add `writing/<slug>/index.html` (copy an existing essay; leave the build blocks empty, and list the essays to read next as links inside the `build:further` block), add it to `writing/index.html`, then `npm run build`, `npm run build:og` and `npm run check`. The sitemap, feed, `llms.txt` and the home page's dates and reading times follow.

`npm run check` (`tools/check-site.cjs`) confirms that every essay is in the listing, the sitemap and the feed, that its canonical, Open Graph and Twitter tags are right, and that its publish date agrees everywhere it is written. It also fails a stale build: reading times and word counts, the newest essay in every list, the prerendered home page, share cards against their inputs, links without an accessible name, faint ink used for text, links to kash.bot or markets in the structured data. It exits 1 on any error; warnings alone exit 0.

Serve locally with any static server, e.g. `python3 -m http.server 8000`.

## Layout

```
index.html                       Entry point, meta tags, JSON-LD, and the prerendered page
site.css                         Home page styles, including @font-face declarations
writing.css                      Essays, listing, /ai/, /hosts/ and 404 styles (kept in step with site.css)
*.jsx / *.js                     React components (source + compiled; bundle.js and scroll-motion.js ship)
portfolio-app.jsx                Top-level composition
boot.jsx                         Starts the app in the browser (hydrates the prerendered page)
site-content.jsx                 Cover, contents, chapters I to V (career ledger in II), colophon
scroll-motion.jsx                Scroll motion: candle progress row, plate and row reveals, cover drift
                                 (CSS scroll-driven animations, with an IntersectionObserver fallback)
portrait-renderers.jsx           Candlestick portrait renderer (cover and share cards)
writing/book.js                  Running head, contents sheet and code-block fade on the static pages
assets/
  fonts/                         Self-hosted woff2 fonts
  covers/                        Essay covers: <slug>.jpg (1400 px, 16:9), its sizes and formats, and
                                 covers.json, each cover's alt text. A cover opens its essay, heads
                                 its row in /writing/ and is its share card. To add one: copy it in
                                 as <slug>.jpg, add its alt text, then build:covers, build:og, build
  beanie_hero_16x9_navySides.json  Brightness grid for the candlestick portrait
  og-image.png, og/              Share cards; og/cards.json records what each was drawn from
favicons/                        Favicon set: favicon.svg (rounded tile) and favicon-maskable.svg
                                 (full bleed, for iOS and Android masks) are the sources; the PNGs
                                 are generated from them
vendor/                          Self-hosted React + React-DOM
tools/
  site-data.cjs                  The shared facts: cover line, chapters, essays
  bundle.cjs, site-globals.cjs   bundle.js, opening with window.SITE (the facts the home page needs)
  prerender.cjs                  Renders the home page into index.html
  build-pages.cjs                Keeps the static pages, sitemap, feed and llms.txt in step
  generate-cards.cjs, cards/     Share cards, drawn in the browser with the site's own fonts
  build-covers.sh                Essay cover sizes and formats (AVIF, WebP, JPEG)
  check-site.cjs                 Read-only publish check (npm run check)
  check-links.cjs                Outside links (npm run check:links)
  generate-favicons.sh           Rasterises the favicon PNGs (npm run build:favicons)
404.html                         Off the page: the newest essays and the way back
robots.txt, sitemap.xml          Crawler-facing
site.webmanifest                 PWA manifest
```

## Analytics

Cloudflare Web Analytics, cookieless. Every page except the retired-essay redirect loads the beacon just before `</body>`:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "CF_BEACON_TOKEN"}'></script>
```

**Off for now:** until the real token is set, the line ships inside an HTML comment (`<!-- off until the token is set: … -->`) so no page calls Cloudflare with a placeholder; `npm run check` warns once that analytics is off, and fails if some pages have it on and others off. The home page's colophon says "No cookies, and no analytics." while it is off and "No cookies. Anonymous page counts by Cloudflare Web Analytics." once the beacon is live; `npm run build` picks the line from the beacon's state, so the note never claims more or less than the page does. To switch it on, unwrap the comment and replace `CF_BEACON_TOKEN` with the site token from the Cloudflare dashboard (Web Analytics → the site → Manage site → the JS snippet). The token is a public site identifier, not a secret. A new page copies the same line.

## Deployment

Push to `main`. GitHub Pages serves `benedictdixon.com` via the `CNAME` file. No CI required.
