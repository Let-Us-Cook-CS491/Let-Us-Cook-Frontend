/**
 * Client-side filter for the user's recipe library.
 * @param {Array<{ id: string, title: string, cuisine?: string, cuisines?: string[], meal_types?: string[], tags?: string[] }>} recipes
 * @param {{ cuisines: string[], meal_types: string[] }} filter
 */
export function filterUserRecipes(recipes, filter) {
  if (!Array.isArray(recipes)) return [];
  const fc = Array.isArray(filter?.cuisines) ? filter.cuisines.map((c) => String(c).toLowerCase()) : [];
  const fm = Array.isArray(filter?.meal_types) ? filter.meal_types.map((m) => String(m).toLowerCase()) : [];

  const noCuisine = fc.length === 0;
  const noMeal = fm.length === 0;
  if (noCuisine && noMeal) return [...recipes];

  return recipes.filter((r) => {
    const rowCuisines = [];
    if (r.cuisine) rowCuisines.push(String(r.cuisine).toLowerCase());
    if (Array.isArray(r.cuisines)) rowCuisines.push(...r.cuisines.map((c) => String(c).toLowerCase()));
    const tags = Array.isArray(r.tags) ? r.tags.map((t) => String(t).toLowerCase()) : [];
    const meals = Array.isArray(r.meal_types)
      ? r.meal_types.map((m) => String(m).toLowerCase())
      : r.meal
        ? [String(r.meal).toLowerCase()]
        : [];

    const cuisineOk =
      noCuisine ||
      fc.some((want) => {
        const w = want.toLowerCase();
        return rowCuisines.some((c) => c === w || c.includes(w) || w.includes(c)) || tags.some((t) => t.includes(w));
      });

    const mealOk = noMeal || fm.some((want) => meals.includes(want));

    return cuisineOk && mealOk;
  });
}
