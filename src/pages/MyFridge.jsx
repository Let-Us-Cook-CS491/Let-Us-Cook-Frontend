import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  Camera,
  Plus,
  Search,
  ListFilter,
  Refrigerator,
  Sparkles,
  Loader2,
} from 'lucide-react';
import IngredientCard, {
  daysUntil,
  EXPIRING_SOON_DAYS,
} from '../components/fridge/IngredientCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import IngredientFormModal from '../components/fridge/IngredientFormModal';
import ConfirmDeleteDialog from '../components/fridge/ConfirmDeleteDialog';
import {
  addFridgeItem,
  getFridgeItems,
  removeFridgeItem,
  updateFridgeItem,
} from '../services/fridgeService';
import { mapFridgeDocToUi, FRIDGE_CATEGORIES } from '../utils/fridgeItem';

const GRID_COLS = 4;
const GRID_ROWS = 4;
const SLOT_COUNT = GRID_COLS * GRID_ROWS;

const DEFAULT_EXPIRY_WINDOW = 3;
const MIN_EXPIRY_WINDOW = 1;
const MAX_EXPIRY_WINDOW = 30;

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

async function fetchFridgeList() {
  const res = await getFridgeItems({ limit: 200 });
  if (res?.status !== 'OK' || !Array.isArray(res?.data)) {
    const msg = res?.message || 'Failed to load fridge';
    const err = new Error(msg);
    throw err;
  }
  return res.data.map(mapFridgeDocToUi).filter(Boolean);
}

async function fetchExpiryList(days) {
  const res = await getFridgeItems({ expiringInDays: days });
  if (res?.status !== 'OK' || !Array.isArray(res?.data)) {
    const msg = res?.message || 'Failed to load expiring items';
    throw new Error(msg);
  }
  return res.data.map(mapFridgeDocToUi).filter(Boolean);
}

const MyFridge = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fridgeView = searchParams.get('view') === 'expiry' ? 'expiry' : 'all';

  const setFridgeView = (view) => {
    if (view === 'expiry') {
      setSearchParams({ view: 'expiry' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const [receiptSavedDismissed, setReceiptSavedDismissed] = useState(false);
  const showReceiptSaved =
    Boolean(location.state?.receiptItemsSaved) && !receiptSavedDismissed;

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [expiryItems, setExpiryItems] = useState([]);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expiryError, setExpiryError] = useState('');
  const [expiringWindowDays, setExpiringWindowDays] = useState(
    String(DEFAULT_EXPIRY_WINDOW),
  );
  const [appliedExpiryDays, setAppliedExpiryDays] = useState(
    DEFAULT_EXPIRY_WINDOW,
  );
  const [windowTouched, setWindowTouched] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [editingItem, setEditingItem] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const windowValidationError = useMemo(() => {
    const days = toNumber(expiringWindowDays);
    if (days === null) return 'Enter the number of days to check.';
    if (!Number.isInteger(days)) return 'Use a whole number of days.';
    if (days < MIN_EXPIRY_WINDOW || days > MAX_EXPIRY_WINDOW) {
      return `Use ${MIN_EXPIRY_WINDOW} to ${MAX_EXPIRY_WINDOW} days.`;
    }
    return '';
  }, [expiringWindowDays]);

  const refetch = useCallback(async () => {
    const list = await fetchFridgeList();
    setIngredients(list);
    if (fridgeView === 'expiry') {
      try {
        const exp = await fetchExpiryList(appliedExpiryDays);
        setExpiryItems(exp);
        setExpiryError('');
      } catch (e) {
        setExpiryItems([]);
        setExpiryError(e?.message || 'Could not refresh expiring items.');
      }
    }
  }, [fridgeView, appliedExpiryDays]);

  useEffect(() => {
    if (fridgeView !== 'expiry') return;
    if (!localStorage.getItem('accessToken')) return;

    let cancelled = false;

    const run = async () => {
      setExpiryLoading(true);
      setExpiryError('');
      try {
        const list = await fetchExpiryList(appliedExpiryDays);
        if (!cancelled) setExpiryItems(list);
      } catch (e) {
        if (!cancelled) {
          setExpiryError(e?.message || 'Could not load expiring items.');
          setExpiryItems([]);
        }
      } finally {
        if (!cancelled) setExpiryLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [fridgeView, appliedExpiryDays]);

  useEffect(() => {
    if (fridgeView !== 'expiry') return;
    setExpiringWindowDays(String(appliedExpiryDays));
    setWindowTouched(false);
  }, [fridgeView]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!localStorage.getItem('accessToken')) {
        setLoadError('Sign in to view and manage your fridge.');
        setIngredients([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');
      try {
        const list = await fetchFridgeList();
        if (!cancelled) setIngredients(list);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e?.message || 'Could not load fridge.');
          setIngredients([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSorted = useMemo(() => {
    let list = [...ingredients];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.location && i.location.toLowerCase().includes(q)),
      );
    }
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter);
    }
    list.sort((a, b) => daysUntil(a.expiresOn) - daysUntil(b.expiresOn));
    return list;
  }, [ingredients, search, categoryFilter]);

  const filteredExpiry = useMemo(() => {
    let list = [...expiryItems];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.location && i.location.toLowerCase().includes(q)),
      );
    }
    if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter);
    }
    list.sort((a, b) => daysUntil(a.expiresOn) - daysUntil(b.expiresOn));
    return list;
  }, [expiryItems, search, categoryFilter]);

  const visibleIngredients = filteredSorted.slice(0, SLOT_COUNT);
  const hiddenCount = Math.max(filteredSorted.length - SLOT_COUNT, 0);

  const openAdd = useCallback(() => {
    if (!localStorage.getItem('accessToken')) return;
    setFormMode('add');
    setEditingItem(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item) => {
    if (!localStorage.getItem('accessToken')) return;
    setFormMode('edit');
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (payload) => {
      const nameLower = payload.name.trim().toLowerCase();
      if (formMode === 'edit' && editingItem) {
        await updateFridgeItem({
          item_id: editingItem.id,
          name: nameLower,
          category: payload.category,
          expiration_date: payload.expiresOn,
          quantity: payload.quantity,
          unit: payload.unit,
          location: payload.location,
        });
      } else {
        await addFridgeItem({
          name: nameLower,
          expiration_date: payload.expiresOn,
          category: payload.category,
          quantity: payload.quantity,
          unit: payload.unit,
          ...(payload.location ? { location: payload.location } : {}),
        });
      }
      await refetch();
    },
    [formMode, editingItem, refetch],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const count = deleteTarget.quantityNum;
    await removeFridgeItem({
      item_id: deleteTarget.id,
      count: count > 0 ? count : 1,
    });
    await refetch();
  }, [deleteTarget, refetch]);

  const handleApplyExpiryWindow = (event) => {
    event.preventDefault();
    setWindowTouched(true);
    if (windowValidationError) return;
    const days = toNumber(expiringWindowDays);
    if (days === null) return;
    setAppliedExpiryDays(days);
  };

  const slots = useMemo(() => {
    const cells = [];
    for (let i = 0; i < SLOT_COUNT; i += 1) {
      cells.push(visibleIngredients[i] ?? null);
    }
    return cells;
  }, [visibleIngredients]);

  const totalInFridge = ingredients.length;
  const expiringSoonCount = ingredients.filter((i) => {
    const d = daysUntil(i.expiresOn);
    return d >= 0 && d <= EXPIRING_SOON_DAYS;
  }).length;

  const isAuthed = Boolean(localStorage.getItem('accessToken'));

  return (
    <div className="h-full min-h-0">
      {showReceiptSaved && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-sm text-brand-dark">
          <p className="font-medium">
            Receipt items saved — your fridge list is updated below.
          </p>
          <button
            type="button"
            onClick={() => {
              setReceiptSavedDismissed(true);
              navigate(location.pathname, { replace: true, state: {} });
            }}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-brand-dark/70 underline hover:text-brand-dark"
          >
            Dismiss
          </button>
        </div>
      )}
      {loadError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}{' '}
          {!isAuthed && (
            <Link
              to="/signin"
              className="font-semibold text-brand-green underline hover:no-underline"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
        <aside className="flex min-h-[min(52vh,420px)] shrink-0 flex-col rounded-2xl border border-black/5 bg-gradient-to-b from-brand-green/12 via-[#E8EBE4] to-brand-beige/40 p-3 shadow-sm sm:p-4 lg:min-h-0 lg:h-full lg:w-72 xl:w-80">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-dashed border-brand-green/25 bg-white/60">
            {/* Icon fills all available space above the stats strip */}
            <div className="relative flex min-h-[11rem] flex-1 flex-col p-1 sm:min-h-[13rem] sm:p-2 lg:min-h-0">
              <Refrigerator
                className="block h-full w-full flex-1 text-brand-green drop-shadow-md"
                strokeWidth={1.05}
                aria-hidden
                preserveAspectRatio="xMidYMid meet"
              />
            </div>

            <div className="shrink-0 border-t border-black/10 bg-white/80 px-3 py-3 text-center backdrop-blur-sm sm:px-4">
              <h2 className="text-lg font-black uppercase italic tracking-tight text-brand-dark sm:text-xl">
                Fridge
              </h2>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-brand-dark/55">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                {loading ? '…' : `${totalInFridge} items stored`}
              </p>
              <div className="mx-auto mt-2 max-w-[220px] space-y-1.5 text-left text-[10px] text-brand-dark/50 sm:text-[11px]">
                <div className="flex justify-between gap-2">
                  <span>Expiring soon</span>
                  <span className="font-semibold text-amber-800">
                    {loading ? '—' : expiringSoonCount}
                  </span>
                </div>
                <div className="h-px bg-black/10" />
                <div className="flex justify-between gap-2">
                  <span>Grid slots</span>
                  <span className="font-semibold text-brand-dark">
                    {SLOT_COUNT}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black uppercase italic tracking-tight text-brand-dark sm:text-3xl">
                My kitchen
              </h1>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark/45 sm:text-xs">
                Manage your ingredients and track expiration dates.
              </p>
              <div
                className="mt-4 inline-flex rounded-full border border-black/10 bg-[#F7F7F2] p-1"
                role="tablist"
                aria-label="Fridge view"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={fridgeView === 'all'}
                  onClick={() => setFridgeView('all')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
                    fridgeView === 'all'
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-brand-dark/55 hover:text-brand-dark'
                  }`}
                >
                  All items
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={fridgeView === 'expiry'}
                  onClick={() => setFridgeView('expiry')}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
                    fridgeView === 'expiry'
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-brand-dark/55 hover:text-brand-dark'
                  }`}
                >
                  Expiry priority
                </button>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-row flex-wrap items-center justify-end gap-2 sm:w-auto sm:justify-end">
              <Link
                to="/receipt-upload"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2 text-sm font-medium text-brand-dark hover:bg-black/5"
              >
                <Camera className="h-4 w-4" strokeWidth={2} />
                Scan receipt
              </Link>
              <button
                type="button"
                onClick={openAdd}
                disabled={!isAuthed || loading}
                className="inline-flex items-center gap-2 rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Add item
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-dark/35" />
              <input
                type="search"
                placeholder="Search ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={!isAuthed}
                className="w-full rounded-full border border-black/10 bg-[#F7F7F2] py-2.5 pl-10 pr-4 text-sm text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-green/50 focus:outline-none focus:ring-2 focus:ring-brand-green/20 disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <ListFilter className="h-4 w-4 shrink-0 text-brand-dark/40" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={!isAuthed}
                className="min-w-[140px] flex-1 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2.5 text-sm text-brand-dark focus:border-brand-green/50 focus:outline-none focus:ring-2 focus:ring-brand-green/20 sm:flex-none disabled:opacity-50"
              >
                <option value="all">All categories</option>
                {FRIDGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fridgeView === 'expiry' && (
            <>
              <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-black/5 bg-[#F7F7F2]/60 p-4 sm:flex-row sm:items-end sm:justify-between">
                <form
                  onSubmit={handleApplyExpiryWindow}
                  className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
                >
                  <div className="min-w-[200px] flex-1">
                    <label
                      htmlFor="expiry-window-days"
                      className="block text-xs font-semibold uppercase tracking-wide text-brand-dark/55"
                    >
                      Expiring in the next (days)
                    </label>
                    <Input
                      id="expiry-window-days"
                      type="number"
                      min={MIN_EXPIRY_WINDOW}
                      max={MAX_EXPIRY_WINDOW}
                      step={1}
                      value={expiringWindowDays}
                      onChange={(e) => setExpiringWindowDays(e.target.value)}
                      disabled={!isAuthed}
                      className="mt-1.5"
                    />
                    {windowTouched && windowValidationError && (
                      <p className="mt-1 text-xs text-red-600">
                        {windowValidationError}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={!isAuthed}>
                    Apply window
                  </Button>
                </form>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-dark/50">
                    Active window
                  </div>
                  <div className="mt-1 text-sm font-semibold text-brand-dark">
                    {appliedExpiryDays} days
                  </div>
                </div>
              </div>

              {expiryError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {expiryError}
                </div>
              )}
            </>
          )}

          {fridgeView === 'all' && hiddenCount > 0 && (
            <p className="mt-3 text-xs text-amber-800">
              Showing first {SLOT_COUNT} of {filteredSorted.length} matching
              items. Narrow your search or remove items to see the rest in this
              grid.
            </p>
          )}

          <div className="relative mt-4 min-h-0 flex-1 overflow-x-auto overflow-y-auto pb-1">
            {((fridgeView === 'all' && loading) ||
              (fridgeView === 'expiry' && (loading || expiryLoading))) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
                <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
              </div>
            )}
            {fridgeView === 'all' ? (
              <div className="grid w-full min-w-[480px] grid-cols-4 gap-3 sm:gap-4 md:min-w-0">
                {slots.map((item, index) =>
                  item ? (
                    <IngredientCard
                      key={item.id}
                      item={item}
                      onEdit={openEdit}
                      onRemove={setDeleteTarget}
                    />
                  ) : (
                    <button
                      key={`empty-${index}`}
                      type="button"
                      onClick={openAdd}
                      disabled={!isAuthed || loading}
                      className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 bg-[#F7F7F2]/80 text-brand-dark/40 transition-colors hover:border-brand-green/35 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-[188px]"
                    >
                      <Plus className="h-8 w-8" strokeWidth={1.75} />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        Add
                      </span>
                    </button>
                  ),
                )}
              </div>
            ) : (
              <>
                {isAuthed &&
                  !expiryLoading &&
                  !loading &&
                  !expiryError &&
                  filteredExpiry.length === 0 && (
                    <div className="rounded-2xl border border-black/5 bg-[#F7F7F2]/80 px-4 py-10 text-center text-sm text-brand-dark/65">
                      No items expiring in the next {appliedExpiryDays} days
                      {search.trim() || categoryFilter !== 'all'
                        ? ' matching your filters.'
                        : '.'}
                    </div>
                  )}
                {filteredExpiry.length > 0 && (
                  <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                    {filteredExpiry.map((item) => (
                      <IngredientCard
                        key={item.id}
                        item={item}
                        onEdit={openEdit}
                        onRemove={setDeleteTarget}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <IngredientFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingItem}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        itemName={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default MyFridge;
