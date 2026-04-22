import { request } from './apiClient';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

/**
 * GET /api/plans/week?weekStart=...&createIfMissing=true
 */
export const getWeekPlan = ({ weekStart, createIfMissing = true }) =>
  request({
    url: '/plans/week',
    method: 'GET',
    params: {
      weekStart:
        typeof weekStart === 'string'
          ? weekStart
          : weekStart?.toISOString?.() ?? String(weekStart),
      createIfMissing,
    },
    headers: authHeaders(),
  });

/**
 * POST /api/plans/week
 * Body: { weekStart, replace?, fillEmptyOnly?, useFridge?, adjustCalories?, mongoSampleSize? }
 */
export const generateWeekPlan = (body) =>
  request({
    url: '/plans/week',
    method: 'POST',
    body,
    headers: authHeaders(),
  });
