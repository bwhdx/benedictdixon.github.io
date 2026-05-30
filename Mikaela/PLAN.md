# Mikaela Ikenouye · Cooking & Baking Site — Plan

A personal blog/portfolio site for Mikaela, focused on recipes (cooking + baking) with room
to grow into adjacent writing (techniques, ingredient deep-dives, restaurant notes, etc.).

The site at `../` (benedictdixon.com) is the **reference for stack, structure, and craft**.
We reuse the same architecture (vanilla HTML + pre-compiled JSX + GitHub Pages, edit-and-push
workflow). The **visual identity and tone are completely different** — different palette,
different type, different layout, different feel.

## Locked decisions (from Mikaela)

- **Tone**: warm, friendly, casual. Not editorial-newspaper. Approachable home cooking.
- **Recipe page order** (this is a strong opinion — preserve it):
  1. Hero photo
  2. Title + dek
  3. Meta (serves, time)
  4. Ingredients
  5. Method / instructions
  6. *Then* her thoughts/notes on the dish (the prose)

  Rationale: anti-food-blog. Readers shouldn't have to scroll past a personal essay to find
  the recipe. The essay is the dessert, not the appetiser. **Do not let design or SEO temptations
  reverse this order later.**
- **Taxonomy**: mix of categories + tags. **No predefined category set** — categories are
  free-form strings, added as recipes are written. No enforced taxonomy. (If the set grows
  unwieldy later, we consolidate then.)
- **Measurements**: both metric (EU) **and** US measurements are **required on every
  ingredient row**. Hard schema requirement, enforced at build time. Surfaced in the UI as
  a US/metric toggle (default to user's locale via browser hint).
- **Cuisine + difficulty**: both included as recipe metadata. Cuisine is free-form (e.g.
  "Italian", "Japanese", "British"). Difficulty is a small enum — proposed: `easy`,
  `moderate`, `involved`. Both enable filtering on the recipes index later.
- **Photography**: Mikaela shoots, commits images to the repo alongside each recipe.
- **Scope**: home cooking. Recipes are the spine; longer essays may come later but are not the
  main shape of the site.
- **Audience & goal**: friends and family today, but the site exists to **establish her
  personal brand and grow**. SEO + AI SEO are therefore first-class concerns, not polish
  tasks — see §9.

---

## 1. Stack — JSX-as-templating, full static output

- Static HTML + CSS, generated at build time from JSX templates via `react-dom/server`.
- **No client-side React.** Browser receives pure static HTML + a tiny vanilla JS file for
  interactivity (US/metric toggle, mobile nav).
- Edit `recipe.json` + `essay.html` per recipe → `npm run build` → commit source + generated
  HTML → push to main → GitHub Pages serves static.

Why this differs from Benedict's pattern, in the part that matters:

Benedict's home page uses client-side React for an interactive visual showcase; his actual
content lives in `/writing/<slug>/` static HTML pages. For him that's the right trade-off —
the home is theatre, the essays are SEO.

Mikaela's home **is** content discovery. The latest recipes block needs to be crawlable
immediately by Google and (more importantly) AI crawlers like GPTBot, PerplexityBot,
Claude-Web — most of which do not execute JS reliably. So we go full static everywhere:
home, recipes index, every recipe page, about. JSX still gives us reusable templates and
a nice authoring experience for components — it just runs at build time, not in the browser.

Why not SSG (Astro/Eleventy):
- We get a similar outcome (markdown/data → static HTML) with ~150 lines of Node we control,
  no framework upgrade treadmill, no plugin ecosystem to learn.
- The build pipeline mirrors Benedict's structurally — one `npm run build` command, JSX gets
  compiled, outputs get written, commit + push.

---

## 2. Component model

The big win over Benedict's site is that recipes are **structured**, where his essays are
prose. We design a small set of components once, then every recipe is the same shape with
different data.

### Shared layout
- `<SiteHeader>` — site-wide nav (name/logo, Recipes, About)
- `<SiteFooter>` — credits, RSS, contact
- `<Hero>` — home page hero (her signature visual element — TBD, see §5)

### Recipe primitives
- `<RecipeHero>` — title, dek, photo, meta strip (serves / total time / active time)
- `<RecipeMeta>` — the strip itself (serves, times, difficulty?, etc.)
- `<RecipeIngredients>` — sticky-on-desktop ingredients list, US + metric toggle later
- `<RecipeSteps>` — numbered method
- `<RecipeNotes>` — variations, tips, make-ahead
- `<PhotoFigure>` — image + optional caption, responsive srcset

### Index/listing
- `<RecipeCard>` — used on home (latest 3–6) and recipes index (all)
- `<RecipeIndex>` — full index page; filterable by category/tag

### Data shape
Each recipe page splits content into two zones:

- **Structured data** (hero, meta, ingredients, method) → JSON block, rendered by React.
- **Prose** (her thoughts on the dish) → plain HTML below, styled with CSS, no React touch.

This split matters: ingredients/steps are well-shaped data and benefit from JSON; the essay
is naturally HTML and authoring it inside a JSON string would be miserable (escape hell,
no syntax highlighting).

```html
<body>
  <div id="recipe-root"></div>                       <!-- React mounts hero+meta+ingredients+method -->

  <article class="recipe-essay">                     <!-- Prose, normal HTML, lives below -->
    <p>I first made this on a Tuesday when...</p>
    <p>...</p>
  </article>

  <script type="application/json" id="recipe-data">
  {
    "title": "Brown butter chocolate chip cookies",
    "dek": "The diner cookie, refined.",
    "publishedAt": "2026-06-12",
    "category": "baking",
    "tags": ["cookies", "browned butter"],
    "serves": "makes 18",
    "totalTime": "PT3H",
    "activeTime": "PT30M",
    "heroImage": "./hero.jpg",
    "cuisine": "American",
    "difficulty": "moderate",
    "ingredients": [
      { "section": "dough", "items": [
        { "metric": "227g", "us": "1 cup", "item": "unsalted butter" }
      ]}
    ],
    "steps": [
      "Brown the butter in a light-coloured pan until it smells like toffee...",
      "..."
    ],
    "notes": ["Dough improves after 24h in the fridge."]
  }
  </script>
  <script src="/recipe-app.js"></script>
</body>
```

A shared `Recipe` React component reads `#recipe-data` on mount and renders the top of the
page. The `<article class="recipe-essay">` block sits below it and is just styled HTML.

The same JSON powers:
- The page itself (via React)
- `<script type="application/ld+json">` for schema.org/Recipe (generated at build time
  by a small Node script, like Benedict's `tools/generate-og.cjs`)
- OG image generation (per-recipe cover with title + hero photo)
- The recipes index (a build script reads all recipe directories, extracts the JSON,
  outputs the index data)
- RSS / sitemap

### Recipes index
Hand-edited HTML listing pages, same as Benedict's `writing/index.html` — *or* generated
by a build script reading every `recipes/*/index.html`'s JSON block. Probably generate
it: one less place to forget to update, and recipes will be added more frequently than
essays.

---

## 3. File layout (mirrors Benedict's)

```
Mikaela/                          (will move out to its own repo once domain locked)
  index.html                      Home: hero + latest recipes + about teaser
  recipes.css                     All styles (parallel to Benedict's site.css)
  recipe-app.jsx → .js            Component library + entry
  recipe-components.jsx → .js     Recipe primitives
  site-components.jsx → .js       Header, footer, hero
  tools/
    bundle.cjs                    Same bundler approach as Benedict's
    generate-recipe-jsonld.cjs    Recipe JSON-LD per page
    generate-recipes-index.cjs    Build the /recipes/ index from all recipe JSON
    generate-og.cjs               Per-recipe OG images
  recipes/
    <slug>/
      index.html                  Recipe page (embeds JSON, mounts React)
      hero.jpg                    Hero photo
      ...                         Process photos
  assets/
    fonts/
    og-image.png
  vendor/                         Self-hosted React (could symlink/copy Benedict's)
  feed.xml
  sitemap.xml
  404.html
  CNAME
```

---

## 4. Locked recipe schema

```ts
{
  title: string,
  dek: string,              // short, search-friendly intro line
  publishedAt: string,      // ISO date
  updatedAt?: string,
  category: string,         // free-form, no enforced taxonomy
  cuisine: string,          // free-form
  difficulty: "easy" | "moderate" | "involved",
  tags: string[],           // free-form
  serves: string,           // "serves 4", "makes 18 cookies"
  totalTime: string,        // ISO 8601 duration, e.g. "PT3H"
  activeTime: string,       // ISO 8601 duration
  heroImage: string,        // relative path
  ingredients: Array<{
    section?: string,                            // optional grouping
    items: Array<{
      metric: string,                            // REQUIRED — "227g"
      us: string,                                // REQUIRED — "1 cup"
      item: string,                              // "unsalted butter"
      note?: string                              // "softened", "room temp"
    }>
  }>,
  steps: string[],          // plain method steps, no embedded HTML
  notes?: string[],          // tips, variations, make-ahead
  related?: string[]         // slugs of related recipes for internal linking (SEO)
}
```

Build-time validation: `metric` and `us` are required on every ingredient row. Build fails
if either is missing. (Cheap script, prevents recipes shipping broken.)

## 5. Open questions remaining

All Phase 0 questions are now resolved.

Locked:
- **Build step**: same as Benedict's site. Write `.jsx`, run `npm run build` locally
  (Babel JSX → JS + bundler), commit source + compiled output, push to main. GitHub Pages
  serves static. No SSG, no CI build, no server-side rendering.
- **Photo build step**: start with manual `npm run photos`, revisit if it becomes friction.

---

## 6. Visual direction

Tone is locked: **warm, friendly, casual**. That rules out a few things and points us
toward others.

**Rule out**:
- Newspaper-editorial rigidity (Benedict's site).
- Stark white + thin sans (the cold/minimalist food blog look).
- Heavy Didone display type (too magazine-y).
- Slick motion effects, cursor trails, dark mode — they read as "designed" not "homey".

**Lean toward**:
- Warm off-white / cream background. Not stark white.
- A friendly serif or rounded humanist sans for body (Fraunces in a softer weight, Recoleta,
  DM Serif, Söhne, or similar). Final pairing TBD in Phase 2.
- Generous line-height, comfortable column width.
- Photos given room to breathe.
- A logotype that feels handwritten or lightly informal, not corporate.

**Hero treatment** for home page — needs a signature element parallel to Benedict's
candlestick portrait, but totally different. Possibilities:
- Big, beautifully-shot hero photo of a recent dish, rotating.
- A typographic hero — her name or site name in a warm serif, with a single recent recipe
  card alongside.
- A hand-drawn mark / illustration (kitchen object — a whisk, rolling pin, knife — drawn
  in line).
- A small photo grid that shows the last 4 recipes as a tiled mosaic.

Recommend the typographic-hero-plus-latest-recipe option for v1 — it's warm, it doesn't
require commissioned illustration, and it lets the recipes lead. Revisit in Phase 2 with
Mikaela.

---

## 7. Information architecture

```
/                        Hero + latest 3–6 recipes + about teaser
/recipes/                Full index, filterable (category, cuisine, difficulty, tags)
/recipes/<slug>/         Individual recipe
/writing/                (optional) longer-form essays/notes
/writing/<slug>/
/about/                  Bio, photo, contact
/feed.xml                RSS
/sitemap.xml             Sitemap
/llms.txt                LLM crawler hints (see §9)
/robots.txt
```

**Recipe page top-to-bottom order** (the anti-food-blog spine):

1. Hero photo
2. Title + dek
3. Meta strip — serves, total time, active time, cuisine, difficulty
4. US/metric toggle
5. Ingredients (sticky on desktop, collapsible on mobile)
6. Method / instructions
7. Notes (tips, variations, make-ahead)
8. **Then** the prose — her thoughts on the dish, rendered from the `<article>` HTML below
9. Related recipes (auto-linked from `related` slugs in the JSON — internal linking is SEO gold)

---

## 8. Phased delivery

**Phase 0 — alignment.** Mostly complete. Confirm build-step semantics (§5) and we're done.

**Phase 1 — scaffold.** Set up file structure, vendor React, adapt Benedict's bundler.
Build the component library against ONE real recipe end-to-end with both US + metric and
all required fields populated. Goal: prove the model before designing.

**Phase 2 — design.** Lock palette + type + layout based on agreed tone (warm/friendly/casual).
Build hero. Style the recipe page and index against real content.

**Phase 3 — content.** Mikaela writes 5–10 recipes. Schema and styling get shaken out.
Pay attention to: real recipes with sub-sections (e.g. "for the dough", "for the filling"),
recipes with weird unit conversions, recipes with optional notes.

**Phase 4 — polish & launch.** Per-recipe JSON-LD, per-recipe OG images, RSS, sitemap,
`llms.txt`, 404, Lighthouse pass (perf + a11y ≥ 95), accessibility audit, domain cutover.

---

## 9. SEO and AI SEO — first-class concern

Mikaela's site is part of building her personal brand and is designed to grow. SEO + AI
crawler discoverability are required, not polish. Concrete tactics:

### Traditional SEO
- **`schema.org/Recipe` JSON-LD on every recipe page**, generated at build time from the
  same JSON block that powers the React render. Include `name`, `description`, `image`,
  `author`, `datePublished`, `prepTime`, `cookTime`, `totalTime`, `recipeYield`,
  `recipeIngredient` (combined `metric` + ingredient text), `recipeInstructions`
  (each step as `HowToStep`), `recipeCategory`, `recipeCuisine`. This unlocks Google's
  rich recipe results.
- **Per-recipe OG images** (1200×630) generated by build script. Title + hero photo crop +
  site mark. Same approach as Benedict's `tools/generate-og.cjs`.
- **Per-page meta descriptions** (use the `dek` field as the seed — keep ≤155 chars).
- **Semantic HTML**: `<h1>` for recipe title only, `<h2>` for Ingredients / Method / Notes,
  proper `<ol>` for steps, proper `<ul>` for ingredients.
- **Alt text discipline**: every photo has descriptive alt text. Build script flags missing.
- **Internal linking**: `related` slugs in the JSON → rendered "More like this" block at
  the bottom of each recipe. Cross-linking is one of the highest-ROI SEO moves.
- **Clean URLs**: `/recipes/brown-butter-chocolate-chip-cookies/` not query strings.
- **Core Web Vitals**: lazy-load below-the-fold images, preload hero, ship webp with jpg
  fallback, no render-blocking JS where avoidable.
- **Sitemap** auto-generated from the recipe directory listing, submitted to GSC after launch.

### AI SEO (LLM crawler discoverability)
- **`/llms.txt`**: emerging convention, machine-readable index of the site's main content,
  in markdown. Auto-generated by build script from the recipes list. Helps ChatGPT / Claude /
  Perplexity crawl the site cleanly.
- **Plain factual content**: LLMs reward clear factual structure. Our JSON-driven recipes
  already have this — structured ingredients, numbered steps, explicit times. The prose
  essay below is bonus, not load-bearing.
- **Authoritative outbound links** in the prose where relevant (technique sources, ingredient
  origins) — E-E-A-T signal, helps Google rank her as a primary source.
- **Don't gate content behind JS** for above-the-fold content. The React render is fine
  because Google JS-renders, but for AI crawlers it's safer to also include the same
  content as static HTML where possible. Worth testing: server-render the JSON into static
  HTML at build time, hydrate with React. Adds complexity — defer until we see crawler
  behaviour.

### What we are deliberately NOT doing for SEO
- No keyword-stuffing in deks or alt text.
- No "story before recipe" gimmick (we explicitly inverted this).
- No comments-driven recipe engagement (some food blogs use this; we don't).

---

## 10. What we are NOT doing

- Comments (static-incompatible).
- Newsletter signup (defer until there's a readership).
- E-commerce / affiliate links.
- Multi-author, i18n, mobile app.
- A SSG or CMS (covered above — explicitly out).

See `TODO.md` for concrete next steps.
