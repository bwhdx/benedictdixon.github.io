// Top-level page templates: Home, RecipesIndex, About, NotFound.
// Each receives data from the build script and returns the full <html> tree.

const React = require('react');
const { Layout, SITE } = require('./Layout.js');
const { RecipeCard, RecipePage } = require('./RecipeComponents.js');

function Home({ latestRecipes }) {
  return (
    <Layout
      title={SITE.name}
      description={`${SITE.tagline} Recipes and notes from the kitchen by ${SITE.author}.`}
      canonicalPath="/"
    >
      <section className="home-hero">
        <p className="home-hero__kicker">{SITE.tagline}</p>
        <h1 className="home-hero__title">{SITE.name}</h1>
        <p className="home-hero__lede">
          Recipes for things I actually make at home — written so you can cook them too.
          Ingredients in metric and cups. The story comes after the recipe, not before it.
        </p>
      </section>

      <section className="home-latest" aria-labelledby="latest-heading">
        <h2 id="latest-heading" className="home-latest__heading">Latest</h2>
        <ul className="recipe-grid">
          {latestRecipes.map(r => (
            <li key={r.slug}><RecipeCard recipe={r} /></li>
          ))}
        </ul>
        <p className="home-latest__more">
          <a href="/recipes/">All recipes →</a>
        </p>
      </section>
    </Layout>
  );
}

function RecipesIndex({ recipes }) {
  // Group by category for the index; categories are free-form so we derive
  // them from the recipes themselves.
  const groups = {};
  for (const r of recipes) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  const categories = Object.keys(groups).sort();

  return (
    <Layout
      title={`Recipes — ${SITE.name}`}
      description={`Every recipe — cooking and baking from ${SITE.author}. ${recipes.length} recipes and counting.`}
      canonicalPath="/recipes/"
    >
      <header className="page-header">
        <h1>Recipes</h1>
        <p className="page-header__lede">
          Everything I've written down. {recipes.length} recipe{recipes.length === 1 ? '' : 's'} so far.
        </p>
      </header>

      {categories.map(cat => (
        <section key={cat} className="recipe-category">
          <h2 className="recipe-category__heading">{cat}</h2>
          <ul className="recipe-grid">
            {groups[cat].map(r => (
              <li key={r.slug}><RecipeCard recipe={r} /></li>
            ))}
          </ul>
        </section>
      ))}
    </Layout>
  );
}

function About() {
  return (
    <Layout
      title={`About — ${SITE.name}`}
      description={`About ${SITE.author} — home cook, baker, and the story behind the site.`}
      canonicalPath="/about/"
    >
      <article className="about-page">
        <h1>About</h1>
        <p className="about-lede">
          {/* TODO: Mikaela's bio — to be written. Placeholder follows. */}
          Hi, I'm {SITE.author}. I cook at home and write down what works.
        </p>
        <p>
          This site exists because I wanted a place to keep the recipes I actually make,
          written the way I'd want to read them — picture first, ingredients next, method
          next, my notes at the bottom. No life story before the cookies.
        </p>
        <h2>Contact</h2>
        <p>
          {/* TODO: email link */}
          You can reach me at <a href="mailto:hello@example.com">hello@example.com</a>.
        </p>
      </article>
    </Layout>
  );
}

function RecipePageTemplate({ recipe, slug, essayHtml, relatedRecipes, jsonLd }) {
  const description = recipe.dek.length > 155
    ? recipe.dek.slice(0, 152).trim() + '…'
    : recipe.dek;
  return (
    <Layout
      title={`${recipe.title} — ${SITE.name}`}
      description={description}
      canonicalPath={`/recipes/${slug}/`}
      ogImage={`/recipes/${slug}/${recipe.heroImage}`}
      ogType="article"
      jsonLd={jsonLd}
    >
      <RecipePage recipe={recipe} slug={slug} essayHtml={essayHtml} relatedRecipes={relatedRecipes} />
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout
      title={`Page not found — ${SITE.name}`}
      description="The page you're looking for isn't here. Try the recipes index."
      canonicalPath="/404"
    >
      <article className="not-found">
        <h1>404 — burnt to a crisp.</h1>
        <p>That recipe isn't here. Try <a href="/recipes/">the index</a> instead.</p>
      </article>
    </Layout>
  );
}

module.exports = { Home, RecipesIndex, About, RecipePageTemplate, NotFound };
