import { request } from './apiClient';

const uploadConfigPath = import.meta.env.VITE_RECEIPT_UPLOAD_CONFIG_PATH || '';
const uploadPath =
  import.meta.env.VITE_RECEIPT_UPLOAD_PATH || '/api/fridge/receipt';
const uploadField =
  import.meta.env.VITE_RECEIPT_UPLOAD_FIELD || 'receipt';
const approvalPath =
  import.meta.env.VITE_RECEIPT_APPROVAL_PATH || '/api/fridge/receipt/confirm';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const requestTokenHeaders = (requestToken) => {
  if (!requestToken) return {};
  return { 'X-Request-Token': requestToken };
};

export const fetchReceiptUploadConfig = () => {
  if (!uploadConfigPath) {
    return Promise.resolve(null);
  }
  return request({
    url: uploadConfigPath,
    method: 'GET',
    headers: authHeaders(),
  });
};

export const uploadReceiptPhoto = (file, requestToken) => {
  const formData = new FormData();
  formData.append(uploadField, file);

  return request({
    url: uploadPath,
    method: 'POST',
    body: formData,
    headers: {
      ...authHeaders(),
      ...requestTokenHeaders(requestToken),
    },
  });
};

export const submitReceiptConfirmation = (payload, requestToken) => {
  return request({
    url: approvalPath,
    method: 'POST',
    body: payload,
    headers: {
      ...authHeaders(),
      ...requestTokenHeaders(requestToken),
    },
  });
};
