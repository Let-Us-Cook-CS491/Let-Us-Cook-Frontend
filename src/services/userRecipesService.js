import { request } from './apiClient';
import {
  DEFAULT_USER_RECIPES,
  loadUserRecipeLibraryFromStorage,
  normalizeUserRecipesPayload,
} from '../utils/userRecipeLibrary';

const listPath = import.meta.env.VITE_USER_RECIPES_PATH || '/recipes/my';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

const isHtmlUnavailable = (thrown) => {
  const s =
    typeof thrown === 'string'
      ? thrown
      : thrown != null && typeof thrown.message === 'string'
        ? thrown.message
        : '';
  const sample = s.slice(0, 800).toLowerCase();
  return sample.includes('<!doctype') || sample.includes('<html') || sample.includes('cannot get');
};

/**
 * GET /api/recipes/my — saved recipes for the signed-in user.
 * Falls back to localStorage, then bundled demos, when the route is missing.
 */
export async function fetchUserRecipeLibrary() {
  const fromStorage = loadUserRecipeLibraryFromStorage();
  try {
    const res = await request({
      url: listPath,
      method: 'GET',
      headers: authHeaders(),
    });
    const list = normalizeUserRecipesPayload(res);
    return { recipes: list, source: 'api' };
  } catch (e) {
    if (!isHtmlUnavailable(e)) throw e;
  }
  if (fromStorage && fromStorage.length > 0) {
    return { recipes: fromStorage, source: 'local' };
  }
  return { recipes: DEFAULT_USER_RECIPES, source: 'demo' };
}
