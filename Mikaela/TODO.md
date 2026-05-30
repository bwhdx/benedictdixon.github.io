# Mikaela Site — TODO

Living list. Check items off as we go. Sequenced; don't jump ahead of unanswered questions.

## Phase 0 — Alignment

Locked:
- [x] Tone: warm, friendly, casual
- [x] Recipe page order: photo → meta → ingredients → method → prose (anti-food-blog)
- [x] Taxonomy: categories + tags (mix of both)
- [x] Photography: Mikaela shoots, commits to repo
- [x] Scope: home cooking, recipes as the spine
- [x] Stack: same as Benedict's (HTML + compiled JSX + GitHub Pages)

Deferred (decide later, not blocking):
- [ ] Site name + domain (will run on github.io until decided)

Additionally locked:
- [x] Categories: free-form, no enforced taxonomy, add as we go
- [x] US + metric: required on every ingredient row, build-time enforced
- [x] `difficulty` field: included (enum: easy / moderate / involved)
- [x] `cuisine` field: included (free-form string)
- [x] Audience/goal: friends + family today, growth + personal brand the destination → SEO is critical
- [x] Photo build step: start with manual `npm run photos`, can change later

Additionally locked:
- [x] Build step: same as Benedict's site (JSX + local `npm run build` + commit compiled
      output + push to main, GitHub Pages serves static)

Phase 0 is complete. Ready for Phase 1 scaffolding.

Next pre-scaffold task:
- [ ] Extract the recipe JSON schema from PLAN.md §4 into `Mikaela/schema.md` as the
      single source of truth, referenced by build scripts and components

## Phase 1 — Scaffold ✅ COMPLETE

Architecture pivot during execution: **no client-side React**. JSX is used as a
build-time templating language via `react-dom/server` → static HTML. Browser gets
pure HTML + small `client.js` for unit toggle. This is the SEO-correct architecture
(visible to GPTBot, PerplexityBot, social scrapers, no-JS users).

Built:
- [x] `package.json` — Babel + React + sharp, scripts: build, photos, serve
- [x] `schema.md` — recipe JSON schema documentation
- [x] `src/Layout.jsx` — shared HTML shell + head meta + site chrome
- [x] `src/RecipeComponents.jsx` — recipe primitives (hero, meta, ingredients, steps, notes, essay, related, card, page)
- [x] `src/Pages.jsx` — Home, RecipesIndex, About, RecipePageTemplate, NotFound
- [x] `tools/validate.cjs` — fails build on missing required fields (especially metric/us)
- [x] `tools/build.cjs` — renders JSX → static HTML, generates RSS, sitemap, llms.txt, per-recipe JSON-LD
- [x] `tools/optimise-photos.cjs` — sharp-based responsive variant generation
- [x] `client.js` — vanilla JS unit toggle, localStorage-persisted, locale-defaulted
- [x] `site.css` — minimal structural CSS (Phase 1 placeholder; design lives in Phase 2)
- [x] `recipes/classic-chocolate-chip-cookies/` — sample recipe (recipe.json + essay.html + placeholder hero.jpg)
- [x] `robots.txt`, `site.webmanifest`, `favicons/favicon.svg`, `.gitignore`, `README.md`
- [x] `npm install` succeeds
- [x] `npm run build` succeeds — validated 1 recipe, generated 8 output files
- [x] Verified output: every recipe field, JSON-LD, OG meta, ingredients (both metric+US), method, prose, related, all visible in static HTML

## Phase 2 — Design

- [ ] Type pairing chosen (display + body + mono if needed) — self-host woff2 in `assets/fonts/`
- [ ] Colour palette locked
- [ ] Hero treatment for home page (signature visual element — TBD direction)
- [ ] Recipe page layout — sticky ingredients sidebar on desktop, collapsible on mobile
- [ ] Recipe card component for index + home
- [ ] About page design
- [ ] 404 page
- [ ] Cursor / motion treatment if any (parallel to Benedict's `cursor-fx.jsx`)

## Phase 3 — Content

- [ ] 5–10 recipes drafted by Mikaela
- [ ] Photo workflow agreed (where files live, sizing pipeline, alt text discipline)
- [ ] Tags / categories settled based on what real content reveals
- [ ] Build script: generate `/recipes/index.html` from all recipe JSON blocks

## Phase 4 — Launch

- [ ] Meta descriptions audit (use `dek` field, ≤155 chars per page)
- [ ] Alt text audit (build script flags missing)
- [ ] Internal linking — `related` slugs populated across recipes
- [ ] Lighthouse pass (perf + a11y ≥ 95)
- [ ] Submit sitemap to Google Search Console
- [ ] Move `Mikaela/` to its own repo (cleaner separation, her own GitHub if she wants)
- [ ] Domain DNS cutover + CNAME
- [ ] Final review with Mikaela
- [ ] Ship

## Backlog / nice-to-haves (post-launch)

- [ ] US ↔ metric toggle (React state in `<RecipeIngredients>`)
- [ ] Ingredient scaler (adjust serves, scales quantities)
- [ ] Search (Pagefind — static, no backend)
- [ ] Print-friendly recipe view
- [ ] Newsletter once there's readership (Buttondown / Beehiiv)
