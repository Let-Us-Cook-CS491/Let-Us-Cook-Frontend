import React, { useState, useCallback, useEffect } from 'react';
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react';
import {
  fetchInboxNotifications,
  markNotificationRead,
  deleteNotification,
  markAllNotificationsRead,
} from '../../services/notificationService';

function formatRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationInbox({ isOpen, onClose, onUnreadInvalidate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchInboxNotifications();
      setItems(list);
    } catch (e) {
      setError(e?.message || 'Could not load notifications.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleMarkRead = async (id) => {
    setBusyId(id);
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n,
        ),
      );
      onUnreadInvalidate?.();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      onUnreadInvalidate?.();
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((n) =>
          n.read ? n : { ...n, read: true, read_at: new Date().toISOString() },
        ),
      );
      onUnreadInvalidate?.();
    } catch (e) {
      setError(e?.message || 'Could not mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isOpen) return null;

  const unreadOnPage = items.filter((n) => !n.read).length;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px]"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-black/10 bg-[#F7F7F2] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-inbox-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="notification-inbox-title"
              className="flex items-center gap-2 text-lg font-semibold text-brand-dark"
            >
              <Bell className="h-5 w-5 shrink-0 text-brand-green" strokeWidth={2} />
              Notifications
            </h2>
            <p className="mt-0.5 text-xs text-brand-dark/55">
              Frontend preview — data is stored locally until the API is connected.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-dark/50 hover:bg-black/5 hover:text-brand-dark"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-black/5 px-5 py-3">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadOnPage === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading && (
            <p className="px-2 py-8 text-center text-sm text-brand-dark/50">Loading…</p>
          )}
          {!loading && error && (
            <p className="px-2 py-6 text-center text-sm text-red-700">{error}</p>
          )}
          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
              <Bell className="h-10 w-10 text-brand-dark/20" strokeWidth={1.5} />
              <p className="text-sm font-medium text-brand-dark/70">You&apos;re all caught up</p>
              <p className="text-xs text-brand-dark/45">No notifications to show.</p>
            </div>
          )}
          {!loading &&
            !error &&
            items.map((n) => (
              <article
                key={n.id}
                className={`mb-2 rounded-xl border px-4 py-3 transition-colors ${
                  n.read
                    ? 'border-black/5 bg-white/80'
                    : 'border-brand-green/25 bg-brand-green/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-green" title="Unread" />
                      )}
                      <h3 className="text-sm font-semibold text-brand-dark">{n.title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-brand-dark/70">{n.body}</p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-brand-dark/40">
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        disabled={busyId === n.id}
                        className="rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-green hover:bg-brand-green/15 disabled:opacity-50"
                      >
                        Read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      disabled={busyId === n.id}
                      className="rounded-lg p-1.5 text-brand-dark/40 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </aside>
    </>
  );
}
