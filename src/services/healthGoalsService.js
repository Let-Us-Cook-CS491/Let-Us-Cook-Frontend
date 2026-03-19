import { request } from './apiClient';

// Backend dev currently exposes user preferences at:
// POST /api/user/set-preferences
// (see Let-Us-Cook-Backend/src/routes/user.js)
const updatePath =
  import.meta.env.VITE_HEALTH_GOALS_UPDATE_PATH || '/user/set-preferences';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

export const fetchHealthGoals = () => {
  // No GET endpoint exists yet in the backend for preferences/goals.
  // Keep API surface stable; UI will start empty until backend adds GET.
  return Promise.resolve(null);
};

export const updateHealthGoals = (payload) => {
  return request({
    url: updatePath,
    method: 'POST',
    body: payload,
    headers: authHeaders(),
  });
};

