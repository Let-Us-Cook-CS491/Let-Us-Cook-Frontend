import { request } from './apiClient';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Paths under VITE_API_URL (must include `/api`) */
const base = '/grocery/lists';

export const createGroceryList = (body) =>
  request({
    url: base,
    method: 'POST',
    body,
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });

export const fetchGroceryLists = (params) =>
  request({
    url: base,
    method: 'GET',
    params,
    headers: authHeaders(),
  });

export const fetchGroceryList = (listId) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}`,
    method: 'GET',
    headers: authHeaders(),
  });

export const addItemsToGroceryList = (listId, items) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/items`,
    method: 'POST',
    body: { items },
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });

/**
 * POST /api/grocery/lists/:listId/missing-ingredients
 * Body: { sourceSurface, recipeId, recipeTitle?, mode, ingredients }
 */
export const postMissingIngredientsToList = (listId, body) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/missing-ingredients`,
    method: 'POST',
    body,
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });

export const patchItemPurchase = (listId, itemId, purchased) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}/purchase`,
    method: 'PATCH',
    body: { purchased },
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });

export const patchItemsPurchaseBatch = (listId, itemIds, purchased) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/items/purchase-batch`,
    method: 'PATCH',
    body: { itemIds, purchased },
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });

export const addGroceryItemToFridge = (listId, itemId, body) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}/add-to-fridge`,
    method: 'POST',
    body,
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });

export const deleteGroceryListItem = (listId, itemId) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/items/${encodeURIComponent(itemId)}`,
    method: 'DELETE',
    headers: authHeaders(),
  });

export const archiveGroceryList = (listId) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}/archive`,
    method: 'PATCH',
    headers: authHeaders(),
  });

export const deleteGroceryList = (listId) =>
  request({
    url: `${base}/${encodeURIComponent(listId)}`,
    method: 'DELETE',
    headers: authHeaders(),
  });
