import React, { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, UserPlus } from 'lucide-react';
import SidebarNav from '../../components/layout/SidebarNav';
import NotificationInbox from '../../components/notifications/NotificationInbox';
import FridgeHouseholdModal from '../../components/fridge/FridgeHouseholdModal';
import { useNotifications } from '../../hooks/useNotifications';
import { getFridgeItems } from '../../services/fridgeService';

const DashboardLayout = () => {
  const [inboxOpen, setInboxOpen] = useState(false);
  const [householdOpen, setHouseholdOpen] = useState(false);
  const [fridgeId, setFridgeId] = useState(() => {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem('fridgeId') : null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const { unreadCount, refresh: refreshUnread } = useNotifications();

  const openHouseholdModal = useCallback(async () => {
    try {
      const res = await getFridgeItems({ limit: 1 });
      if (res?.status === 'OK' && res.fridge_id != null) {
        const fid = Number(res.fridge_id);
        if (Number.isFinite(fid)) {
          localStorage.setItem('fridgeId', String(fid));
          setFridgeId(fid);
        }
      }
    } catch {
      // still open modal; user may have fridge id in localStorage
    }
    setHouseholdOpen(true);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7F7F2] text-brand-dark">
      <SidebarNav />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="border-b border-black/5 bg-[#F7F7F2] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, chef!
              </h1>
              <p className="mt-1 text-sm text-brand-dark/60">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
                  : 'You have 0 items that need your attention soon.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openHouseholdModal}
                className="inline-flex items-center gap-2 rounded-xl border border-brand-green/35 bg-brand-green/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark shadow-sm transition-colors hover:bg-brand-green/15 sm:px-4 sm:text-sm"
              >
                <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
                <span className="hidden sm:inline">Add / join fridge</span>
                <span className="sm:hidden">Fridge</span>
              </button>
              <button
                type="button"
                onClick={() => setInboxOpen(true)}
                className="relative shrink-0 rounded-xl border border-black/10 bg-white p-2.5 text-brand-dark shadow-sm transition-colors hover:bg-black/[0.03] hover:border-brand-green/30"
                aria-label="Open notifications"
              >
                <Bell className="h-5 w-5 text-brand-green" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-green px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-auto px-6 pb-8 pt-6 sm:px-8">
          <Outlet />
        </section>
      </main>

      <NotificationInbox
        isOpen={inboxOpen}
        onClose={() => setInboxOpen(false)}
        onUnreadInvalidate={refreshUnread}
      />

      <FridgeHouseholdModal
        open={householdOpen}
        onClose={() => setHouseholdOpen(false)}
        fridgeId={fridgeId}
        onJoined={() => {
          const raw =
            typeof localStorage !== 'undefined' ? localStorage.getItem('fridgeId') : null;
          const n = Number(raw);
          if (Number.isFinite(n) && n > 0) setFridgeId(n);
          window.dispatchEvent(new CustomEvent('fridge-household-joined'));
        }}
      />
    </div>
  );
};

export default DashboardLayout;
