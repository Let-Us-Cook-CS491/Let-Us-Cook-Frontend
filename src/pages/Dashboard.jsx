import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getFridgeDashboard } from '../services/fridgeService';

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl border border-black/5 bg-white px-6 py-4 shadow-sm">
    <div className="text-xs uppercase tracking-[0.12em] text-brand-dark/60">
      {label}
    </div>
    <div className="mt-2 text-2xl font-semibold text-brand-dark">{value}</div>
  </div>
);

function formatExpiryShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(d);
}

function apiErrorMessage(err) {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return 'Something went wrong.';
}

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await getFridgeDashboard();
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Failed to load dashboard');
      }
      setData(res.data ?? null);
    } catch (e) {
      setError(apiErrorMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = data?.items_in_stock ?? '—';
  const expiring = data?.expiring_soon ?? '—';
  const planned = data?.planned_meals ?? '—';
  const waste = data?.waste_prevented ?? '—';
  const cooked = data?.meals_cooked ?? '—';
  const expiringItems = Array.isArray(data?.expiring_items)
    ? data.expiring_items
    : [];

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Items in stock" value={items} />
            <StatCard label="Expiring soon" value={expiring} />
            <StatCard label="Planned meals" value={planned} />
            <StatCard label="Waste prevented" value={waste} />
            <StatCard label="Meals cooked" value={cooked} />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">
                Expiring soon
              </h2>
              <p className="text-xs text-brand-dark/60">
                Use these items to prevent food waste.
              </p>
            </div>
            <Link
              to="/my-fridge"
              className="text-xs font-medium text-brand-dark/70 hover:text-brand-dark"
            >
              View all →
            </Link>
          </div>
          {!loading && expiringItems.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-10 text-xs text-brand-dark/50">
              No items expiring soon. Good job!
            </div>
          )}
          {!loading && expiringItems.length > 0 && (
            <ul className="mt-2 max-h-[320px] space-y-2 overflow-auto pr-1 text-sm">
              {expiringItems.map((row) => (
                <li
                  key={row._id || `${row.name}-${row.expiration_date}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-[#F7F7F2] px-3 py-2"
                >
                  <span className="min-w-0 truncate font-medium capitalize text-brand-dark">
                    {row.name || 'Item'}
                  </span>
                  <span className="shrink-0 text-xs text-brand-dark/50">
                    {formatExpiryShort(row.expiration_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl bg-brand-dark px-6 py-5 text-brand-beige">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">
            Quick tip
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            &quot;Store potatoes in a cool, dark place away from onions to
            prevent them from sprouting too early.&quot;
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">
            Next in plan
          </h2>
          <p className="mt-3 text-sm text-brand-dark/60">
            Open your meal plan to see what&apos;s scheduled this week.
          </p>
          <Link
            to="/meal-plan"
            className="mt-3 inline-block text-sm font-semibold text-brand-green underline hover:no-underline"
          >
            Go to meal plan
          </Link>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
