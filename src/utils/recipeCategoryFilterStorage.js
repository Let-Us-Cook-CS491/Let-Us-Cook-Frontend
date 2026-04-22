import { RECIPE_MEAL_TYPES } from '../constants/recipeCategories';

/** Exported for `storage` listeners (e.g. Recipes page sync across tabs). */
export const RECIPE_CATEGORY_ACTIVE_STORAGE_KEY = 'letUsCook_recipeCategoryActive';
const ACTIVE_KEY = RECIPE_CATEGORY_ACTIVE_STORAGE_KEY;

export function loadActiveFilter() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return { cuisines: [], meal_types: [] };
    const p = JSON.parse(raw);
    return {
      cuisines: Array.isArray(p.cuisines) ? p.cuisines.map(String) : [],
      meal_types: Array.isArray(p.meal_types)
        ? p.meal_types.filter((m) => RECIPE_MEAL_TYPES.includes(m))
        : [],
    };
  } catch {
    return { cuisines: [], meal_types: [] };
  }
}

export function saveActiveFilter(filter) {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(filter));
  } catch {
    /* ignore */
  }
}
