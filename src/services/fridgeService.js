import { request } from './apiClient';

const uploadConfigPath =
  import.meta.env.VITE_FRIDGE_UPLOAD_CONFIG_PATH || '/fridge/upload/config';
const uploadPath =
  import.meta.env.VITE_FRIDGE_UPLOAD_PATH || '/fridge/upload';
const uploadField =
  import.meta.env.VITE_FRIDGE_UPLOAD_FIELD || 'image';

export const fetchFridgeUploadConfig = () => {
  return request({
    url: uploadConfigPath,
    method: 'GET',
  });
};

export const uploadFridgePhoto = (file) => {
  const formData = new FormData();
  formData.append(uploadField, file);

  return request({
    url: uploadPath,
    method: 'POST',
    body: formData,
  });
};
