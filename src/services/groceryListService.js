import { request } from './apiClient';

const listBase =
  import.meta.env.VITE_GROCERY_LIST_PATH || '/grocery-list';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

/** True when the server has no grocery route (HTML 404) or similar. */
export const isGroceryApiUnavailableError = (thrown) => {
  const s =
    typeof thrown === 'string'
      ? thrown
      : thrown != null && typeof thrown.message === 'string'
        ? thrown.message
        : '';
  const sample = s.slice(0, 800).toLowerCase();
  return (
    sample.includes('<!doctype') ||
    sample.includes('<html') ||
    sample.includes('cannot get') ||
    sample.includes('cannot post') ||
    sample.includes('cannot delete') ||
    sample.includes('cannot patch')
  );
};

/**
 * GET /api/grocery-list
 * Expected: { data: { items: [...] } } or { items: [...] }
 */
export const fetchGroceryList = () =>
  request({
    url: listBase,
    method: 'GET',
    headers: authHeaders(),
  });

/**
 * POST /api/grocery-list/items
 * Body: { name, quantity?: number, unit?: string }
 */
export const addGroceryItem = (body) =>
  request({
    url: `${listBase}/items`,
    method: 'POST',
    body,
    headers: authHeaders(),
  });

/**
 * DELETE /api/grocery-list/items/:id
 */
export const removeGroceryItem = (id) =>
  request({
    url: `${listBase}/items/${encodeURIComponent(id)}`,
    method: 'DELETE',
    headers: authHeaders(),
  });

/**
 * PATCH /api/grocery-list/items/:id
 * Body: { purchased?: boolean, quantity?: number, unit?: string }
 */
export const patchGroceryItem = (id, body) =>
  request({
    url: `${listBase}/items/${encodeURIComponent(id)}`,
    method: 'PATCH',
    body,
    headers: authHeaders(),
  });
