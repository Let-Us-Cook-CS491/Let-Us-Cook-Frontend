import { request } from './apiClient';

const suggestPath =
  import.meta.env.VITE_RECIPE_SUGGEST_PATH || '/recipe/suggest';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

/**
 * POST /api/recipe/suggest (path relative to VITE_API_URL)
 * Body: { ingredients: string, maxResults?: number, cuisines?: string[], meal_types?: ('breakfast'|'lunch'|'dinner'|'snack')[] }
 */
export const suggestRecipes = (payload) =>
  request({
    url: suggestPath,
    method: 'POST',
    body: payload,
    headers: authHeaders(),
  });
