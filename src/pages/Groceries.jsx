import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Check,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY = 'let_us_cook_grocery_list_v1';

function normalizeItem(row) {
  if (!row || typeof row.id !== 'string' || typeof row.name !== 'string') {
    return null;
  }
  const amount =
    typeof row.amountLabel === 'string' && row.amountLabel.trim()
      ? row.amountLabel.trim()
      : '1';
  return {
    id: row.id,
    name: row.name,
    amountLabel: amount,
    checked: Boolean(row.checked),
  };
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.map(normalizeItem).filter(Boolean);
  } catch {
    return [];
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function formatListForShare(items) {
  const lines = [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
  const textLines = lines.map((i) => {
    const line = i.amountLabel ? `${i.name} — ${i.amountLabel}` : i.name;
    const mark = i.checked ? '☑' : '☐';
    return `${mark} ${line}`;
  });
  return ['Let Us Cook — Grocery list', '', ...textLines].join('\n');
}

const Groceries = () => {
  const [items, setItems] = useState(() => loadItems());
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('1');

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.name.localeCompare(b.name);
      }),
    [items],
  );

  const totalCount = items.length;
  const pickedCount = items.filter((i) => i.checked).length;

  const addItem = useCallback(() => {
    const name = nameInput.trim();
    if (!name) return;
    const amountLabel = amountInput.trim() || '1';
    setItems((prev) => [
      ...prev,
      {
        id: makeId(),
        name,
        amountLabel,
        checked: false,
      },
    ]);
    setNameInput('');
    setAmountInput('1');
  }, [nameInput, amountInput]);

  const toggleChecked = (id) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleShare = async () => {
    if (items.length === 0) return;
    const text = formatListForShare(items);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Grocery list',
          text,
        });
        return;
      }
    } catch {
      /* user cancelled or share failed */
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <div className="rounded-2xl border border-black/5 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase italic tracking-tight text-brand-dark sm:text-3xl">
              Grocery list
            </h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark/45 sm:text-xs">
              Your list — add what you need, check it off as you shop.
            </p>
            {totalCount > 0 && (
              <p className="mt-2 text-sm text-brand-dark/60">
                <span className="font-semibold text-brand-green">
                  {pickedCount}
                </span>
                {' of '}
                <span className="font-semibold text-brand-dark">{totalCount}</span>
                {' picked'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            <button
              type="button"
              onClick={handleShare}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-dark hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Share2 className="h-4 w-4" strokeWidth={2} />
              Share
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#F7F7F2] p-3 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <ShoppingCart
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-dark/35"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addItem();
              }}
              placeholder="Add an item…"
              className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-3 text-sm text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              aria-label="Item name"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:w-36 sm:shrink-0">
            <input
              type="text"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="Qty"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/20 sm:flex-none sm:w-full"
              aria-label="Amount or unit"
            />
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-xl bg-brand-dark text-white shadow-sm hover:bg-brand-dark/90 sm:self-auto"
            aria-label="Add to list"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-8">
          {sortedItems.length === 0 && (
            <div className="rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-6 py-14 text-center">
              <ShoppingCart
                className="mx-auto h-12 w-12 text-brand-dark/20"
                strokeWidth={1.25}
              />
              <p className="mt-3 text-sm font-semibold text-brand-dark/70">
                Your list is empty
              </p>
              <p className="mt-1 text-xs text-brand-dark/45">
                Add items above and tap + to build your list.
              </p>
            </div>
          )}

          {sortedItems.length > 0 && (
            <ul className="space-y-2" aria-label="Grocery list">
              {sortedItems.map((item) => (
                <li key={item.id}>
                  <div
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      item.checked
                        ? 'border-black/5 bg-[#F7F7F2]/90'
                        : 'border-black/10 bg-white shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleChecked(item.id)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        item.checked
                          ? 'border-brand-green bg-brand-green text-white'
                          : 'border-black/15 bg-white text-transparent hover:border-brand-green/50'
                      }`}
                      aria-pressed={item.checked}
                      aria-label={
                        item.checked ? 'Mark not bought' : 'Mark bought'
                      }
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold uppercase tracking-wide text-brand-dark ${
                          item.checked ? 'line-through opacity-55' : ''
                        }`}
                      >
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-dark/50">
                        {item.amountLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 rounded-lg p-2 text-brand-dark/35 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Groceries;
