import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
  Loader2,
  Refrigerator,
  Archive,
  ListTree,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  createGroceryList,
  fetchGroceryLists,
  fetchGroceryList,
  addItemsToGroceryList,
  patchItemPurchase,
  deleteGroceryListItem,
  addGroceryItemToFridge,
  archiveGroceryList,
  deleteGroceryList,
} from '../services/groceryListService';

const SELECTED_LIST_KEY = 'grocery_selected_list_id';
const SELECTED_ARCHIVED_LIST_KEY = 'grocery_selected_archived_list_id';
const LIST_TAB_KEY = 'grocery_list_view_tab';

const storageKeyForTab = (tab) =>
  tab === 'archived' ? SELECTED_ARCHIVED_LIST_KEY : SELECTED_LIST_KEY;

function readStoredListTab() {
  try {
    return sessionStorage.getItem(LIST_TAB_KEY) === 'archived'
      ? 'archived'
      : 'active';
  } catch {
    return 'active';
  }
}

function readStoredSelectedIdForTab(tab) {
  try {
    return sessionStorage.getItem(storageKeyForTab(tab)) || '';
  } catch {
    return '';
  }
}

const CATEGORY_OPTIONS = [
  'Produce',
  'Meat',
  'Dairy',
  'Grains',
  'Pantry',
  'Frozen',
  'Beverages',
  'Other',
];

const DEFAULT_CATEGORY_ORDER = [
  'Produce',
  'Meat',
  'Dairy',
  'Grains',
  'Pantry',
  'Frozen',
  'Beverages',
  'Other',
];

function apiErr(e) {
  if (!e) return 'Something went wrong.';
  if (typeof e === 'string') return e;
  if (e.message) return e.message;
  return 'Something went wrong.';
}

function formatQtyLine(item) {
  const q = item.quantity;
  const u = item.unit;
  if (q != null && Number.isFinite(Number(q)) && u) {
    return `${q} ${u}`;
  }
  if (q != null && Number.isFinite(Number(q))) return String(q);
  if (u) return u;
  return '—';
}

function orderedCategoryKeys(itemsByCategory, categoryOrder) {
  if (!itemsByCategory || typeof itemsByCategory !== 'object') return [];
  const order =
    Array.isArray(categoryOrder) && categoryOrder.length
      ? categoryOrder
      : DEFAULT_CATEGORY_ORDER;
  const keys = Object.keys(itemsByCategory);
  return [...keys].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function formatListForShare(list) {
  if (!list?.items?.length) return '';
  const lines = list.items.map((i) => {
    const mark = i.purchased ? '☑' : '☐';
    const qty = formatQtyLine(i);
    return `${mark} ${i.name}${qty && qty !== '—' ? ` — ${qty}` : ''}`;
  });
  return ['Let Us Cook — ' + (list.name || 'Grocery list'), '', ...lines].join(
    '\n',
  );
}

const Groceries = () => {
  const isAuthed = Boolean(localStorage.getItem('accessToken'));

  const [lists, setLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listTab, setListTabState] = useState(readStoredListTab);
  const [selectedListId, setSelectedListId] = useState(() =>
    readStoredSelectedIdForTab(readStoredListTab()),
  );
  const isArchivedView = listTab === 'archived';

  const [detailLoading, setDetailLoading] = useState(false);
  const [listDetail, setListDetail] = useState(null);
  /** @type {{ list: object, items_by_category?: object, category_order?: string[], summary?: object } | null} */
  const [pageError, setPageError] = useState('');
  const [warnings, setWarnings] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('Shopping List');
  const [firstItemName, setFirstItemName] = useState('');
  const [firstCategory, setFirstCategory] = useState('Produce');
  const [firstQty, setFirstQty] = useState('');
  const [firstUnit, setFirstUnit] = useState('');
  const [createBusy, setCreateBusy] = useState(false);

  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('Produce');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  const [fridgeModal, setFridgeModal] = useState(null);
  const [fridgeExp, setFridgeExp] = useState('');
  const [fridgeQty, setFridgeQty] = useState('');
  const [fridgeUnit, setFridgeUnit] = useState('');
  const [fridgeLoc, setFridgeLoc] = useState('');
  const [fridgeBusy, setFridgeBusy] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(
    /** @type {null | 'archive' | 'delete'} */ (null),
  );
  const [confirmBusy, setConfirmBusy] = useState(false);

  const setListTab = useCallback((tab) => {
    setListTabState(tab);
    try {
      sessionStorage.setItem(LIST_TAB_KEY, tab);
    } catch {
      /* ignore */
    }
  }, []);

  const persistSelected = useCallback((id, tab = listTab) => {
    setSelectedListId(id);
    try {
      const key = storageKeyForTab(tab);
      if (id) sessionStorage.setItem(key, id);
      else sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [listTab]);

  const loadLists = useCallback(
    async (tabOverride) => {
      if (!isAuthed) return;
      const tab = tabOverride ?? listTab;
      setListsLoading(true);
      setPageError('');
      const archivedParam = tab === 'archived' ? 'true' : 'false';
      try {
        const res = await fetchGroceryLists({
          archived: archivedParam,
          limit: 50,
        });
        if (res?.status !== 'OK' || !Array.isArray(res?.data?.lists)) {
          throw new Error(res?.message || 'Could not load lists');
        }
        const dataLists = res.data.lists;
        setLists(dataLists);
        if (dataLists.length === 0) {
          persistSelected('', tab);
          setListDetail(null);
          return;
        }
        let saved = '';
        try {
          saved = sessionStorage.getItem(storageKeyForTab(tab)) || '';
        } catch {
          saved = '';
        }
        const has = dataLists.some((l) => String(l._id) === saved);
        persistSelected(has ? saved : String(dataLists[0]._id), tab);
      } catch (e) {
        setPageError(apiErr(e));
        setLists([]);
      } finally {
        setListsLoading(false);
      }
    },
    [isAuthed, listTab, persistSelected],
  );

  const loadDetail = useCallback(
    async (listId) => {
      if (!listId || !isAuthed) {
        setListDetail(null);
        return;
      }
      setDetailLoading(true);
      setPageError('');
      try {
        const res = await fetchGroceryList(listId);
        if (res?.status !== 'OK' || !res?.data?.list) {
          throw new Error(res?.message || 'Could not load list');
        }
        setListDetail(res.data);
      } catch (e) {
        setPageError(apiErr(e));
        setListDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [isAuthed],
  );

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (selectedListId) loadDetail(selectedListId);
    else setListDetail(null);
  }, [selectedListId, loadDetail]);

  useEffect(() => {
    if (listTab === 'archived') setCreateOpen(false);
  }, [listTab]);

  useEffect(() => {
    if (!confirmDialog) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !confirmBusy) setConfirmDialog(null);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [confirmDialog, confirmBusy]);

  const categorySections = useMemo(() => {
    if (!listDetail?.items_by_category) return [];
    const keys = orderedCategoryKeys(
      listDetail.items_by_category,
      listDetail.category_order,
    );
    return keys.map((cat) => ({
      category: cat,
      items: listDetail.items_by_category[cat] || [],
    }));
  }, [listDetail]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    const name = firstItemName.trim();
    if (!name) return;
    setCreateBusy(true);
    setPageError('');
    setWarnings([]);
    try {
      const item = {
        name,
        category: firstCategory || undefined,
        ...(firstQty.trim() !== '' && {
          quantity: Number(firstQty),
        }),
        ...(firstUnit.trim() && { unit: firstUnit.trim() }),
        source: 'manual',
      };
      const res = await createGroceryList({
        name: newListName.trim() || 'Shopping List',
        items: [item],
      });
      if (res?.status !== 'OK' || !res?.data?.list?._id) {
        throw new Error(res?.message || 'Could not create list');
      }
      if (res.data.warnings?.length) {
        setWarnings(res.data.warnings);
      }
      const id = String(res.data.list._id);
      setListTab('active');
      persistSelected(id, 'active');
      await loadLists('active');
      setCreateOpen(false);
      setFirstItemName('');
      setNewListName('Shopping List');
      setFirstQty('');
      setFirstUnit('');
    } catch (err) {
      setPageError(apiErr(err));
    } finally {
      setCreateBusy(false);
    }
  };

  const handleAddItems = async (e) => {
    e.preventDefault();
    if (!selectedListId || isArchivedView) return;
    const name = addName.trim();
    if (!name) return;
    setAddBusy(true);
    setPageError('');
    try {
      const item = {
        name,
        category: addCategory || undefined,
        ...(addQty.trim() !== '' && { quantity: Number(addQty) }),
        ...(addUnit.trim() && { unit: addUnit.trim() }),
        source: 'manual',
      };
      const res = await addItemsToGroceryList(selectedListId, [item]);
      if (res?.status !== 'OK') throw new Error(res?.message || 'Add failed');
      setAddName('');
      setAddQty('');
      setAddUnit('');
      await loadDetail(selectedListId);
      await loadLists();
    } catch (err) {
      setPageError(apiErr(err));
    } finally {
      setAddBusy(false);
    }
  };

  const togglePurchased = async (item, next) => {
    if (!selectedListId || isArchivedView) return;
    setPageError('');
    try {
      const res = await patchItemPurchase(selectedListId, item._id, next);
      if (res?.status !== 'OK') throw new Error(res?.message || 'Update failed');
      await loadDetail(selectedListId);
    } catch (err) {
      setPageError(apiErr(err));
    }
  };

  const removeItem = async (itemId) => {
    if (!selectedListId || isArchivedView) return;
    setPageError('');
    try {
      const res = await deleteGroceryListItem(selectedListId, itemId);
      if (res?.status !== 'OK') throw new Error(res?.message || 'Delete failed');
      await loadDetail(selectedListId);
      await loadLists();
    } catch (err) {
      setPageError(apiErr(err));
    }
  };

  const openFridgeModal = (item) => {
    if (isArchivedView) return;
    setFridgeModal(item);
    setFridgeExp('');
    setFridgeQty(
      item.quantity != null && Number.isFinite(Number(item.quantity))
        ? String(item.quantity)
        : '1',
    );
    setFridgeUnit(item.unit || 'pcs');
    setFridgeLoc('');
  };

  const submitFridge = async (e) => {
    e.preventDefault();
    if (!selectedListId || !fridgeModal || isArchivedView) return;
    if (!fridgeExp.trim()) {
      setPageError('Expiration date is required');
      return;
    }
    const q = Number(fridgeQty);
    if (!Number.isFinite(q) || q <= 0) {
      setPageError('Quantity must be greater than 0');
      return;
    }
    if (!fridgeUnit.trim()) {
      setPageError('Unit is required');
      return;
    }
    setFridgeBusy(true);
    setPageError('');
    try {
      const res = await addGroceryItemToFridge(
        selectedListId,
        fridgeModal._id,
        {
          expiration_date: fridgeExp.trim(),
          quantity: q,
          unit: fridgeUnit.trim(),
          ...(fridgeLoc.trim() ? { location: fridgeLoc.trim() } : {}),
        },
      );
      if (res?.status !== 'OK') throw new Error(res?.message || 'Failed');
      setFridgeModal(null);
      await loadDetail(selectedListId);
    } catch (err) {
      setPageError(apiErr(err));
    } finally {
      setFridgeBusy(false);
    }
  };

  const confirmArchiveList = async () => {
    if (!selectedListId || isArchivedView) return;
    setConfirmBusy(true);
    setPageError('');
    try {
      const res = await archiveGroceryList(selectedListId);
      if (res?.status !== 'OK') throw new Error(res?.message || 'Failed');
      setConfirmDialog(null);
      persistSelected('', 'active');
      setListDetail(null);
      await loadLists('active');
    } catch (err) {
      setPageError(apiErr(err));
    } finally {
      setConfirmBusy(false);
    }
  };

  const confirmDeleteList = async () => {
    if (!selectedListId) return;
    setConfirmBusy(true);
    setPageError('');
    try {
      const res = await deleteGroceryList(selectedListId);
      if (res?.status !== 'OK') throw new Error(res?.message || 'Failed');
      setConfirmDialog(null);
      persistSelected('', listTab);
      setListDetail(null);
      await loadLists();
    } catch (err) {
      setPageError(apiErr(err));
    } finally {
      setConfirmBusy(false);
    }
  };

  const handleShare = async () => {
    const list = listDetail?.list;
    if (!list?.items?.length) return;
    const text = formatListForShare(list);
    try {
      if (navigator.share) {
        await navigator.share({ title: list.name || 'Grocery list', text });
        return;
      }
    } catch {
      /* cancelled */
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const summary = listDetail?.summary;
  const currentList = listDetail?.list;

  if (!isAuthed) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        <p className="font-medium">Sign in to sync grocery lists with your account.</p>
        <Link
          to="/signin"
          className="mt-2 inline-block font-semibold text-brand-green underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col gap-4">
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warnings.map((w, i) => (
            <p key={i}>{w.message || JSON.stringify(w)}</p>
          ))}
          <button
            type="button"
            className="mt-2 text-xs font-semibold underline"
            onClick={() => setWarnings([])}
          >
            Dismiss
          </button>
        </div>
      )}

      {pageError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {pageError}
        </div>
      )}

      <div className="rounded-2xl border border-black/5 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase italic tracking-tight text-brand-dark sm:text-3xl">
              Groceries
            </h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark/45 sm:text-xs">
              {isArchivedView
                ? 'Past lists you archived — view only.'
                : 'Lists synced with the server — mark purchased, then add to fridge.'}
            </p>
            {summary && (
              <p className="mt-2 text-sm text-brand-dark/60">
                <span className="font-semibold text-brand-dark">
                  {summary.total_items ?? 0}
                </span>
                {' items · '}
                <span className="font-semibold text-brand-green">
                  {summary.purchased_items ?? 0}
                </span>
                {' purchased · '}
                <span className="font-semibold text-amber-800">
                  {summary.pending_items ?? 0}
                </span>
                {' pending'}
                {(summary.ready_for_fridge ?? 0) > 0 && (
                  <>
                    {' · '}
                    <span className="font-semibold text-brand-dark">
                      {summary.ready_for_fridge}
                    </span>
                    {' ready for fridge'}
                  </>
                )}
              </p>
            )}
            {isArchivedView && currentList?.archived_at && (
              <p className="mt-1 text-xs text-brand-dark/50">
                Archived{' '}
                {new Date(currentList.archived_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            {!isArchivedView && (
              <button
                type="button"
                onClick={() => setCreateOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-dark hover:bg-black/5"
              >
                <ListTree className="h-4 w-4" strokeWidth={2} />
                New list
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              disabled={!currentList?.items?.length}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-dark hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Share2 className="h-4 w-4" strokeWidth={2} />
              Share
            </button>
          </div>
        </div>

        <div
          className="mt-5 inline-flex gap-1 rounded-full border border-black/10 bg-[#F7F7F2] p-1"
          role="tablist"
          aria-label="Grocery list scope"
        >
          <button
            type="button"
            role="tab"
            aria-selected={listTab === 'active'}
            onClick={() => setListTab('active')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
              listTab === 'active'
                ? 'bg-white text-brand-dark shadow-sm'
                : 'text-brand-dark/55 hover:text-brand-dark'
            }`}
          >
            Active lists
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listTab === 'archived'}
            onClick={() => setListTab('archived')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors sm:text-sm ${
              listTab === 'archived'
                ? 'bg-white text-brand-dark shadow-sm'
                : 'text-brand-dark/55 hover:text-brand-dark'
            }`}
          >
            Archived
          </button>
        </div>

        {listsLoading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-brand-dark/60">
            <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
            Loading lists…
          </div>
        )}

        {!listsLoading && lists.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-dark/55">
              {isArchivedView ? 'Archived list' : 'Active list'}
            </label>
            <select
              value={selectedListId}
              onChange={(e) => persistSelected(e.target.value, listTab)}
              className="min-w-[200px] rounded-xl border border-black/10 bg-[#F7F7F2] px-3 py-2 text-sm text-brand-dark"
            >
              {lists.map((l) => (
                <option key={l._id} value={String(l._id)}>
                  {l.name || 'Untitled'}
                </option>
              ))}
            </select>
            {selectedListId && (
              <>
                {!isArchivedView && (
                  <button
                    type="button"
                    onClick={() => setConfirmDialog('archive')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-brand-dark/70 hover:bg-black/5"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDialog('delete')}
                  className="text-xs font-semibold text-red-600 underline hover:no-underline"
                >
                  Delete list
                </button>
              </>
            )}
          </div>
        )}

        {createOpen && !isArchivedView && (
          <form
            onSubmit={handleCreateList}
            className="mt-6 rounded-2xl border border-brand-green/25 bg-brand-green/5 p-4"
          >
            <p className="text-sm font-semibold text-brand-dark">
              Create a list (requires at least one item)
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                label="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Shopping List"
              />
              <Input
                label="First item name"
                value={firstItemName}
                onChange={(e) => setFirstItemName(e.target.value)}
                placeholder="e.g. milk"
                required
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-brand-dark/55">
                  Category
                </label>
                <select
                  value={firstCategory}
                  onChange={(e) => setFirstCategory(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Input
                  label="Qty"
                  type="number"
                  min="0"
                  step="any"
                  value={firstQty}
                  onChange={(e) => setFirstQty(e.target.value)}
                />
                <Input
                  label="Unit"
                  value={firstUnit}
                  onChange={(e) => setFirstUnit(e.target.value)}
                  placeholder="lbs"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" disabled={createBusy}>
                {createBusy ? 'Creating…' : 'Create list'}
              </Button>
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm text-brand-dark/70 hover:bg-black/5"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!listsLoading && lists.length === 0 && !createOpen && !isArchivedView && (
          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-6 py-10 text-center">
            <ShoppingCart
              className="mx-auto h-12 w-12 text-brand-dark/20"
              strokeWidth={1.25}
            />
            <p className="mt-3 text-sm font-semibold text-brand-dark/70">
              No grocery lists yet
            </p>
            <p className="mt-1 text-xs text-brand-dark/45">
              Create a list with at least one item to get started.
            </p>
            <Button className="mt-4" type="button" onClick={() => setCreateOpen(true)}>
              Create your first list
            </Button>
          </div>
        )}

        {!listsLoading && lists.length === 0 && isArchivedView && (
          <div className="mt-8 rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-6 py-10 text-center">
            <Archive
              className="mx-auto h-12 w-12 text-brand-dark/20"
              strokeWidth={1.25}
            />
            <p className="mt-3 text-sm font-semibold text-brand-dark/70">
              No archived lists yet
            </p>
            <p className="mt-1 text-xs text-brand-dark/45">
              Archive a list from Active lists to keep it here for reference.
            </p>
          </div>
        )}

        {selectedListId && (
          <>
            {!isArchivedView && (
            <form
              onSubmit={handleAddItems}
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#F7F7F2] p-3 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
                <ShoppingCart
                  className="pointer-events-none absolute left-3 top-[2.1rem] h-5 w-5 text-brand-dark/35"
                  strokeWidth={1.75}
                />
                <Input
                  label="Add item"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ingredient name"
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="mb-1 block text-xs font-semibold uppercase text-brand-dark/55">
                  Category
                </label>
                <select
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Qty"
                type="number"
                min="0"
                step="any"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                className="sm:w-24"
              />
              <Input
                label="Unit"
                value={addUnit}
                onChange={(e) => setAddUnit(e.target.value)}
                placeholder="pcs"
                className="sm:w-28"
              />
              <button
                type="submit"
                disabled={addBusy || detailLoading}
                className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-xl bg-brand-dark text-white shadow-sm hover:bg-brand-dark/90 disabled:opacity-50 sm:self-auto"
                aria-label="Add to list"
              >
                {addBusy ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Plus className="h-6 w-6" strokeWidth={2.5} />
                )}
              </button>
            </form>
            )}

            <div className="relative mt-8 min-h-[120px]">
              {detailLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
                </div>
              )}

              {categorySections.length === 0 && !detailLoading && (
                <div className="rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-6 py-12 text-center text-sm text-brand-dark/60">
                  {isArchivedView
                    ? 'No items in this list.'
                    : 'No items in this list. Add items above.'}
                </div>
              )}

              {categorySections.map(({ category, items }) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-dark/50">
                    <span className="h-px flex-1 bg-black/10" />
                    {category}
                    <span className="h-px flex-1 bg-black/10" />
                  </h2>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item._id}>
                        <div
                          className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                            item.purchased
                              ? 'border-black/5 bg-[#F7F7F2]/90'
                              : 'border-black/10 bg-white shadow-sm'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isArchivedView}
                            onClick={() =>
                              togglePurchased(item, !item.purchased)
                            }
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                              item.purchased
                                ? 'border-brand-green bg-brand-green text-white'
                                : 'border-black/15 bg-white text-transparent hover:border-brand-green/50'
                            }`}
                            aria-pressed={item.purchased}
                            aria-label={
                              item.purchased ? 'Mark not bought' : 'Mark bought'
                            }
                          >
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-bold uppercase tracking-wide text-brand-dark ${
                                item.purchased ? 'line-through opacity-55' : ''
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-xs text-brand-dark/50">
                              {formatQtyLine(item)}
                              {item.source && item.source !== 'manual' && (
                                <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] uppercase">
                                  {item.source}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1">
                            {item.purchased &&
                              !item.added_to_fridge &&
                              !item.added_to_fridge_at && (
                                <button
                                  type="button"
                                  disabled={isArchivedView}
                                  onClick={() => openFridgeModal(item)}
                                  className="inline-flex items-center gap-1 rounded-full border border-brand-green/40 bg-brand-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-dark hover:bg-brand-green/20 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Refrigerator className="h-3.5 w-3.5" />
                                  Fridge
                                </button>
                              )}
                            {item.added_to_fridge && (
                              <span className="text-[10px] font-semibold uppercase text-brand-green">
                                In fridge
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={isArchivedView}
                              onClick={() => removeItem(item._id)}
                              className="rounded-lg p-2 text-brand-dark/35 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {confirmDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby={
            confirmDialog === 'archive'
              ? 'grocery-confirm-archive-title'
              : 'grocery-confirm-delete-title'
          }
          onClick={() => !confirmBusy && setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmDialog === 'archive' ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-[#F7F7F2]">
                    <Archive className="h-5 w-5 text-brand-dark/70" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="grocery-confirm-archive-title"
                      className="text-lg font-bold text-brand-dark"
                    >
                      Archive this list?
                    </h2>
                    <p className="mt-1 text-sm text-brand-dark/60">
                      {currentList?.name ? (
                        <>
                          <span className="font-semibold text-brand-dark">
                            {currentList.name}
                          </span>{' '}
                          will move to Archived. You can open it there anytime.
                        </>
                      ) : (
                        'This list will move to Archived. You can open it there anytime.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={confirmBusy}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-dark/70 hover:bg-black/5 disabled:opacity-50"
                    onClick={() => setConfirmDialog(null)}
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    disabled={confirmBusy}
                    onClick={confirmArchiveList}
                    className="w-full sm:w-auto"
                  >
                    {confirmBusy ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Archiving…
                      </span>
                    ) : (
                      'Archive list'
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="grocery-confirm-delete-title"
                      className="text-lg font-bold text-brand-dark"
                    >
                      Delete this list?
                    </h2>
                    <p className="mt-1 text-sm text-brand-dark/60">
                      {currentList?.name ? (
                        <>
                          <span className="font-semibold text-brand-dark">
                            {currentList.name}
                          </span>{' '}
                          and all of its items will be removed permanently. This
                          can&apos;t be undone.
                        </>
                      ) : (
                        'This list and all of its items will be removed permanently. This cannot be undone.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={confirmBusy}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-dark/70 hover:bg-black/5 disabled:opacity-50"
                    onClick={() => setConfirmDialog(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirmBusy}
                    onClick={confirmDeleteList}
                    className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {confirmBusy ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting…
                      </span>
                    ) : (
                      'Delete permanently'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {fridgeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="fridge-modal-title"
          onClick={() => setFridgeModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="fridge-modal-title"
              className="text-lg font-bold text-brand-dark"
            >
              Add to fridge
            </h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              {fridgeModal.name} — purchased items only
            </p>
            <form onSubmit={submitFridge} className="mt-4 space-y-3">
              <Input
                label="Expiration date"
                type="date"
                value={fridgeExp}
                onChange={(e) => setFridgeExp(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  value={fridgeQty}
                  onChange={(e) => setFridgeQty(e.target.value)}
                  required
                />
                <Input
                  label="Unit"
                  value={fridgeUnit}
                  onChange={(e) => setFridgeUnit(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Location (optional)"
                value={fridgeLoc}
                onChange={(e) => setFridgeLoc(e.target.value)}
                placeholder="Main shelf"
              />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={fridgeBusy} className="flex-1">
                  {fridgeBusy ? 'Saving…' : 'Add to fridge'}
                </Button>
                <button
                  type="button"
                  className="rounded-xl px-4 py-2 text-sm text-brand-dark/70 hover:bg-black/5"
                  onClick={() => setFridgeModal(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groceries;
