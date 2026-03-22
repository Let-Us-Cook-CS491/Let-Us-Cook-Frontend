import { request } from './apiClient';

const itemsPath =
  import.meta.env.VITE_FRIDGE_ITEMS_PATH || '/fridge/get-item';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

export const fetchFridgeItems = ({
  expiringInDays,
  category,
  limit,
  skip,
} = {}) => {
  const params = {};

  if (expiringInDays !== undefined && expiringInDays !== null && expiringInDays !== '') {
    params.expiringInDays = expiringInDays;
  }
  if (category) params.category = category;
  if (limit !== undefined && limit !== null && limit !== '') params.limit = limit;
  if (skip !== undefined && skip !== null && skip !== '') params.skip = skip;

  return request({
    url: itemsPath,
    method: 'GET',
    params,
    headers: authHeaders(),
  });
};
