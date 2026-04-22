import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUnreadCount } from '../services/notificationService';

const POLL_MS = 15000;

/**
 * Unread notification count for the inbox badge (frontend mock until API exists).
 */
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const previousCountRef = useRef(0);
  const firstFetchRef = useRef(true);
  const listenersRef = useRef([]);

  const onCountChange = useCallback((callback) => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter((cb) => cb !== callback);
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const count = await fetchUnreadCount();
      if (firstFetchRef.current) {
        firstFetchRef.current = false;
        previousCountRef.current = count;
        setUnreadCount(count);
        return;
      }
      const prev = previousCountRef.current;
      previousCountRef.current = count;
      setUnreadCount(count);
      if (prev !== count) {
        listenersRef.current.forEach((cb) => {
          try {
            cb(count, prev);
          } catch {
            /* ignore */
          }
        });
      }
    } catch {
      /* keep last count */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    unreadCount,
    refresh,
    setUnreadCount,
    onCountChange,
  };
}
