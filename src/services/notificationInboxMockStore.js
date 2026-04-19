/**
 * Frontend-only mock store for the notification inbox.
 * Persisted in localStorage so mark-read / delete survive refresh.
 * Replace with real API calls in notificationService when backend is ready.
 */

const STORAGE_KEY = 'let_us_cook_notification_inbox_v1';

const seedNotifications = () => [
  {
    id: 'n1',
    title: 'Eggs expiring soon',
    body: 'You have items in Produce expiring within 3 days. Check My Fridge → Expiry priority.',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    category: 'fridge',
  },
  {
    id: 'n2',
    title: 'Welcome to Let Us Cook',
    body: 'Scan a receipt to add ingredients quickly, or add items manually from My Fridge.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    category: 'system',
  },
  {
    id: 'n3',
    title: 'Try recipe ideas',
    body: 'Open Recipes to get suggestions based on what you already have.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    read: false,
    category: 'recipes',
  },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { notifications: seedNotifications() };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.notifications)) {
      return { notifications: seedNotifications() };
    }
    return parsed;
  } catch {
    return { notifications: seedNotifications() };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

let state = typeof window !== 'undefined' ? loadState() : { notifications: seedNotifications() };

export function getMockNotifications() {
  return [...state.notifications].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

export function getMockUnreadCount() {
  return state.notifications.filter((n) => !n.read).length;
}

export function mockMarkRead(id) {
  state = {
    ...state,
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n,
    ),
  };
  saveState(state);
}

export function mockDelete(id) {
  state = {
    ...state,
    notifications: state.notifications.filter((n) => n.id !== id),
  };
  saveState(state);
}

export function mockMarkAllRead() {
  const now = new Date().toISOString();
  state = {
    ...state,
    notifications: state.notifications.map((n) =>
      n.read ? n : { ...n, read: true, read_at: now },
    ),
  };
  saveState(state);
}

/** For tests / reset during dev */
export function resetMockNotifications() {
  state = { notifications: seedNotifications() };
  saveState(state);
}
