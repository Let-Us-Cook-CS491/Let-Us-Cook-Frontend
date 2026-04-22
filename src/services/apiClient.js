import axios from 'axios';
import { clearAuthSession } from '../utils/authSession';

const baseURL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL,
});

/** Plain client (no interceptors) — avoids refresh recursion. */
const refreshClient = axios.create({
  baseURL,
});

let isRefreshing = false;
/** @type {{ resolve: (t: string) => void; reject: (e: unknown) => void }[]} */
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

function isAuthExemptPath(url) {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh')
  );
}

async function fetchNewAccessToken() {
  const userId = localStorage.getItem('userId');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!userId || !refreshToken) {
    throw new Error('Missing refresh credentials');
  }

  const { data } = await refreshClient.post('/auth/refresh', {
    user_id: Number(userId),
    refreshToken,
  });

  if (data?.status !== 'OK' || !data.accessToken) {
    throw new Error(data?.message || 'Token refresh failed');
  }

  localStorage.setItem('accessToken', data.accessToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const url = originalRequest.url || '';

    if (
      status !== 401 ||
      isAuthExemptPath(url) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (
      !localStorage.getItem('refreshToken') ||
      !localStorage.getItem('userId')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const accessToken = await fetchNewAccessToken();
      processQueue(null, accessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearAuthSession();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

export const request = async ({
  url,
  method = 'GET',
  body,
  params,
  headers,
} = {}) => {
  try {
    const response = await apiClient.request({
      url,
      method,
      data: body,
      params,
      headers,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data ?? error.response;
    }
    throw error;
  }
};
