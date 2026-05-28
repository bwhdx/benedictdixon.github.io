# Benedict W. H. Dixon · An Almanack

Personal site for [benedictdixon.com](https://benedictdixon.com) — an editorial-newspaper-style portfolio rendered with React + a candlestick-portrait visual built from a brightness sample of a photograph.

## Stack

- **Static** — vanilla HTML/CSS/React, deployed via GitHub Pages, no SSR required.
- **React 18** — pre-compiled JSX (no in-browser Babel). React/React-DOM self-hosted in `vendor/`.
- **Type** — Fraunces (display), Inter (body), JetBrains Mono (meta). Self-hosted Latin subsets in `assets/fonts/`.
- **Palette** — royal navy `#1c267a` on warm cream `#d6c585`.

## Local dev

```bash
npm install
npm run build      # compile *.jsx → *.js
npm run build:og   # regenerate assets/og-image.png from the brightness grid
```

Serve locally with any static server, e.g. `python3 -m http.server 8000`.

## Layout

```
index.html                       Entry point + meta tags + JSON-LD
site.css                         All styles, including @font-face declarations
*.jsx / *.js                     React components (source + compiled)
portfolio-app.jsx                Top-level composition
site-content.jsx                 Hero, About, Projects, Services, Writing, Contact
morph-stage.jsx                  Scroll-driven candlestick portrait → career → world morph
portrait-renderers.jsx           Candlestick portrait renderer (hero)
cursor-fx.jsx                    Cursor candle-wick trail
assets/
  fonts/                         Self-hosted woff2 fonts
  *.json                         Brightness grids for the candlestick portraits
  og-image.png                   Open Graph cover image
favicons/                        Full favicon set
vendor/                          Self-hosted React + React-DOM
tools/
  generate-og.cjs                Regenerates the OG image from the hero grid
404.html                         Editorial 404 page
robots.txt, sitemap.xml          Crawler-facing
site.webmanifest                 PWA manifest
```

## Deployment

Push to `main`. GitHub Pages serves `benedictdixon.com` via the `CNAME` file. No CI required.
