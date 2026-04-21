import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChefHat } from 'lucide-react';

function isBrowseShape(r) {
  return r && r._id != null && r.title != null;
}

function titleOf(r) {
  if (!r) return 'Recipe';
  if (isBrowseShape(r)) return r.title || 'Recipe';
  return r.strMeal || r.title || 'Recipe';
}

function imageOf(r) {
  if (!r) return '';
  if (isBrowseShape(r)) return r.image_url || '';
  return r.strMealThumb || r.image_url || '';
}

function normIng(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** @param {string} name @param {string[]} matched @param {string[]} missing */
function ingredientFridgeStatus(name, matched, missing) {
  const n = normIng(name);
  if (matched.some((m) => normIng(m) === n)) return 'matched';
  if (missing.some((m) => normIng(m) === n)) return 'missing';
  return 'neutral';
}

/** MealDB nested totals or flat Mongo nutrition (browse catalog). */
function nutritionTotalsFrom(nutrition) {
  if (!nutrition || typeof nutrition !== 'object') return null;
  const t = nutrition.totals;
  if (
    t &&
    typeof t === 'object' &&
    (t.calories_kcal != null ||
      t.protein_g != null ||
      t.carbohydrates_g != null ||
      t.fat_g != null)
  ) {
    return t;
  }
  if (
    nutrition.calories_kcal != null ||
    nutrition.calories != null ||
    nutrition.protein_g != null ||
    nutrition.protein != null ||
    nutrition.carbohydrates_g != null ||
    nutrition.carbs != null ||
    nutrition.fat_g != null ||
    nutrition.fat != null
  ) {
    return {
      calories_kcal: nutrition.calories_kcal ?? nutrition.calories,
      protein_g: nutrition.protein_g ?? nutrition.protein,
      carbohydrates_g: nutrition.carbohydrates_g ?? nutrition.carbs ?? nutrition.carbohydrates,
      fat_g: nutrition.fat_g ?? nutrition.fat,
    };
  }
  return null;
}

function labelFromIng(raw) {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && raw.name != null) return String(raw.name);
  return String(raw ?? '');
}

/**
 * @param {{ recipe: object | null, onClose: () => void }} props
 */
const RecipeDetailModal = ({ recipe, onClose }) => {
  useEffect(() => {
    if (!recipe) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [recipe, onClose]);

  if (!recipe) return null;

  const browse = isBrowseShape(recipe);

  const instructions = recipe.strInstructions || recipe.instructions || '';

  const recipeIngs = Array.isArray(recipe.recipeIngredients) ? recipe.recipeIngredients : [];
  const matched = Array.isArray(recipe.matchedIngredients) ? recipe.matchedIngredients : [];
  const missing = Array.isArray(recipe.missingIngredients) ? recipe.missingIngredients : [];
  const browseIngs = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  /** Browse API returns recipeIngredients + matched/missing; older docs may only have ingredients[]. */
  const displayIngredients = recipeIngs.length > 0 ? recipeIngs : browseIngs;

  const nutrition = recipe.nutrition && typeof recipe.nutrition === 'object' ? recipe.nutrition : null;
  const totals = nutritionTotalsFrom(nutrition);

  const pers = recipe.personalization && typeof recipe.personalization === 'object' ? recipe.personalization : null;

  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-[101] flex max-h-[min(92vh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-black/10 bg-[#F7F7F2] shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/8 bg-white/90 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark/45">
              Recipe details
            </p>
            <h2
              id="recipe-detail-title"
              className="mt-1 text-lg font-black uppercase italic leading-tight tracking-tight text-brand-dark sm:text-xl"
            >
              {titleOf(recipe)}
            </h2>
            {(recipe.strCategory || recipe.strArea) && (
              <p className="mt-1 text-xs text-brand-dark/55">
                {[recipe.strCategory, recipe.strArea].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-brand-dark hover:bg-black/5"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-black/8 bg-black/5">
            {imageOf(recipe) ? (
              <img src={imageOf(recipe)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[140px] items-center justify-center text-brand-dark/25">
                <ChefHat className="h-16 w-16" strokeWidth={1} />
              </div>
            )}
          </div>

          {pers && (
            <section className="mt-5 rounded-2xl border border-brand-green/25 bg-brand-green/[0.08] px-4 py-3 text-sm text-brand-dark">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-green">Personalization</p>
              {pers.reason && <p className="mt-2 text-sm leading-relaxed text-brand-dark/90">{pers.reason}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                {pers.strategy && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-brand-dark/70">{pers.strategy}</span>
                )}
                {pers.effort && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 capitalize text-brand-dark/70">
                    {pers.effort}
                  </span>
                )}
                {pers.score != null && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-brand-dark/70">Score {pers.score}</span>
                )}
                {pers.cookMinutes != null && (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-brand-dark/70">
                    ~{pers.cookMinutes} min
                  </span>
                )}
              </div>
            </section>
          )}

          {(matched.length > 0 || missing.length > 0) && (
            <section className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                Fridge match
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {matched.length > 0 && (
                  <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-green">
                    {matched.length} matched
                  </span>
                )}
                {missing.length > 0 && (
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-900">
                    {missing.length} missing
                  </span>
                )}
              </div>
            </section>
          )}

          {displayIngredients.length > 0 && (
            <section className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                Ingredients
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {displayIngredients.map((raw, i) => {
                  const label = labelFromIng(raw);
                  const st = ingredientFridgeStatus(label, matched, missing);
                  const chipClass =
                    st === 'matched'
                      ? 'rounded-full border border-brand-green/25 bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green'
                      : st === 'missing'
                        ? 'rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-medium text-red-900'
                        : 'rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-brand-dark/75';
                  return (
                    <span key={i} className={chipClass}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          {tags.length > 0 && (
            <section className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-brand-dark/75"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {totals && (
            <section className="mt-5 rounded-2xl border border-black/8 bg-white/60 px-4 py-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                Nutrition (estimate)
              </h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {totals.calories_kcal != null && (
                  <>
                    <dt className="text-brand-dark/50">Calories</dt>
                    <dd className="font-semibold text-brand-dark">{Math.round(totals.calories_kcal)} kcal</dd>
                  </>
                )}
                {totals.protein_g != null && (
                  <>
                    <dt className="text-brand-dark/50">Protein</dt>
                    <dd className="font-semibold text-brand-dark">{Number(totals.protein_g).toFixed(1)} g</dd>
                  </>
                )}
                {totals.carbohydrates_g != null && (
                  <>
                    <dt className="text-brand-dark/50">Carbs</dt>
                    <dd className="font-semibold text-brand-dark">{Number(totals.carbohydrates_g).toFixed(1)} g</dd>
                  </>
                )}
                {totals.fat_g != null && (
                  <>
                    <dt className="text-brand-dark/50">Fat</dt>
                    <dd className="font-semibold text-brand-dark">{Number(totals.fat_g).toFixed(1)} g</dd>
                  </>
                )}
              </dl>
              {nutrition?.disclaimer && (
                <p className="mt-2 text-[10px] leading-snug text-brand-dark/50">{nutrition.disclaimer}</p>
              )}
            </section>
          )}

          <section className="mt-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">Instructions</h3>
            {instructions && String(instructions).trim() ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-dark/85">
                {String(instructions).trim()}
              </p>
            ) : (
              <p className="mt-2 text-sm text-brand-dark/55">
                No instructions were returned for this recipe.
              </p>
            )}
          </section>

          {(recipe.recipe_source || recipe.createdAt) && browse && (
            <p className="mt-4 text-[10px] text-brand-dark/45">
              {recipe.recipe_source && <span>Source: {recipe.recipe_source}</span>}
              {recipe.createdAt && (
                <span className={recipe.recipe_source ? ' ml-2' : ''}>
                  Added {new Date(recipe.createdAt).toLocaleDateString()}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default RecipeDetailModal;
