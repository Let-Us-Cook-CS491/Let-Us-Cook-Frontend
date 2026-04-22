import { request } from './apiClient';

const authHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function assertOk(res, fallbackMessage) {
  if (res?.status === 'OK') return res;
  throw new Error(res?.message || fallbackMessage || 'Request failed');
}

/**
 * Map API row → UI row
 * @param {object} row
 */
function mapNotificationRow(row) {
  const id = row.notification_id;
  return {
    id: String(id),
    notification_id: id,
    page: row.page ?? null,
    message: row.message ?? '',
    created_at: row.created_at,
    read_at: row.read_at ?? null,
    read: row.read_at != null,
  };
}

/**
 * Count all unread notifications (paginates with `beforeId` when needed).
 */
export async function fetchUnreadCount() {
  if (!localStorage.getItem('accessToken')) return 0;

  let beforeId;
  let total = 0;

  for (;;) {
    const params = { limit: 100, unreadOnly: true };
    if (beforeId != null) params.beforeId = beforeId;

    const res = await request({
      url: '/user/notifications',
      params,
      headers: authHeaders(),
    });

    assertOk(res, 'Failed to load notifications');
    const { notifications = [], nextCursor } = res.data || {};
    total += notifications.length;

    if (!nextCursor || notifications.length === 0) break;
    beforeId = nextCursor;
  }

  return total;
}

/**
 * One page of notifications (newest first).
 * @param {{ beforeId?: string | number, limit?: number, unreadOnly?: boolean }} opts
 * @returns {{ items: object[], nextCursor: string | null }}
 */
export async function fetchNotificationsPage(opts = {}) {
  if (!localStorage.getItem('accessToken')) {
    throw new Error('Sign in to view notifications.');
  }

  const { beforeId, limit = 50, unreadOnly = false } = opts;
  const params = { limit, unreadOnly };
  if (beforeId != null && beforeId !== '') {
    params.beforeId = beforeId;
  }

  const res = await request({
    url: '/user/notifications',
    params,
    headers: authHeaders(),
  });

  assertOk(res, 'Failed to load notifications');
  const { notifications = [], nextCursor = null } = res.data || {};

  return {
    items: notifications.map(mapNotificationRow),
    nextCursor,
  };
}

/** @deprecated Use fetchNotificationsPage — kept for older callers */
export async function fetchInboxNotifications() {
  const { items } = await fetchNotificationsPage({ limit: 50 });
  return items;
}

/**
 * @param {string | number} notificationId - numeric id from API
 */
export async function markNotificationRead(notificationId) {
  if (!localStorage.getItem('accessToken')) {
    throw new Error('Not signed in.');
  }

  const id = Number(notificationId);
  if (!Number.isInteger(id) || id < 1) {
    throw new Error('Invalid notification id');
  }

  try {
    const res = await request({
      url: `/user/notifications/${id}/read`,
      method: 'POST',
      headers: authHeaders(),
    });
    assertOk(res, 'Failed to mark notification read');
    return { ok: true };
  } catch (err) {
    const msg = String(err?.message ?? err ?? '');
    const lower = msg.toLowerCase();
    if (lower.includes('not found') || lower.includes('already read')) {
      return { ok: true, alreadyRead: true };
    }
    throw err instanceof Error ? err : new Error(msg || 'Failed to mark read');
  }
}

export async function markAllNotificationsRead() {
  if (!localStorage.getItem('accessToken')) {
    throw new Error('Not signed in.');
  }

  const res = await request({
    url: '/user/notifications/read-all',
    method: 'POST',
    headers: authHeaders(),
  });

  assertOk(res, 'Failed to mark all notifications read');
  return { ok: true, updatedCount: res.data?.updatedCount ?? 0 };
}
