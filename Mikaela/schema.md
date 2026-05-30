# Recipe schema

Each recipe lives at `recipes/<slug>/` with two source files:

- `recipe.json` — structured data (required fields validated at build time)
- `essay.html` — the prose, free-form HTML (her thoughts on the dish)

Optional alongside:
- `hero.jpg` (the original photo; build pipeline generates sized variants)
- Additional process photos

The build script reads both and generates the final `recipes/<slug>/index.html` with:

- Static HTML markup for hero, meta, ingredients, method, notes
- `<script type="application/ld+json">` with `schema.org/Recipe` for SEO
- The prose `<article>` block below the structured part
- Related recipes at the bottom (cross-linking, internal SEO)

## `recipe.json` schema

```jsonc
{
  "title": "Brown butter chocolate chip cookies",
  "dek": "The diner cookie, refined. Browned butter + 24h rest.",
  "publishedAt": "2026-06-12",
  "updatedAt": "2026-06-15",                  // optional
  "category": "baking",                        // free-form, no enforced taxonomy
  "cuisine": "American",                       // free-form
  "difficulty": "moderate",                    // enum: "easy" | "moderate" | "involved"
  "tags": ["cookies", "brown butter", "make-ahead"],
  "serves": "makes 18 cookies",                // free-form display string
  "totalTime": "PT26H",                        // ISO 8601 duration (incl. resting time)
  "activeTime": "PT45M",                       // ISO 8601 duration
  "heroImage": "hero.jpg",                     // relative to recipe dir
  "heroAlt": "A stack of three dark-edged chocolate chip cookies on parchment.",
  "ingredients": [
    {
      "section": "dough",                      // optional grouping label
      "items": [
        {
          "metric": "227g",                    // REQUIRED — European/metric
          "us": "1 cup",                       // REQUIRED — North American
          "item": "unsalted butter",
          "note": "browned, cooled to room temp"   // optional
        },
        {
          "metric": "200g",
          "us": "1 cup",
          "item": "light brown sugar, packed"
        }
      ]
    },
    {
      "section": "to finish",
      "items": [
        { "metric": "flaky", "us": "flaky", "item": "Maldon salt", "note": "to taste" }
      ]
    }
  ],
  "steps": [
    "Brown the butter in a light-coloured pan over medium heat...",
    "Whisk in the sugars while the butter is still warm..."
  ],
  "notes": [                                   // optional
    "The 24h rest is doing real work — don't skip.",
    "Underbake by a minute for chewy centres."
  ],
  "related": [                                 // optional — slugs of related recipes
    "salted-caramel-blondies",
    "rye-shortbread"
  ]
}
```

## Validation rules (enforced by `tools/validate.cjs`)

- All fields except `updatedAt`, `notes`, `related`, ingredient `note`, and ingredient
  `section` are **required**.
- `metric` and `us` are **required on every ingredient row**. Build fails if missing.
- `difficulty` must be one of `easy | moderate | involved`.
- `totalTime` and `activeTime` must be valid ISO 8601 durations.
- `heroAlt` must be present and ≥ 20 characters (a11y + AI).
- `publishedAt` must be ISO date format `YYYY-MM-DD`.

## `essay.html` format

Plain HTML. Will be wrapped in `<article class="recipe-essay">` in the rendered page.
Use semantic markup — paragraphs, headings (`<h2>` and below; `<h1>` is the recipe title),
blockquotes, links. No `<script>`, no inline styles.

```html
<p>I first made these on a Tuesday when my cookies-and-cream cravings…</p>

<h2>Why brown butter</h2>
<p>The hazelnut notes from browning shift the whole cookie towards…</p>
```

## Authoring workflow

```bash
# 1. Copy the template
cp -r recipes/_template recipes/my-new-recipe

# 2. Edit recipe.json and essay.html, drop in hero.jpg

# 3. Generate sized photo variants
npm run photos

# 4. Build
npm run build

# 5. Commit and push
git add recipes/my-new-recipe/
git commit -m "New recipe: my new recipe"
git push origin main
```
