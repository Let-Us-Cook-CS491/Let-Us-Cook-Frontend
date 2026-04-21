import { request } from './apiClient';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * @param {object} [params] - category, limit, skip, expiringInDays
 */
export const getFridgeItems = (params) =>
  request({
    url: '/fridge/get-item',
    method: 'GET',
    params,
    headers: authHeaders(),
  });

/**
 * @param {object} body - name, expiration_date, category, quantity, unit, location?
 */
export const addFridgeItem = (body) =>
  request({
    url: '/fridge/add-item',
    method: 'POST',
    body,
    headers: authHeaders(),
  });

/**
 * @param {object} body - item_id, count?
 */
export const removeFridgeItem = (body) =>
  request({
    url: '/fridge/remove-item',
    method: 'DELETE',
    body,
    headers: authHeaders(),
  });

/**
 * @param {object} body - item_id + fields to update
 */
export const updateFridgeItem = (body) =>
  request({
    url: '/fridge/update-item',
    method: 'PATCH',
    body,
    headers: authHeaders(),
  });

/**
 * Create a one-time invite code for this fridge (~24h expiry). Owner only.
 * @param {number|string} fridgeId
 */
export const createFridgeInvite = (fridgeId) =>
  request({
    url: `/fridge/${fridgeId}/invite`,
    method: 'POST',
    headers: authHeaders(),
  });

/**
 * Join another user's fridge with an invite code (single use).
 * @param {{ invite_code: string }} body
 */
export const joinFridgeByInvite = (body) =>
  request({
    url: '/fridge/join',
    method: 'POST',
    body,
    headers: authHeaders(),
  });
