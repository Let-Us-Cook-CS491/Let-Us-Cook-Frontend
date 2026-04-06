import React, { useMemo } from 'react';
import clsx from 'clsx';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Link2,
  Package,
  RefreshCw,
  Refrigerator,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import Button from '../components/ui/Button';

const SOURCES = [
  {
    id: 'fridge',
    name: 'My Fridge',
    description: 'Live ingredient inventory and quantities.',
    status: 'Connected',
    lastSync: '2 min ago',
    items: 124,
    icon: Refrigerator,
  },
  {
    id: 'meal-plan',
    name: 'Meal Plan',
    description: 'Upcoming meals and serving counts.',
    status: 'Connected',
    lastSync: '12 min ago',
    items: 18,
    icon: Calendar,
  },
  {
    id: 'groceries',
    name: 'Groceries',
    description: 'Pending grocery list and substitutions.',
    status: 'Attention',
    lastSync: 'Yesterday',
    items: 42,
    icon: ShoppingCart,
  },
  {
    id: 'recipes',
    name: 'Recipes',
    description: 'Saved recipes that drive meal inventory.',
    status: 'Paused',
    lastSync: '3 days ago',
    items: 64,
    icon: UtensilsCrossed,
  },
];

const SYNC_STAGES = [
  {
    label: 'Collect sources',
    detail: 'Pull the latest items, servings, and quantities.',
    status: 'done',
  },
  {
    label: 'Normalize items',
    detail: 'Match names, units, and expiration windows.',
    status: 'done',
  },
  {
    label: 'Resolve conflicts',
    detail: 'Flag missing meals or double-counted stock.',
    status: 'attention',
  },
  {
    label: 'Push updates',
    detail: 'Update your shared inventory timeline.',
    status: 'queued',
  },
];

const INVENTORY_PREVIEW = [
  {
    name: 'Herb chicken bowls',
    source: 'Meal Plan',
    servings: '2 servings',
    state: 'Planned',
    next: 'Tonight',
  },
  {
    name: 'Miso salmon bowl',
    source: 'Recipes',
    servings: '4 servings',
    state: 'Low',
    next: 'Needs 2 fillets',
  },
  {
    name: 'Greek salad kit',
    source: 'My Fridge',
    servings: '3 portions',
    state: 'In Stock',
    next: 'Use by Friday',
  },
  {
    name: 'Veggie stir fry',
    source: 'Meal Plan',
    servings: '2 servings',
    state: 'Missing',
    next: 'Add broccoli + tofu',
  },
];

const RECENT_ACTIVITY = [
  {
    title: 'Synced Meal Plan to inventory',
    time: '12 min ago',
    detail: '4 meals updated with servings and prep time.',
    icon: Calendar,
  },
  {
    title: 'Imported grocery substitutions',
    time: 'Yesterday',
    detail: '3 items swapped with pantry alternatives.',
    icon: ShoppingCart,
  },
  {
    title: 'Receipt upload confirmed',
    time: '2 days ago',
    detail: '7 fridge items added from receipt scan.',
    icon: Database,
  },
];

const CONFLICTS = [
  {
    item: 'Veggie stir fry',
    issue: 'Missing broccoli and tofu for planned meal.',
  },
  {
    item: 'Miso salmon bowl',
    issue: 'Low stock for salmon fillets.',
  },
];

const STATUS_STYLES = {
  Connected: 'bg-brand-green/10 text-brand-dark border-brand-green/30',
  Attention: 'bg-amber-100 text-amber-700 border-amber-200',
  Paused: 'bg-black/5 text-brand-dark/60 border-black/10',
  Syncing: 'bg-brand-dark/10 text-brand-dark border-brand-dark/20',
};

const STATE_STYLES = {
  'In Stock': 'bg-brand-green/10 text-brand-dark border-brand-green/30',
  Planned: 'bg-brand-dark/10 text-brand-dark border-brand-dark/20',
  Low: 'bg-amber-100 text-amber-800 border-amber-200',
  Missing: 'bg-red-100 text-red-700 border-red-200',
};

const InventorySync = () => {
  const totals = useMemo(() => {
    const totalItems = SOURCES.reduce((sum, source) => sum + source.items, 0);
    const connected = SOURCES.filter((source) => source.status === 'Connected')
      .length;
    return {
      totalItems,
      connected,
      conflicts: CONFLICTS.length,
      meals: 12,
    };
  }, []);

  return (
    <div className="h-full">
      <div className="rounded-2xl border border-black/5 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-khaki">
              Inventory Sync
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase italic text-brand-dark">
              Keep every meal in sync
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-dark/60">
              Align your meal plan, fridge, and grocery list into one clean
              inventory so every meal has the right ingredients at the right
              time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.25em]">
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Sync
            </Button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-brand-dark hover:bg-black/5"
            >
              <Link2 className="h-4 w-4 text-brand-brown" />
              Manage Sources
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-black/5 bg-[#F7F7F2] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-dark/45">
              Total items
            </p>
            <p className="mt-2 text-3xl font-black text-brand-dark">
              {totals.totalItems}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-dark/45">
              Meals covered
            </p>
            <p className="mt-2 text-3xl font-black text-brand-dark">
              {totals.meals}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-dark/45">
              Connected sources
            </p>
            <p className="mt-2 text-3xl font-black text-brand-dark">
              {totals.connected}/{SOURCES.length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-700/70">
              Conflicts
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {totals.conflicts}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">
                  Inventory sources
                </h2>
                <p className="text-sm text-brand-dark/60">
                  Monitor every system that contributes to your meal inventory.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-dark/50">
                <Clock className="h-4 w-4 text-brand-brown" />
                Last full sync: Today, 10:32 AM
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {SOURCES.map((source) => {
                const Icon = source.icon;
                return (
                  <div
                    key={source.id}
                    className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-[#F7F7F2] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-green shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">
                          {source.name}
                        </p>
                        <p className="text-xs text-brand-dark/60">
                          {source.description}
                        </p>
                        <div className="mt-2 text-xs text-brand-dark/50">
                          {source.items} items synced
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                          STATUS_STYLES[source.status]
                        )}
                      >
                        {source.status}
                      </span>
                      <div className="mt-2 text-xs text-brand-dark/50">
                        Last sync {source.lastSync}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">
                  Inventory preview
                </h2>
                <p className="text-sm text-brand-dark/60">
                  The next meals and ingredients after the latest sync.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-dark"
              >
                <Package className="h-4 w-4 text-brand-brown" />
                View All
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-black/5">
              <div className="grid grid-cols-[1.5fr_0.9fr_0.9fr_1fr] gap-2 bg-[#F7F7F2] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-dark/50">
                <span>Meal or item</span>
                <span>Source</span>
                <span>Servings</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-black/5 bg-white">
                {INVENTORY_PREVIEW.map((item) => (
                  <div
                    key={item.name}
                    className="grid grid-cols-[1.5fr_0.9fr_0.9fr_1fr] gap-2 px-4 py-3 text-sm text-brand-dark"
                  >
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-brand-dark/50">{item.next}</div>
                    </div>
                    <div className="text-xs text-brand-dark/60">{item.source}</div>
                    <div className="text-xs text-brand-dark/60">{item.servings}</div>
                    <div>
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                          STATE_STYLES[item.state]
                        )}
                      >
                        {item.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-brand-dark p-6 text-brand-beige shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-khaki">
                  Sync pipeline
                </p>
                <h3 className="mt-2 text-xl font-black uppercase italic text-brand-beige">
                  Inventory flow
                </h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green/20 text-brand-beige">
                <Database className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {SYNC_STAGES.map((stage) => (
                <div
                  key={stage.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-khaki">
                      {stage.label}
                    </span>
                    {stage.status === 'done' && (
                      <CheckCircle2 className="h-4 w-4 text-brand-green" />
                    )}
                    {stage.status === 'attention' && (
                      <AlertTriangle className="h-4 w-4 text-amber-300" />
                    )}
                    {stage.status === 'queued' && (
                      <Clock className="h-4 w-4 text-brand-khaki" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-brand-beige/70">
                    {stage.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-brand-dark">
                Sync preferences
              </h3>
              <p className="mt-1 text-xs text-brand-dark/60">
                Control how inventory updates are scheduled.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: 'Auto-sync each morning',
                  value: 'Daily at 7:00 AM',
                  enabled: true,
                },
                {
                  label: 'Push alerts for missing meals',
                  value: 'Notify instantly',
                  enabled: true,
                },
                {
                  label: 'Pause recipe imports',
                  value: 'Manual only',
                  enabled: false,
                },
              ].map((setting) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#F7F7F2] px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-brand-dark">
                      {setting.label}
                    </p>
                    <p className="text-[11px] text-brand-dark/50">
                      {setting.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={setting.enabled}
                    className={clsx(
                      'flex h-6 w-11 items-center rounded-full px-1 transition-all',
                      setting.enabled ? 'bg-brand-green' : 'bg-brand-beige'
                    )}
                  >
                    <span
                      className={clsx(
                        'h-4 w-4 rounded-full bg-white shadow transition-all',
                        setting.enabled ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-dark">
                Recent activity
              </h3>
              <Sparkles className="h-4 w-4 text-brand-brown" />
            </div>
            <div className="mt-4 space-y-3">
              {RECENT_ACTIVITY.map((entry) => {
                const Icon = entry.icon;
                return (
                  <div
                    key={entry.title}
                    className="rounded-2xl border border-black/5 bg-[#F7F7F2] px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-brand-brown">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-dark">
                          {entry.title}
                        </p>
                        <p className="text-[11px] text-brand-dark/50">
                          {entry.detail}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-brand-dark/40">
                          {entry.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Conflicts to review</h3>
            </div>
            <div className="mt-4 space-y-3 text-xs text-amber-800/80">
              {CONFLICTS.map((conflict) => (
                <div key={conflict.item} className="rounded-xl bg-white/70 px-3 py-2">
                  <p className="font-semibold">{conflict.item}</p>
                  <p className="mt-1 text-[11px]">{conflict.issue}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-amber-700 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-amber-800"
            >
              Resolve Conflicts
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default InventorySync;
