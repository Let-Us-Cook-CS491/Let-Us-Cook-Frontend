const STORAGE_KEY = 'letUsCook_groceryList';

/**
 * @returns {Array<{ id: string, name: string, quantity: number|null, unit: string, purchased: boolean }>}
 */
export function loadLocalGroceryList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row, i) => ({
      id: String(row.id ?? `local-${i}`),
      name: String(row.name ?? '').trim(),
      quantity: row.quantity != null && row.quantity !== '' ? Number(row.quantity) : null,
      unit: row.unit != null ? String(row.unit).trim() : '',
      purchased: Boolean(row.purchased),
    }));
  } catch {
    return [];
  }
}

export function saveLocalGroceryList(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
}
