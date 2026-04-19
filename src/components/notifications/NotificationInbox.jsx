import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, CheckCheck } from 'lucide-react';
import {
  fetchNotificationsPage,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationService';
import { resolveNotificationTarget } from '../../constants/notificationPages';

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
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { items: rows, nextCursor: cursor } = await fetchNotificationsPage({
        limit: 50,
      });
      setItems(rows);
      setNextCursor(cursor);
    } catch (e) {
      setError(e?.message || 'Could not load notifications.');
      setItems([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadFirstPage();
  }, [isOpen, loadFirstPage]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const { items: more, nextCursor: cursor } = await fetchNotificationsPage({
        limit: 50,
        beforeId: nextCursor,
      });
      setItems((prev) => [...prev, ...more]);
      setNextCursor(cursor);
    } catch (e) {
      setError(e?.message || 'Could not load more.');
    } finally {
      setLoadingMore(false);
    }
  };

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
          n.id === id
            ? { ...n, read: true, read_at: n.read_at || new Date().toISOString() }
            : n,
        ),
      );
      onUnreadInvalidate?.();
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await loadFirstPage();
      onUnreadInvalidate?.();
    } catch (e) {
      setError(e?.message || 'Could not mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const openTarget = (page) => {
    const path = resolveNotificationTarget(page);
    if (path) {
      navigate(path);
      onClose();
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
              Fridge, recipes, profile — tap Open when a link is available.
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
            items.map((n) => {
              const target = n.page ? resolveNotificationTarget(n.page) : null;
              return (
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
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-brand-green"
                            title="Unread"
                          />
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-brand-dark/85">
                        {n.message}
                      </p>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-brand-dark/40">
                        {formatRelative(n.created_at)}
                      </p>
                      {target && (
                        <button
                          type="button"
                          onClick={() => openTarget(n.page)}
                          className="mt-2 text-xs font-semibold text-brand-green underline hover:no-underline"
                        >
                          Open
                        </button>
                      )}
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
                    </div>
                  </div>
                </article>
              );
            })}

          {!loading && !error && nextCursor && (
            <div className="px-2 py-4 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-xs font-semibold uppercase tracking-wide text-brand-green hover:underline disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
