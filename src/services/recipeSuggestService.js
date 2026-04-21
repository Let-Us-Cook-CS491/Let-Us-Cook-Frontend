import { request } from './apiClient';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
};

/**
 * GET /api/recipes/suggest
 * Uses fridge inventory + user preference allow_substitutions (server-side).
 * Query: limit (default 10, max 20), maxIngredients (default 8, max 12)
 */
export const suggestRecipesFromFridge = (params = {}) =>
  request({
    url: '/recipes/suggest',
    method: 'GET',
    params,
    headers: authHeaders(),
  });

/** @deprecated Use suggestRecipesFromFridge — kept for older imports */
export const suggestRecipes = (payload) =>
  request({
    url: '/recipes/suggest',
    method: 'GET',
    params:
      typeof payload === 'object' && payload !== null
        ? {
            limit: payload.limit,
            maxIngredients: payload.maxIngredients,
          }
        : {},
    headers: authHeaders(),
  });

/**
 * GET /api/recipes/browse
 * Paginated catalog from Mongo (diet/restrictions applied server-side).
 * Query: limit (default 20, max 50), skip, sortBy (title|createdAt), searchText (title substring, case-insensitive), diet, excludeIngredients
 */
export const browseRecipes = (params = {}) =>
  request({
    url: '/recipes/browse',
    method: 'GET',
    params,
    headers: authHeaders(),
  });

/**
 * GET /api/recipes/personalized
 * AI-ranked picks from fridge + preferences + health goals (Gemini with deterministic fallback).
 * Query: limit (default 5, max 15), maxMissingIngredients (default 4, max 10), includeReasons (default true)
 */
export const getPersonalizedRecommendations = (params = {}) =>
  request({
    url: '/recipes/personalized',
    method: 'GET',
    params,
    headers: authHeaders(),
  });
