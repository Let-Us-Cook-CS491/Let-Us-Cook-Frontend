const STORAGE_KEY = 'letUsCook_userRecipeLibrary';

/** Starter recipes so filters work before the API exists. */
export const DEFAULT_USER_RECIPES = [
  {
    id: 'demo-1',
    title: 'Sheet-pan lemon chicken',
    cuisine: 'American',
    meal_types: ['dinner'],
    tags: ['quick', 'high-protein'],
  },
  {
    id: 'demo-1b',
    title: 'Greek yogurt parfait',
    cuisine: 'American',
    meal_types: ['breakfast', 'snack'],
    tags: ['quick'],
  },
  {
    id: 'demo-2',
    title: 'Caprese salad',
    cuisine: 'Italian',
    meal_types: ['lunch'],
    tags: ['vegetarian', 'no-cook'],
  },
  {
    id: 'demo-3',
    title: 'Chicken tikka masala',
    cuisine: 'Indian',
    meal_types: ['dinner', 'lunch'],
    tags: ['spicy'],
  },
  {
    id: 'demo-4',
    title: 'Miso soup & onigiri',
    cuisine: 'Japanese',
    meal_types: ['lunch'],
    tags: ['light'],
  },
  {
    id: 'demo-5',
    title: 'Tacos al pastor',
    cuisine: 'Mexican',
    meal_types: ['dinner'],
    tags: ['weeknight'],
  },
];

export function loadUserRecipeLibraryFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : null;
  } catch {
    return null;
  }
}

export function saveUserRecipeLibraryToStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function normalizeUserRecipesPayload(payload) {
  const raw = payload?.data ?? payload;
  const list = raw?.recipes ?? raw?.items ?? raw?.data;
  if (!Array.isArray(list)) return [];
  return list.map((r, i) => ({
    id: String(r.id ?? r.recipe_id ?? `r-${i}`),
    title: String(r.title ?? r.name ?? 'Recipe').trim(),
    cuisine: r.cuisine != null ? String(r.cuisine).trim() : '',
    meal_types: Array.isArray(r.meal_types)
      ? r.meal_types.map((m) => String(m).toLowerCase())
      : r.meal_type
        ? [String(r.meal_type).toLowerCase()]
        : [],
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    description: r.description != null ? String(r.description) : '',
  }));
}
