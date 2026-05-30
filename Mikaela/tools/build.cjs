// Main build script. After babel has compiled src/*.jsx → build/*.js, this script:
//   1. Reads every recipes/<slug>/recipe.json + essay.html
//   2. Renders each recipe page to static HTML using the JSX templates
//   3. Generates the home page (with latest recipes)
//   4. Generates the recipes index
//   5. Generates the about + 404 pages
//   6. Generates RSS, sitemap, llms.txt
//
// No client-side React. The browser gets pure HTML + the small client.js for toggles.

const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

const { Home, RecipesIndex, About, RecipePageTemplate, NotFound } = require(path.join(BUILD, 'Pages.js'));
const { SITE } = require(path.join(BUILD, 'Layout.js'));

const DOCTYPE = '<!DOCTYPE html>\n';

function renderPage(element) {
  return DOCTYPE + ReactDOMServer.renderToStaticMarkup(element);
}

function writeFile(relPath, content) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log(`  wrote ${relPath} (${(content.length / 1024).toFixed(1)} KB)`);
}

function loadRecipes() {
  const recipesDir = path.join(ROOT, 'recipes');
  if (!fs.existsSync(recipesDir)) return [];

  return fs.readdirSync(recipesDir)
    .filter(name => {
      const full = path.join(recipesDir, name);
      return fs.statSync(full).isDirectory() && !name.startsWith('_') && !name.startsWith('.');
    })
    .map(slug => {
      const recipe = JSON.parse(fs.readFileSync(path.join(recipesDir, slug, 'recipe.json'), 'utf8'));
      const essayHtml = fs.readFileSync(path.join(recipesDir, slug, 'essay.html'), 'utf8');
      return { slug, recipe, essayHtml };
    })
    .sort((a, b) => b.recipe.publishedAt.localeCompare(a.recipe.publishedAt));
}

function recipeJsonLd(slug, recipe) {
  const url = `${SITE.origin}/recipes/${slug}/`;
  const heroUrl = `${SITE.origin}/recipes/${slug}/${recipe.heroImage}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.dek,
    image: [heroUrl],
    author: { '@type': 'Person', name: SITE.author },
    datePublished: recipe.publishedAt,
    ...(recipe.updatedAt && { dateModified: recipe.updatedAt }),
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine,
    recipeYield: recipe.serves,
    totalTime: recipe.totalTime,
    cookTime: recipe.activeTime,
    keywords: recipe.tags.join(', '),
    recipeIngredient: recipe.ingredients.flatMap(g =>
      g.items.map(i => {
        const note = i.note ? `, ${i.note}` : '';
        return `${i.metric} (${i.us}) ${i.item}${note}`;
      })
    ),
    recipeInstructions: recipe.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step,
    })),
    url,
    mainEntityOfPage: url,
  };
}

function recipeCardData(slug, recipe) {
  return {
    slug,
    title: recipe.title,
    dek: recipe.dek,
    category: recipe.category,
    cuisine: recipe.cuisine,
    heroImage: recipe.heroImage,
    heroAlt: recipe.heroAlt,
    publishedAt: recipe.publishedAt,
  };
}

function buildRecipePages(recipes) {
  for (const { slug, recipe, essayHtml } of recipes) {
    const related = (recipe.related || [])
      .map(relSlug => recipes.find(r => r.slug === relSlug))
      .filter(Boolean)
      .map(r => recipeCardData(r.slug, r.recipe));

    const jsonLd = recipeJsonLd(slug, recipe);
    const html = renderPage(React.createElement(RecipePageTemplate, {
      recipe,
      slug,
      essayHtml,
      relatedRecipes: related,
      jsonLd,
    }));
    writeFile(`recipes/${slug}/index.html`, html);
  }
}

function buildHome(recipes) {
  const latest = recipes.slice(0, 6).map(({ slug, recipe }) => recipeCardData(slug, recipe));
  const html = renderPage(React.createElement(Home, { latestRecipes: latest }));
  writeFile('index.html', html);
}

function buildRecipesIndex(recipes) {
  const cards = recipes.map(({ slug, recipe }) => recipeCardData(slug, recipe));
  const html = renderPage(React.createElement(RecipesIndex, { recipes: cards }));
  writeFile('recipes/index.html', html);
}

function buildAbout() {
  const html = renderPage(React.createElement(About));
  writeFile('about/index.html', html);
}

function build404() {
  const html = renderPage(React.createElement(NotFound));
  writeFile('404.html', html);
}

function buildRss(recipes) {
  const items = recipes.map(({ slug, recipe }) => {
    const url = `${SITE.origin}/recipes/${slug}/`;
    return `  <entry>
    <title>${escapeXml(recipe.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <updated>${recipe.updatedAt || recipe.publishedAt}T00:00:00Z</updated>
    <published>${recipe.publishedAt}T00:00:00Z</published>
    <summary>${escapeXml(recipe.dek)}</summary>
    <category term="${escapeXml(recipe.category)}"/>
  </entry>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE.name)}</title>
  <link href="${SITE.origin}/"/>
  <link rel="self" href="${SITE.origin}/feed.xml"/>
  <id>${SITE.origin}/</id>
  <updated>${new Date().toISOString()}</updated>
  <author><name>${escapeXml(SITE.author)}</name></author>
${items}
</feed>
`;
  writeFile('feed.xml', xml);
}

function buildSitemap(recipes) {
  const urls = [
    { loc: `${SITE.origin}/`, priority: '1.0' },
    { loc: `${SITE.origin}/recipes/`, priority: '0.9' },
    { loc: `${SITE.origin}/about/`, priority: '0.5' },
    ...recipes.map(({ slug, recipe }) => ({
      loc: `${SITE.origin}/recipes/${slug}/`,
      lastmod: recipe.updatedAt || recipe.publishedAt,
      priority: '0.8',
    })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  writeFile('sitemap.xml', xml);
}

function buildLlmsTxt(recipes) {
  // llms.txt convention — a markdown index for LLM crawlers.
  // https://llmstxt.org/
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.tagline} Recipes for home cooking, every ingredient given in both metric and US.`,
    '',
    '## Recipes',
    '',
    ...recipes.map(({ slug, recipe }) =>
      `- [${recipe.title}](${SITE.origin}/recipes/${slug}/): ${recipe.dek}`
    ),
    '',
    '## Pages',
    '',
    `- [About](${SITE.origin}/about/): About the author and the site.`,
    `- [All recipes](${SITE.origin}/recipes/): Full recipe index.`,
    '',
  ];
  writeFile('llms.txt', lines.join('\n'));
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function main() {
  console.log('Loading recipes…');
  const recipes = loadRecipes();
  console.log(`Found ${recipes.length} recipe${recipes.length === 1 ? '' : 's'}.\n`);

  console.log('Building recipe pages…');
  buildRecipePages(recipes);

  console.log('\nBuilding home…');
  buildHome(recipes);

  console.log('\nBuilding /recipes/ index…');
  buildRecipesIndex(recipes);

  console.log('\nBuilding /about/…');
  buildAbout();

  console.log('\nBuilding /404…');
  build404();

  console.log('\nBuilding feed.xml…');
  buildRss(recipes);

  console.log('\nBuilding sitemap.xml…');
  buildSitemap(recipes);

  console.log('\nBuilding llms.txt…');
  buildLlmsTxt(recipes);

  console.log('\nDone.');
}

main();
