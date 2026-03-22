import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { fetchFridgeItems } from '../services/fridgeService';

const DEFAULT_WINDOW_DAYS = 3;
const MIN_WINDOW_DAYS = 1;
const MAX_WINDOW_DAYS = 30;

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Something went wrong. Please try again.';
};

const normalizeItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getExpirationValue = (item) =>
  item?.expiration_date ??
  item?.expirationDate ??
  item?.expiration ??
  item?.expiresOn ??
  item?.expiry_date ??
  item?.expiryDate;

const daysUntil = (value) => {
  const date = toDate(value);
  if (!date) return null;
  const diffMs = date.getTime() - startOfToday().getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return 'Unknown date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const ExpiryPriority = () => {
  const [expiringWindowDays, setExpiringWindowDays] = useState(
    String(DEFAULT_WINDOW_DAYS)
  );
  const [touched, setTouched] = useState(false);
  const [loadState, setLoadState] = useState({ loading: true, error: '' });
  const [items, setItems] = useState([]);
  const [appliedDays, setAppliedDays] = useState(DEFAULT_WINDOW_DAYS);

  const validationError = useMemo(() => {
    const days = toNumber(expiringWindowDays);
    if (days === null) return 'Enter the number of days to check.';
    if (!Number.isInteger(days)) return 'Use a whole number of days.';
    if (days < MIN_WINDOW_DAYS || days > MAX_WINDOW_DAYS) {
      return `Use ${MIN_WINDOW_DAYS} to ${MAX_WINDOW_DAYS} days.`;
    }
    return '';
  }, [expiringWindowDays]);

  const loadItems = async (days) => {
    setLoadState({ loading: true, error: '' });
    try {
      const data = await fetchFridgeItems({ expiringInDays: days });
      const normalized = normalizeItems(data);
      setItems(normalized);
      setAppliedDays(days);
      setLoadState({ loading: false, error: '' });
    } catch (error) {
      setItems([]);
      setLoadState({ loading: false, error: getErrorMessage(error) });
    }
  };

  useEffect(() => {
    loadItems(DEFAULT_WINDOW_DAYS);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (validationError) return;
    const days = toNumber(expiringWindowDays);
    if (days === null) return;
    loadItems(days);
  };

  const decoratedItems = useMemo(() => {
    return items
      .map((item) => {
        const expirationValue = getExpirationValue(item);
        const daysLeft = daysUntil(expirationValue);

        return {
          raw: item,
          expirationValue,
          daysLeft,
        };
      })
      .sort((a, b) => {
        if (a.daysLeft === null && b.daysLeft === null) return 0;
        if (a.daysLeft === null) return 1;
        if (b.daysLeft === null) return -1;
        return a.daysLeft - b.daysLeft;
      });
  }, [items]);

  const stats = useMemo(() => {
    const todayCount = decoratedItems.filter((item) => item.daysLeft === 0).length;
    const expiredCount = decoratedItems.filter(
      (item) => item.daysLeft !== null && item.daysLeft < 0
    ).length;

    return {
      total: decoratedItems.length,
      todayCount,
      expiredCount,
    };
  }, [decoratedItems]);

  return (
    <div className="h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 h-full flex flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-dark">Expiry Priority</h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Surface the items that need attention soon based on your window.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-brand-dark/50">
              Expiring Window
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-dark">
              {appliedDays} days
            </div>
          </div>
        </div>

        <div className="mt-5 h-[1px] bg-black/5" />

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-[#F7F7F2] px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-brand-dark/50">
                  Items found
                </div>
                <div className="mt-2 text-2xl font-semibold text-brand-dark">
                  {stats.total}
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-amber-700/80">
                  Expiring today
                </div>
                <div className="mt-2 text-2xl font-semibold text-amber-700">
                  {stats.todayCount}
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-red-700/80">
                  Expired
                </div>
                <div className="mt-2 text-2xl font-semibold text-red-700">
                  {stats.expiredCount}
                </div>
              </div>
            </div>

            {loadState.loading ? (
              <div className="rounded-2xl border border-black/5 bg-white px-4 py-6 text-sm text-brand-dark/60">
                Loading expiry priorities...
              </div>
            ) : loadState.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                <div className="text-sm text-red-700">{loadState.error}</div>
                <Button
                  type="button"
                  onClick={() => {
                    const days = toNumber(expiringWindowDays) ?? appliedDays;
                    loadItems(days);
                  }}
                  className="mt-3"
                >
                  Retry
                </Button>
              </div>
            ) : decoratedItems.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white px-4 py-6 text-sm text-brand-dark/60">
                No items found in this window. Try increasing the days.
              </div>
            ) : (
              <div className="space-y-3">
                {decoratedItems.map((item, index) => {
                  const raw = item.raw || {};
                  const name =
                    raw.name ||
                    raw.item_name ||
                    raw.itemName ||
                    'Unnamed item';
                  const category = raw.category || raw.type || 'Uncategorized';
                  const quantity = raw.quantity || raw.qty || raw.amount || '';

                  const daysLeft = item.daysLeft;
                  const priorityLabel =
                    daysLeft === null
                      ? 'No date'
                      : daysLeft < 0
                        ? 'Expired'
                        : daysLeft === 0
                          ? 'Today'
                          : daysLeft <= 2
                            ? 'Urgent'
                            : 'Soon';

                  const badgeClass =
                    daysLeft === null
                      ? 'bg-black/5 text-brand-dark/70'
                      : daysLeft < 0
                        ? 'bg-red-100 text-red-700'
                        : daysLeft <= 2
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700';

                  const daysLabel =
                    daysLeft === null
                      ? 'Date needed'
                      : daysLeft < 0
                        ? `${Math.abs(daysLeft)} day${
                            Math.abs(daysLeft) === 1 ? '' : 's'
                          } overdue`
                        : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

                  return (
                    <div
                      key={`${name}-${item.expirationValue ?? index}`}
                      className="rounded-2xl border border-black/5 bg-white px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-sm font-semibold text-brand-dark">
                            {name}
                          </h3>
                          <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs text-brand-dark/70">
                            {category}
                          </span>
                          <span className="text-xs text-brand-dark/50">
                            Priority {index + 1}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-brand-dark/60">
                          {quantity ? `${quantity} • ` : ''}
                          Expires {formatDate(item.expirationValue)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                        >
                          {priorityLabel}
                        </div>
                        <div className="mt-2 text-xs font-semibold text-brand-dark/70">
                          {daysLabel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-black/5 bg-white px-5 py-5 h-fit">
            <h3 className="text-sm font-semibold text-brand-dark">
              Expiring Soon Window
            </h3>
            <p className="mt-2 text-xs text-brand-dark/60">
              Set how many days ahead to treat items as priority.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Window (days)"
                name="expiringWindowDays"
                type="number"
                min={MIN_WINDOW_DAYS}
                max={MAX_WINDOW_DAYS}
                step="1"
                inputMode="numeric"
                value={expiringWindowDays}
                onChange={(event) => setExpiringWindowDays(event.target.value)}
                onBlur={() => setTouched(true)}
                error={touched && validationError ? validationError : undefined}
                disabled={loadState.loading}
              />
              <Button type="submit" disabled={loadState.loading}>
                {loadState.loading ? 'Loading...' : 'Apply Window'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryPriority;
