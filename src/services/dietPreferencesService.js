import { request } from './apiClient';

const setPreferencesPath =
  import.meta.env.VITE_SET_PREFERENCES_PATH || '/user/set-preferences';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

export const setDietPreferences = (payload) => {
  return request({
    url: setPreferencesPath,
    method: 'POST',
    body: payload,
    headers: authHeaders(),
  });
};

