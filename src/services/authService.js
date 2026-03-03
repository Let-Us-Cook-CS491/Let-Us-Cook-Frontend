import { request } from './apiClient';

export const login = (credentials) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    body: credentials,
  });
};

export const register = (data) => {
  return request({
    url: '/auth/signup',
    method: 'POST',
    body: data,
  });
};

export const refreshToken = ({ user_id, refreshToken }) => {
  return request({
    url: '/auth/refresh',
    method: 'POST',
    body: { user_id, refreshToken },
  });
};

export const logout = ({ user_id }) => {
  return request({
    url: '/auth/logout',
    method: 'POST',
    body: { user_id },
  });
};

