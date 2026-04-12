import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  RECIPE_CUISINES,
  RECIPE_MEAL_LABELS,
  RECIPE_MEAL_TYPES,
  RECIPE_OTHER_CUISINE_KEY,
} from '../../constants/recipeCategories';
import { saveActiveFilter } from '../../utils/recipeCategoryFilterStorage';

const labelStyle =
  'text-[11px] font-bold uppercase italic tracking-[0.14em] text-[#a0a0a0]';

const headingStyle =
  'text-base font-bold uppercase italic tracking-wide text-[#231F20]';

const emptyMeals = () =>
  Object.fromEntries(RECIPE_MEAL_TYPES.map((k) => [k, false]));

const splitFilter = (value) => {
  const selected = new Set();
  let other = '';
  const list = Array.isArray(value?.cuisines) ? value.cuisines : [];
  for (const c of list) {
    if (RECIPE_CUISINES.includes(c)) selected.add(c);
    else if (c) {
      selected.add(RECIPE_OTHER_CUISINE_KEY);
      if (!other) other = String(c);
    }
  }
  const meals = emptyMeals();
  for (const k of RECIPE_MEAL_TYPES) {
    meals[k] = Boolean(value?.meal_types?.includes(k));
  }
  return { selected, other, meals };
};

const buildFilter = (selected, otherCuisine, meals) => {
  const cuisines = [...selected].filter((c) => c !== RECIPE_OTHER_CUISINE_KEY);
  if (selected.has(RECIPE_OTHER_CUISINE_KEY) && otherCuisine.trim()) {
    cuisines.push(otherCuisine.trim());
  }
  const meal_types = RECIPE_MEAL_TYPES.filter((k) => meals[k]);
  return { cuisines, meal_types };
};

/**
 * Controlled filter: cuisine chips + meal types. Persists via saveActiveFilter on each change.
 */
const RecipeCategoryFilterSection = ({ value, onChange, disabled }) => {
  const parts = useMemo(() => splitFilter(value), [value]);

  const commit = (next) => {
    saveActiveFilter(next);
    onChange(next);
  };

  const setCuisineToggle = (c) => {
    const nextSel = new Set(parts.selected);
    if (nextSel.has(c)) {
      nextSel.delete(c);
      if (c === RECIPE_OTHER_CUISINE_KEY) {
        const f = buildFilter(nextSel, '', parts.meals);
        commit(f);
        return;
      }
    } else {
      nextSel.add(c);
    }
    const f = buildFilter(nextSel, parts.other, parts.meals);
    commit(f);
  };

  const setOtherText = (text) => {
    const f = buildFilter(parts.selected, text, parts.meals);
    commit(f);
  };

  const setMeal = (key, checked) => {
    const nextMeals = { ...parts.meals, [key]: checked };
    const f = buildFilter(parts.selected, parts.other, nextMeals);
    commit(f);
  };

  const hasFilter =
    value?.cuisines?.length > 0 || value?.meal_types?.length > 0;

  return (
    <section className="rounded-[28px] border border-black/[0.06] bg-[#F7F7F2]/60 px-5 py-5 md:px-6 md:py-6">
      <h3 className={`${headingStyle} text-sm md:text-base`}>Categories</h3>
      <p className={`mt-2 max-w-2xl ${labelStyle} normal-case not-italic`}>
        Filter <strong className="font-semibold text-brand-dark/80">your saved recipes</strong> below, and refine
        catalog suggestions. Pick cuisines and/or meal times—choices save automatically.
      </p>

      <div className="mt-5">
        <span className={labelStyle}>Cuisine</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {RECIPE_CUISINES.map((c) => {
            const on = parts.selected.has(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCuisineToggle(c)}
                disabled={disabled}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-[10px] font-bold uppercase italic md:px-4 md:py-2 md:text-[11px]',
                  on
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-white text-[#a0a0a0] ring-1 ring-black/10 hover:bg-white/90',
                  disabled && 'opacity-50',
                )}
              >
                {c}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCuisineToggle(RECIPE_OTHER_CUISINE_KEY)}
            disabled={disabled}
            className={clsx(
              'rounded-full border-2 border-dashed px-3 py-1.5 text-[10px] font-bold uppercase italic md:px-4 md:py-2 md:text-[11px]',
              parts.selected.has(RECIPE_OTHER_CUISINE_KEY)
                ? 'border-brand-green bg-brand-green/10 text-brand-dark'
                : 'border-[#b8bcc4] text-[#a0a0a0]',
              disabled && 'opacity-50',
            )}
          >
            Other
          </button>
        </div>
        {parts.selected.has(RECIPE_OTHER_CUISINE_KEY) && (
          <input
            type="text"
            value={parts.other}
            onChange={(e) => setOtherText(e.target.value)}
            disabled={disabled}
            placeholder="Other cuisine"
            className="mt-3 w-full max-w-md rounded-[18px] border border-black/[0.08] bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        )}
      </div>

      <div className="mt-5">
        <span className={labelStyle}>Meal</span>
        <div className="mt-3 flex flex-wrap gap-3">
          {RECIPE_MEAL_TYPES.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-2.5"
            >
              <input
                type="checkbox"
                checked={parts.meals[key]}
                onChange={(e) => setMeal(key, e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 rounded border-black/20 text-brand-green focus:ring-brand-green/40"
              />
              <span className="text-xs font-bold uppercase italic text-brand-dark">
                {RECIPE_MEAL_LABELS[key] ?? key}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasFilter && (
        <p className="mt-4 text-[10px] font-medium uppercase italic tracking-wide text-[#a0a0a0]">
          Active:{' '}
          {value.cuisines?.length ? value.cuisines.join(', ') : 'Any cuisine'}
          {' · '}
          {value.meal_types?.length ? value.meal_types.join(', ') : 'Any meal'}
        </p>
      )}
    </section>
  );
};

export default RecipeCategoryFilterSection;
