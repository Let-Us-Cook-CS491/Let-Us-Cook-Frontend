import { request } from './apiClient';

const setHealthGoalsPath =
  import.meta.env.VITE_SET_HEALTH_GOALS_PATH || '/user/set-health-goals';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

export const fetchHealthGoals = () => {
  // Add GET + VITE_HEALTH_GOALS_GET_PATH when backend exposes it.
  return Promise.resolve(null);
};

/**
 * POST /api/user/set-health-goals
 * Body: { goal, activity_level, calorie_target? }
 */
export const setHealthGoals = (payload) => {
  return request({
    url: setHealthGoalsPath,
    method: 'POST',
    body: payload,
    headers: authHeaders(),
  });
};

/** @deprecated use setHealthGoals */
export const updateHealthGoals = setHealthGoals;
