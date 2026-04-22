import { request } from './apiClient';

const recommendPath =
  import.meta.env.VITE_AI_RECOMMEND_PATH || '/recipe/ai-recommend';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

/**
 * POST /api/recipe/ai-recommend
 * Body: { mode: 'new'|'extend'|'modify', prompt: string, recipe_id?: string, recipe_title?: string }
 */
export const requestAiRecipeRecommend = (body) =>
  request({
    url: recommendPath,
    method: 'POST',
    body,
    headers: authHeaders(),
  });
