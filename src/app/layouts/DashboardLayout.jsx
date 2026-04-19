import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell } from 'lucide-react';
import SidebarNav from '../../components/layout/SidebarNav';
import NotificationInbox from '../../components/notifications/NotificationInbox';
import { useNotifications } from '../../hooks/useNotifications';

const DashboardLayout = () => {
  const [inboxOpen, setInboxOpen] = useState(false);
  const { unreadCount, refresh: refreshUnread } = useNotifications();

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
    </div>
  );
};

export default DashboardLayout;
