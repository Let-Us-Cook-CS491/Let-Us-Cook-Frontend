/**
 * Values from API `notifications_inbox.page` → React Router paths.
 * Keep in sync with Let-Us-Cook-Backend `src/constants/notificationPages.js`.
 */
export const NOTIFICATION_PAGE_ROUTES = {
  '/fridge': '/my-fridge',
  '/recipes': '/recipes',
  '/profile': '/profile',
};

/**
 * @param {string | null | undefined} page - e.g. `/fridge`
 * @returns {string | null} - SPA path or null if unknown / empty
 */
export function resolveNotificationTarget(page) {
  if (!page || typeof page !== 'string') return null;
  return NOTIFICATION_PAGE_ROUTES[page] ?? null;
}
