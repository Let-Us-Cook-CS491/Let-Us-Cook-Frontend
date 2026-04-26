import { request } from './apiClient';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

export const createCheckoutSession = (plan_code) =>
  request({
    url: '/billing/checkout-session',
    method: 'POST',
    body: { plan_code },
    headers: authHeaders(),
  });

export const getCurrentSubscription = () =>
  request({
    url: '/billing/subscription',
    method: 'GET',
    headers: authHeaders(),
  });
