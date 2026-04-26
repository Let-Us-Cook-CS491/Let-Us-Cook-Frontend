import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, UserPlus } from 'lucide-react';
import SidebarNav from '../../components/layout/SidebarNav';
import NotificationInbox from '../../components/notifications/NotificationInbox';
import FridgeHouseholdModal from '../../components/fridge/FridgeHouseholdModal';
import { useNotifications } from '../../hooks/useNotifications';
import { getFridgeItems } from '../../services/fridgeService';
import { createCheckoutSession, getCurrentSubscription } from '../../services/billingService';

const TIER_RANK = {
  free: 0,
  premium_monthly: 1,
  ultra_monthly: 2,
};

const normalizePlanCode = (planCode) => {
  const code = String(planCode || 'free').toLowerCase();
  if (code === 'premium') return 'premium_monthly';
  if (code === 'ultra') return 'ultra_monthly';
  if (code === 'premium_monthly' || code === 'ultra_monthly') return code;
  return 'free';
};

const DashboardLayout = () => {
  const [inboxOpen, setInboxOpen] = useState(false);
  const [householdOpen, setHouseholdOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState('');
  const [fridgeId, setFridgeId] = useState(() => {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem('fridgeId') : null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const { unreadCount, refresh: refreshUnread } = useNotifications();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!localStorage.getItem('accessToken')) return;
      try {
        const res = await getCurrentSubscription();
        if (!cancelled && res?.status === 'OK') setSubscription(res.data || null);
      } catch {
        // keep header usable even if subscription endpoint fails
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentTierRank = Number(subscription?.tier_rank);
  const isMaxTier = Number.isFinite(currentTierRank) && currentTierRank >= 2;
  const tierLabel = useMemo(() => {
    const code = normalizePlanCode(subscription?.plan_code);
    if (code === 'ultra_monthly') return 'Ultra';
    if (code === 'premium_monthly') return 'Premium';
    return 'Free';
  }, [subscription?.plan_code]);
  const tierBadgeTone = useMemo(() => {
    if (tierLabel === 'Ultra') return 'border-[#d4b06a] bg-[#f8e7b8] text-[#5c4515]';
    if (tierLabel === 'Premium') return 'border-green-300 bg-green-100 text-green-800';
    return 'border-slate-300 bg-slate-100 text-slate-700';
  }, [tierLabel]);

  const currentPlanCode = useMemo(() => {
    return normalizePlanCode(subscription?.plan_code);
  }, [subscription?.plan_code]);

  const TIERS = useMemo(
    () => [
      {
        code: 'free',
        name: 'Free',
        price: '$0/mo',
        features: ['Core meal planning', 'Basic fridge tracking', 'Standard grocery list'],
        tone: 'border-slate-300 bg-slate-100',
      },
      {
        code: 'premium_monthly',
        name: 'Premium',
        price: '$9.99/mo',
        features: ['Advanced planning insights', 'Priority recommendations', 'Higher personalization'],
        tone: 'border-green-300 bg-green-50',
      },
      {
        code: 'ultra_monthly',
        name: 'Ultra',
        price: '$19.99/mo',
        features: ['Everything in Premium', 'Top-tier AI meal suggestions', 'Best subscription tier support'],
        tone: 'border-[#d4b06a] bg-[#f7e8be]',
      },
    ],
    [],
  );

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

  const startUpgrade = useCallback(async (planCode) => {
    if (planCode === 'free') return;
    setCheckoutPlan(planCode);
    try {
      const res = await createCheckoutSession(planCode);
      if (res?.status !== 'OK' || !res?.data?.checkout_url) {
        throw new Error(res?.message || 'Could not start checkout.');
      }
      window.location.href = res.data.checkout_url;
    } catch {
      setCheckoutPlan('');
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F7F7F2] text-brand-dark">
      <SidebarNav />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="border-b border-black/5 bg-[#F7F7F2] px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back, chef!
                </h1>
                <span
                  className={[
                    'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                    tierBadgeTone,
                  ].join(' ')}
                >
                  Tier: {tierLabel}
                </span>
              </div>
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
              {!isMaxTier && (
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="inline-flex items-center rounded-xl border border-[#d4b06a] bg-[#f4d58a] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#4f3b11] shadow-sm transition-colors hover:bg-[#ebcb78] sm:px-4 sm:text-sm"
                >
                  Upgrade
                </button>
              )}
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

      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-brand-dark">Choose your plan</h3>
                <p className="mt-1 text-sm text-brand-dark/60">
                  Current plan: {currentPlanCode.replace('_monthly', '')}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm text-brand-dark hover:bg-black/5"
                onClick={() => setUpgradeOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {TIERS.map((tier) => {
                const isCurrent = tier.code === currentPlanCode;
                const currentRank = TIER_RANK[currentPlanCode] ?? 0;
                const tierRank = TIER_RANK[tier.code] ?? 0;
                const isLowerTier = tierRank < currentRank;
                const isDisabled = isCurrent || isLowerTier || checkoutPlan === tier.code;
                const buttonTone = isLowerTier
                  ? '!bg-slate-300 !text-slate-600 !border-slate-300 hover:!bg-slate-300'
                  : '';
                return (
                  <article
                    key={tier.code}
                    className={['rounded-2xl border px-4 py-4', tier.tone].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-brand-dark">{tier.name}</h4>
                      {isCurrent && (
                        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-lg font-bold text-brand-dark">{tier.price}</p>
                    <ul className="mt-3 space-y-1 text-xs text-brand-dark/80">
                      {tier.features.map((feature) => (
                        <li key={feature}>- {feature}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={isDisabled}
                      className={[
                        'mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-brand-brown px-4 py-2 text-sm font-medium text-brand-beige hover:bg-[#7b5e4f] disabled:cursor-not-allowed disabled:opacity-60',
                        buttonTone,
                      ].join(' ')}
                      onClick={() => startUpgrade(tier.code)}
                    >
                      {isCurrent
                        ? 'Current plan'
                        : isLowerTier
                          ? 'Lower tier unavailable'
                        : checkoutPlan === tier.code
                          ? 'Redirecting...'
                          : 'Upgrade plan'}
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
