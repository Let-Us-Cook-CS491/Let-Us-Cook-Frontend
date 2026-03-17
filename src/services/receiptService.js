import { request } from './apiClient';

const uploadConfigPath =
  import.meta.env.VITE_RECEIPT_UPLOAD_CONFIG_PATH || '/receipt/upload/config';
const uploadPath =
  import.meta.env.VITE_RECEIPT_UPLOAD_PATH || '/receipt/upload';
const uploadField =
  import.meta.env.VITE_RECEIPT_UPLOAD_FIELD || 'image';
const approvalPath =
  import.meta.env.VITE_RECEIPT_APPROVAL_PATH || '/receipt/approve';

export const fetchReceiptUploadConfig = () => {
  return request({
    url: uploadConfigPath,
    method: 'GET',
  });
};

export const uploadReceiptPhoto = (file) => {
  const formData = new FormData();
  formData.append(uploadField, file);

  return request({
    url: uploadPath,
    method: 'POST',
    body: formData,
  });
};

export const submitReceiptApproval = (payload) => {
  return request({
    url: approvalPath,
    method: 'POST',
    body: payload,
  });
};
