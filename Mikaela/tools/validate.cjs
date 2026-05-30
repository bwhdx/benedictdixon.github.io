// Validate every recipe.json against the schema in schema.md.
// Build fails if any recipe is malformed. Catches missing metric/us, bad
// duration formats, missing alt text, etc. before HTML is generated.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RECIPES_DIR = path.join(ROOT, 'recipes');

const REQUIRED = ['title', 'dek', 'publishedAt', 'category', 'cuisine', 'difficulty',
  'tags', 'serves', 'totalTime', 'activeTime', 'heroImage', 'heroAlt',
  'ingredients', 'steps'];

const DIFFICULTY_ENUM = ['easy', 'moderate', 'involved'];

function isISODuration(s) {
  return typeof s === 'string' && /^PT(?:\d+H)?(?:\d+M)?$/.test(s) && s !== 'PT';
}

function isISODate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function validateRecipe(slug, recipe) {
  const errors = [];

  for (const field of REQUIRED) {
    if (recipe[field] === undefined || recipe[field] === null || recipe[field] === '') {
      errors.push(`missing required field: ${field}`);
    }
  }

  if (recipe.difficulty && !DIFFICULTY_ENUM.includes(recipe.difficulty)) {
    errors.push(`difficulty must be one of ${DIFFICULTY_ENUM.join(' | ')} (got "${recipe.difficulty}")`);
  }

  if (recipe.totalTime && !isISODuration(recipe.totalTime)) {
    errors.push(`totalTime must be ISO 8601 duration like "PT3H30M" (got "${recipe.totalTime}")`);
  }
  if (recipe.activeTime && !isISODuration(recipe.activeTime)) {
    errors.push(`activeTime must be ISO 8601 duration like "PT45M" (got "${recipe.activeTime}")`);
  }

  if (recipe.publishedAt && !isISODate(recipe.publishedAt)) {
    errors.push(`publishedAt must be YYYY-MM-DD (got "${recipe.publishedAt}")`);
  }

  if (recipe.heroAlt && recipe.heroAlt.length < 20) {
    errors.push(`heroAlt must be ≥ 20 chars for accessibility + AI (got ${recipe.heroAlt.length})`);
  }

  if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach((group, gi) => {
      if (!Array.isArray(group.items) || group.items.length === 0) {
        errors.push(`ingredients[${gi}].items must be a non-empty array`);
        return;
      }
      group.items.forEach((item, ii) => {
        const label = `ingredients[${gi}].items[${ii}]`;
        if (!item.metric) errors.push(`${label}.metric is required (every ingredient must have both metric and US)`);
        if (!item.us) errors.push(`${label}.us is required (every ingredient must have both metric and US)`);
        if (!item.item) errors.push(`${label}.item is required`);
      });
    });
  } else {
    errors.push('ingredients must be an array');
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    errors.push('steps must be a non-empty array of strings');
  }

  // Hero image file must actually exist
  if (recipe.heroImage) {
    const heroPath = path.join(RECIPES_DIR, slug, recipe.heroImage);
    if (!fs.existsSync(heroPath)) {
      errors.push(`heroImage "${recipe.heroImage}" not found at ${heroPath}`);
    }
  }

  // Essay file must exist
  const essayPath = path.join(RECIPES_DIR, slug, 'essay.html');
  if (!fs.existsSync(essayPath)) {
    errors.push(`essay.html not found — every recipe needs a prose essay`);
  }

  return errors;
}

function main() {
  if (!fs.existsSync(RECIPES_DIR)) {
    console.log('No recipes/ directory yet — skipping validation.');
    return;
  }

  const slugs = fs.readdirSync(RECIPES_DIR).filter(name => {
    const full = path.join(RECIPES_DIR, name);
    return fs.statSync(full).isDirectory() && !name.startsWith('_') && !name.startsWith('.');
  });

  if (slugs.length === 0) {
    console.log('No recipes to validate yet.');
    return;
  }

  let failed = false;
  for (const slug of slugs) {
    const jsonPath = path.join(RECIPES_DIR, slug, 'recipe.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`  ✗ ${slug}: missing recipe.json`);
      failed = true;
      continue;
    }
    let recipe;
    try {
      recipe = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (e) {
      console.error(`  ✗ ${slug}: invalid JSON — ${e.message}`);
      failed = true;
      continue;
    }
    const errors = validateRecipe(slug, recipe);
    if (errors.length > 0) {
      console.error(`  ✗ ${slug}:`);
      errors.forEach(e => console.error(`      • ${e}`));
      failed = true;
    } else {
      console.log(`  ✓ ${slug}`);
    }
  }

  if (failed) {
    console.error('\nValidation failed. Fix the errors above before building.');
    process.exit(1);
  }
  console.log(`\nValidated ${slugs.length} recipe${slugs.length === 1 ? '' : 's'}.`);
}

main();
