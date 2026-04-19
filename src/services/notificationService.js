/**
 * Notification inbox API shape — currently backed by mock store only.
 * When the backend team ships endpoints, swap implementations here (same function signatures).
 */

import {
  getMockNotifications,
  getMockUnreadCount,
  mockMarkRead,
  mockDelete,
  mockMarkAllRead,
} from './notificationInboxMockStore';

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

function hasSession() {
  return Boolean(localStorage.getItem('accessToken'));
}

export async function fetchUnreadCount() {
  await delay(80);
  if (!hasSession()) return 0;
  return getMockUnreadCount();
}

export async function fetchInboxNotifications() {
  await delay(120);
  if (!hasSession()) {
    throw new Error('Sign in to view notifications.');
  }
  return getMockNotifications();
}

export async function markNotificationRead(notificationId) {
  await delay(100);
  if (!hasSession()) throw new Error('Not signed in.');
  mockMarkRead(notificationId);
  return { ok: true, read_at: new Date().toISOString() };
}

export async function deleteNotification(notificationId) {
  await delay(100);
  if (!hasSession()) throw new Error('Not signed in.');
  mockDelete(notificationId);
  return { ok: true };
}

export async function markAllNotificationsRead() {
  await delay(120);
  if (!hasSession()) throw new Error('Not signed in.');
  mockMarkAllRead();
  return { ok: true };
}
