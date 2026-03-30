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
    url: '/api/fridge/get-item',
    method: 'GET',
    params,
    headers: authHeaders(),
  });

/**
 * @param {object} body - name, expiration_date, category, quantity, unit, location?
 */
export const addFridgeItem = (body) =>
  request({
    url: '/api/fridge/add-item',
    method: 'POST',
    body,
    headers: authHeaders(),
  });

/**
 * @param {object} body - item_id, count?
 */
export const removeFridgeItem = (body) =>
  request({
    url: '/api/fridge/remove-item',
    method: 'DELETE',
    body,
    headers: authHeaders(),
  });

/**
 * @param {object} body - item_id + fields to update
 */
export const updateFridgeItem = (body) =>
  request({
    url: '/api/fridge/update-item',
    method: 'PATCH',
    body,
    headers: authHeaders(),
  });
