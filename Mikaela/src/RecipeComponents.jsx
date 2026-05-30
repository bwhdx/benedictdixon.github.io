// Recipe-page primitives. Build-time only. Each function is a small JSX template
// that the build pipeline renders to static HTML via react-dom/server.

const React = require('react');

// Format an ISO 8601 duration like "PT3H30M" into a human string "3h 30m".
function formatDuration(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return iso;
  const [, h, min] = m;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (min) parts.push(`${min}m`);
  return parts.join(' ') || iso;
}

function RecipeHero({ recipe, slug }) {
  return (
    <header className="recipe-hero">
      <figure className="recipe-hero__figure">
        <img
          className="recipe-hero__image"
          src={`/recipes/${slug}/${recipe.heroImage}`}
          alt={recipe.heroAlt}
          width="1440"
          height="960"
        />
      </figure>
      <div className="recipe-hero__copy">
        <p className="recipe-hero__kicker">
          <span>{recipe.category}</span>
          {recipe.cuisine && <><span aria-hidden="true"> · </span><span>{recipe.cuisine}</span></>}
        </p>
        <h1 className="recipe-hero__title">{recipe.title}</h1>
        <p className="recipe-hero__dek">{recipe.dek}</p>
      </div>
    </header>
  );
}

function RecipeMeta({ recipe }) {
  return (
    <dl className="recipe-meta" aria-label="Recipe details">
      <div className="recipe-meta__item">
        <dt>Yield</dt>
        <dd>{recipe.serves}</dd>
      </div>
      <div className="recipe-meta__item">
        <dt>Total time</dt>
        <dd>{formatDuration(recipe.totalTime)}</dd>
      </div>
      <div className="recipe-meta__item">
        <dt>Active time</dt>
        <dd>{formatDuration(recipe.activeTime)}</dd>
      </div>
      <div className="recipe-meta__item">
        <dt>Difficulty</dt>
        <dd>{recipe.difficulty}</dd>
      </div>
    </dl>
  );
}

function UnitToggle() {
  // Renders the toggle UI. Client-side vanilla JS (client.js) handles state +
  // toggles the [data-units] attribute on <body>. Default served HTML shows
  // metric; JS may flip to US based on stored preference or locale hint.
  return (
    <div className="unit-toggle" role="group" aria-label="Measurement units">
      <button type="button" className="unit-toggle__btn is-active" data-units="metric" aria-pressed="true">
        Metric
      </button>
      <button type="button" className="unit-toggle__btn" data-units="us" aria-pressed="false">
        US
      </button>
    </div>
  );
}

function IngredientRow({ ingredient }) {
  // Render BOTH measurements inline. CSS hides the inactive one based on
  // <body data-units="...">. This way the static HTML contains both — visible
  // to crawlers, screen readers, and users without JS.
  return (
    <li className="ingredient">
      <span className="ingredient__qty ingredient__qty--metric">{ingredient.metric}</span>
      <span className="ingredient__qty ingredient__qty--us">{ingredient.us}</span>
      <span className="ingredient__item"> {ingredient.item}</span>
      {ingredient.note && <span className="ingredient__note">, {ingredient.note}</span>}
    </li>
  );
}

function RecipeIngredients({ recipe }) {
  return (
    <section className="recipe-ingredients" aria-labelledby="ingredients-heading">
      <div className="recipe-ingredients__head">
        <h2 id="ingredients-heading">Ingredients</h2>
        <UnitToggle />
      </div>
      {recipe.ingredients.map((group, gi) => (
        <div key={gi} className="ingredient-group">
          {group.section && <h3 className="ingredient-group__heading">{group.section}</h3>}
          <ul className="ingredient-group__list">
            {group.items.map((item, ii) => (
              <IngredientRow key={ii} ingredient={item} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function RecipeSteps({ recipe }) {
  return (
    <section className="recipe-steps" aria-labelledby="method-heading">
      <h2 id="method-heading">Method</h2>
      <ol className="recipe-steps__list">
        {recipe.steps.map((step, i) => (
          <li key={i} className="recipe-step">
            <span className="recipe-step__num" aria-hidden="true">{i + 1}</span>
            <p className="recipe-step__body">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RecipeNotes({ recipe }) {
  if (!recipe.notes || recipe.notes.length === 0) return null;
  return (
    <aside className="recipe-notes" aria-labelledby="notes-heading">
      <h2 id="notes-heading">Notes</h2>
      <ul className="recipe-notes__list">
        {recipe.notes.map((note, i) => <li key={i}>{note}</li>)}
      </ul>
    </aside>
  );
}

function RecipeEssay({ html }) {
  if (!html) return null;
  return (
    <article
      className="recipe-essay"
      aria-label="Notes from the cook"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function RelatedRecipes({ relatedRecipes }) {
  if (!relatedRecipes || relatedRecipes.length === 0) return null;
  return (
    <aside className="related-recipes" aria-labelledby="related-heading">
      <h2 id="related-heading">More like this</h2>
      <ul className="related-recipes__list">
        {relatedRecipes.map(r => (
          <li key={r.slug} className="related-recipe">
            <a href={`/recipes/${r.slug}/`}>
              <span className="related-recipe__title">{r.title}</span>
              <span className="related-recipe__dek">{r.dek}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function RecipeCard({ recipe }) {
  // Used on home + recipes index.
  return (
    <article className="recipe-card">
      <a href={`/recipes/${recipe.slug}/`} className="recipe-card__link">
        <figure className="recipe-card__figure">
          <img
            src={`/recipes/${recipe.slug}/${recipe.heroImage}`}
            alt={recipe.heroAlt}
            loading="lazy"
            width="640"
            height="427"
          />
        </figure>
        <div className="recipe-card__copy">
          <p className="recipe-card__kicker">
            <span>{recipe.category}</span>
            {recipe.cuisine && <><span aria-hidden="true"> · </span><span>{recipe.cuisine}</span></>}
          </p>
          <h3 className="recipe-card__title">{recipe.title}</h3>
          <p className="recipe-card__dek">{recipe.dek}</p>
        </div>
      </a>
    </article>
  );
}

function RecipePage({ recipe, slug, essayHtml, relatedRecipes }) {
  return (
    <article className="recipe">
      <RecipeHero recipe={recipe} slug={slug} />
      <RecipeMeta recipe={recipe} />
      <div className="recipe-body">
        <RecipeIngredients recipe={recipe} />
        <RecipeSteps recipe={recipe} />
        <RecipeNotes recipe={recipe} />
      </div>
      <RecipeEssay html={essayHtml} />
      <RelatedRecipes relatedRecipes={relatedRecipes} />
    </article>
  );
}

module.exports = {
  RecipeHero,
  RecipeMeta,
  RecipeIngredients,
  RecipeSteps,
  RecipeNotes,
  RecipeEssay,
  RelatedRecipes,
  RecipeCard,
  RecipePage,
  formatDuration,
};
