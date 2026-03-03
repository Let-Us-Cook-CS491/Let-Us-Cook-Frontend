import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const request = async ({ url, method = 'GET', body, params, headers } = {}) => {
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


