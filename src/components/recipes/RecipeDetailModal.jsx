import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { X, ChefHat, Loader2, Plus } from 'lucide-react';
import { postMissingIngredientsToList } from '../../services/groceryListService';
import { getWeekPlan, postWeekSlotFromRecipe } from '../../services/mealPlanService';

/** Same key as `Groceries.jsx` */
const GROCERY_SELECTED_LIST_KEY = 'grocery_selected_list_id';

function isBrowseShape(r) {
  return r && r._id != null && r.title != null;
}

function isGeneratedAiRecipe(r) {
  return r && r.source === 'generated';
}

function titleOf(r) {
  if (!r) return 'Recipe';
  if (isBrowseShape(r)) return r.title || 'Recipe';
  if (isGeneratedAiRecipe(r)) return r.title || 'Recipe';
  return r.strMeal || r.title || 'Recipe';
}

function imageOf(r) {
  if (!r) return '';
  if (isGeneratedAiRecipe(r)) return '';
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

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Monday-start week (matches `MealPlan.jsx`). */
const startOfWeek = (date) => {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
};

function formatLocalYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function weekDateOptions(weekStartDate) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStartDate, i);
    return {
      ymd: formatLocalYMD(d),
      label: d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    };
  });
}

function readSelectedGroceryListId() {
  try {
    return sessionStorage.getItem(GROCERY_SELECTED_LIST_KEY) || '';
  } catch {
    return '';
  }
}

function recipeIdForMissing(recipe, browse) {
  if (browse) return String(recipe._id ?? '').trim();
  return String(recipe.idMeal ?? recipe.id ?? recipe.recipeId ?? '').trim();
}

function buildRecipePayloadForPlan(recipe, browse) {
  if (browse) {
    return {
      source: 'mongo',
      recipe_id: String(recipe._id),
      title: recipe.title || 'Recipe',
      image_url: recipe.image_url || recipe.strMealThumb || '',
      prep_minutes: Number(recipe.prep_minutes ?? recipe.prepMinutes ?? 30) || 30,
      nutrition: recipe.nutrition,
    };
  }
  const idMeal = String(recipe.idMeal ?? recipe.id ?? '').trim();
  const payload = {
    source: 'mealdb',
    idMeal,
    strMeal: recipe.strMeal || recipe.title || 'Recipe',
    strMealThumb: recipe.strMealThumb || recipe.image_url || '',
    nutrition: recipe.nutrition,
  };
  const est =
    recipe.personalization?.cookMinutes ??
    recipe.prep_minutes ??
    recipe.prepMinutes;
  if (est != null && Number.isFinite(Number(est))) {
    payload.cookMinutesEstimate = Number(est);
  }
  return payload;
}

function apiErr(e) {
  if (!e) return 'Something went wrong.';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  return 'Something went wrong.';
}

/**
 * @param {{
 *   recipe: object | null,
 *   onClose: () => void,
 *   sourceSurface?: 'suggest' | 'browse',
 * }} props
 */
const RecipeDetailModal = ({
  recipe,
  onClose,
  sourceSurface = 'suggest',
}) => {
  const [groceryMsg, setGroceryMsg] = useState('');
  const [groceryErr, setGroceryErr] = useState('');
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [singleIngLoading, setSingleIngLoading] = useState(null);
  const [planMsg, setPlanMsg] = useState('');
  const [planErr, setPlanErr] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [mealSlot, setMealSlot] = useState('dinner');
  const [mealDateYmd, setMealDateYmd] = useState('');

  useEffect(() => {
    if (!recipe) return;
    setGroceryMsg('');
    setGroceryErr('');
    setPlanMsg('');
    setPlanErr('');
    setSingleIngLoading(null);
    const anchor = startOfWeek(new Date());
    const opts = weekDateOptions(anchor);
    const today = formatLocalYMD(new Date());
    setMealDateYmd(opts.some((o) => o.ymd === today) ? today : opts[0].ymd);
    setMealSlot('dinner');
  }, [recipe]);

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

  const weekAnchor = useMemo(() => startOfWeek(new Date()), [recipe]);
  const weekOptions = useMemo(() => weekDateOptions(weekAnchor), [weekAnchor]);
  const mealWeekStartYmd = useMemo(() => formatLocalYMD(weekAnchor), [weekAnchor]);

  if (!recipe) return null;

  const browse = isBrowseShape(recipe);
  const generated = isGeneratedAiRecipe(recipe);

  const isAuthed =
    typeof localStorage !== 'undefined' &&
    Boolean(localStorage.getItem('accessToken'));

  const instructions = recipe.strInstructions || recipe.instructions || '';

  const recipeIngs = Array.isArray(recipe.recipeIngredients) ? recipe.recipeIngredients : [];
  const matched = Array.isArray(recipe.matchedIngredients) ? recipe.matchedIngredients : [];
  const missing = Array.isArray(recipe.missingIngredients) ? recipe.missingIngredients : [];
  const browseIngs = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const displayIngredients = recipeIngs.length > 0 ? recipeIngs : browseIngs;

  const genSteps = generated && Array.isArray(recipe.steps) ? recipe.steps : [];
  const usedFromFridge = generated && Array.isArray(recipe.usedFromFridge) ? recipe.usedFromFridge : [];
  const optionalPantry =
    generated && Array.isArray(recipe.optionalPantry) ? recipe.optionalPantry : [];
  const responseFilters =
    recipe.responseFilters && typeof recipe.responseFilters === 'object' ? recipe.responseFilters : null;

  const nutrition = recipe.nutrition && typeof recipe.nutrition === 'object' ? recipe.nutrition : null;
  const totals = nutritionTotalsFrom(nutrition);

  const pers = recipe.personalization && typeof recipe.personalization === 'object' ? recipe.personalization : null;

  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];

  const surface = sourceSurface === 'browse' ? 'browse' : 'suggest';
  const rid = recipeIdForMissing(recipe, browse);
  const recipeTitle = titleOf(recipe);
  const missingLabels = missing.map((m) => labelFromIng(m)).filter(Boolean);
  const listId = readSelectedGroceryListId();
  const planRecipeBody = buildRecipePayloadForPlan(recipe, browse);
  const canPostPlan =
    browse && recipe._id
      ? true
      : Boolean(planRecipeBody.idMeal && String(planRecipeBody.idMeal).trim());

  const postMissingBody = (mode, ingredients) => ({
    sourceSurface: surface,
    recipeId: rid,
    recipeTitle,
    mode,
    ingredients,
  });

  const handleAddAllMissing = async () => {
    if (!listId) {
      setGroceryErr('Select a grocery list on the Groceries page first.');
      return;
    }
    if (!rid || missingLabels.length === 0) return;
    setGroceryLoading(true);
    setGroceryErr('');
    setGroceryMsg('');
    try {
      const res = await postMissingIngredientsToList(
        listId,
        postMissingBody('all', missingLabels),
      );
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Failed to add ingredients');
      }
      const msg = res.message || 'Added to grocery list.';
      setGroceryMsg(msg);
      toast.success('Added to grocery list', { description: msg });
    } catch (e) {
      setGroceryErr(apiErr(e));
      toast.error(apiErr(e));
    } finally {
      setGroceryLoading(false);
    }
  };

  const handleAddSingleMissing = async (ingredientName) => {
    if (!listId) {
      setGroceryErr('Select a grocery list on the Groceries page first.');
      return;
    }
    if (!rid || !ingredientName) return;
    setSingleIngLoading(ingredientName);
    setGroceryErr('');
    setGroceryMsg('');
    try {
      const res = await postMissingIngredientsToList(
        listId,
        postMissingBody('single', [ingredientName]),
      );
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Failed to add ingredient');
      }
      const msg = res.message || `${ingredientName} added to grocery list.`;
      setGroceryMsg(msg);
      toast.success('Added to grocery list', {
        description: `${ingredientName} · ${msg}`,
      });
    } catch (e) {
      setGroceryErr(apiErr(e));
      toast.error(apiErr(e));
    } finally {
      setSingleIngLoading(null);
    }
  };

  const handleAddToMealPlan = async () => {
    if (!canPostPlan) {
      setPlanErr('This recipe cannot be added to the meal plan (missing id).');
      return;
    }
    setPlanLoading(true);
    setPlanErr('');
    setPlanMsg('');
    try {
      const ensure = await getWeekPlan({
        weekStart: mealWeekStartYmd,
        createIfMissing: true,
      });
      if (ensure?.status !== 'OK') {
        throw new Error(ensure?.message || 'Could not load meal plan for this week');
      }
      const res = await postWeekSlotFromRecipe({
        weekStart: mealWeekStartYmd,
        date: mealDateYmd,
        slot: mealSlot,
        recipe: planRecipeBody,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Failed to add recipe to plan');
      }
      setPlanMsg(res.message || 'Recipe added to your meal plan.');
    } catch (e) {
      setPlanErr(apiErr(e));
    } finally {
      setPlanLoading(false);
    }
  };

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
              {generated ? 'AI-generated recipe' : 'Recipe details'}
            </p>
            <h2
              id="recipe-detail-title"
              className="mt-1 text-lg font-black uppercase italic leading-tight tracking-tight text-brand-dark sm:text-xl"
            >
              {titleOf(recipe)}
            </h2>
            {generated && (recipe.prepMinutes != null || recipe.servings != null) && (
              <p className="mt-1 text-xs text-brand-dark/55">
                {recipe.prepMinutes != null && <span>~{recipe.prepMinutes} min prep</span>}
                {recipe.prepMinutes != null && recipe.servings != null && <span> · </span>}
                {recipe.servings != null && <span>{recipe.servings} servings</span>}
              </p>
            )}
            {generated && responseFilters && (
              <p className="mt-1 text-xs text-brand-dark/50">
                {[
                  responseFilters.cuisine,
                  responseFilters.mealType,
                  responseFilters.servings != null && `${responseFilters.servings} people`,
                  responseFilters.maxMinutes != null && `≤${responseFilters.maxMinutes} min`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {!generated && (recipe.strCategory || recipe.strArea) && (
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

          {generated && recipe.description && (
            <section className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                Description
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-dark/85">{recipe.description}</p>
            </section>
          )}

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

          {generated && usedFromFridge.length > 0 && (
            <section className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                From your fridge
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {usedFromFridge.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-brand-green/25 bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {generated && optionalPantry.length > 0 && (
            <section className="mt-5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                Optional pantry
              </h3>
              <ul className="mt-2 space-y-1.5 text-sm text-brand-dark/85">
                {optionalPantry.map((item, i) => (
                  <li key={i}>
                    <span className="font-medium">{item?.name || '—'}</span>
                    {item?.purpose ? (
                      <span className="text-brand-dark/60"> — {item.purpose}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!generated && (matched.length > 0 || missing.length > 0) && (
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
              {!generated && missingLabels.length > 0 && isAuthed && (
                <p className="mt-1 text-[11px] leading-snug text-brand-dark/55">
                  Tap <span className="font-semibold text-red-900">+</span> on a missing item to add it to your
                  grocery list, or use <span className="font-medium text-brand-dark/70">Add all missing</span>{' '}
                  below.
                </p>
              )}
              {generated ? (
                <ul className="mt-2 space-y-1.5 text-sm text-brand-dark/90">
                  {browseIngs.map((ing, i) => (
                    <li key={i}>
                      <span className="font-medium">{ing?.name || '—'}</span>
                      {ing?.amount != null && String(ing.amount).trim() ? (
                        <span className="text-brand-dark/60"> — {ing.amount}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {displayIngredients.map((raw, i) => {
                    const label = labelFromIng(raw);
                    const st = ingredientFridgeStatus(label, matched, missing);
                    const chipClass =
                      st === 'matched'
                        ? 'rounded-full border border-brand-green/25 bg-brand-green/15 px-2.5 py-1 text-xs font-medium text-brand-green'
                        : st === 'missing'
                          ? 'rounded-full border border-red-200 bg-red-100 px-2 py-1 text-xs font-medium text-red-900'
                          : 'rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-brand-dark/75';
                    if (st === 'missing' && isAuthed) {
                      const busy = singleIngLoading === label;
                      const disabled =
                        busy || !listId || !rid || groceryLoading;
                      return (
                        <button
                          key={`${label}-${i}`}
                          type="button"
                          disabled={disabled}
                          title={
                            !listId
                              ? 'Select a grocery list on the Groceries page first'
                              : `Add ${label} to grocery list`
                          }
                          aria-label={`Add ${label} to grocery list`}
                          onClick={() => handleAddSingleMissing(label)}
                          className={`${chipClass} inline-flex items-center gap-1 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45`}
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                          ) : (
                            <Plus className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden />
                          )}
                          <span>{label}</span>
                        </button>
                      );
                    }
                    return (
                      <span key={`${label}-${i}`} className={chipClass}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
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

          {!generated && (
            <section className="mt-5 rounded-2xl border border-brand-green/25 bg-white/90 px-4 py-4 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">
                Groceries &amp; meal plan
              </h3>
              {!isAuthed && (
                <p className="mt-2 text-sm text-brand-dark/70">
                  <Link to="/signin" className="font-semibold text-brand-green underline">
                    Sign in
                  </Link>{' '}
                  to add missing ingredients or assign this recipe to your week.
                </p>
              )}
              {isAuthed && (
                <div className="mt-3 space-y-4">
                  {missingLabels.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-brand-dark">Grocery list</p>
                      {!listId ? (
                        <p className="mt-1 text-xs text-brand-dark/65">
                          Open{' '}
                          <Link to="/groceries" className="font-semibold text-brand-green underline">
                            Groceries
                          </Link>{' '}
                          and select a list, then use <span className="font-medium">+</span> on red ingredients
                          above or add everything here.
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={groceryLoading || !listId || !rid}
                          onClick={handleAddAllMissing}
                          className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {groceryLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Add all missing to list
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-black/10 pt-3">
                    <p className="text-xs font-semibold text-brand-dark">Add to this week&apos;s meal plan</p>
                    <p className="mt-0.5 text-[10px] text-brand-dark/50">
                      Week starts {mealWeekStartYmd} (same calendar week as Meal Planner).
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <label className="flex min-w-[140px] flex-1 flex-col text-[10px] font-bold uppercase tracking-wide text-brand-dark/50">
                        Day
                        <select
                          className="mt-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-sm text-brand-dark"
                          value={mealDateYmd}
                          onChange={(e) => setMealDateYmd(e.target.value)}
                        >
                          {weekOptions.map((o) => (
                            <option key={o.ymd} value={o.ymd}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex min-w-[120px] flex-1 flex-col text-[10px] font-bold uppercase tracking-wide text-brand-dark/50">
                        Slot
                        <select
                          className="mt-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-sm text-brand-dark"
                          value={mealSlot}
                          onChange={(e) => setMealSlot(e.target.value)}
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                        </select>
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={planLoading || !canPostPlan}
                      onClick={handleAddToMealPlan}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl border border-brand-green/40 bg-brand-green/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark hover:bg-brand-green/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {planLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Add to meal plan
                    </button>
                    {!canPostPlan && (
                      <p className="mt-1 text-xs text-red-700">
                        {browse ? 'Missing recipe id for catalog recipe.' : 'Missing MealDB id for this recipe.'}
                      </p>
                    )}
                  </div>

                  {groceryErr && (
                    <p className="text-xs text-red-700">{groceryErr}</p>
                  )}
                  {groceryMsg && (
                    <p className="text-xs text-brand-green">{groceryMsg}</p>
                  )}
                  {planErr && <p className="text-xs text-red-700">{planErr}</p>}
                  {planMsg && <p className="text-xs text-brand-green">{planMsg}</p>}
                </div>
              )}
            </section>
          )}

          <section className="mt-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/45">Instructions</h3>
            {genSteps.length > 0 ? (
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-brand-dark/85">
                {genSteps.map((step, i) => (
                  <li key={i}>{String(step)}</li>
                ))}
              </ol>
            ) : instructions && String(instructions).trim() ? (
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
