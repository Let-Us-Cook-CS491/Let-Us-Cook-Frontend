/** Mirrors backend helperFunctions.js allowed values */
export const FRIDGE_CATEGORIES = [
  'Produce',
  'Protein',
  'Dairy',
  'Pantry',
  'Bakery',
];

export const FRIDGE_UNITS = ['g', 'ml', 'pcs', 'kg', 'L', 'pack'];

export function toDisplayName(storedName) {
  if (!storedName) return '';
  return storedName
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Map API / Mongo lean doc to UI card shape
 */
export function mapFridgeDocToUi(doc) {
  if (!doc) return null;
  const exp = doc.expiration_date;
  const d = exp instanceof Date ? exp : new Date(exp);
  const expiresOn = Number.isNaN(d.getTime())
    ? ''
    : d.toISOString().slice(0, 10);

  const qty = Number(doc.quantity);
  const unit = doc.unit || '';

  return {
    id: String(doc._id),
    name: toDisplayName(doc.name),
    category: doc.category,
    quantityNum: Number.isFinite(qty) ? qty : 0,
    unit,
    quantity: `${doc.quantity} ${unit}`.trim(),
    location: doc.location || '',
    expiresOn,
  };
}

export function tomorrowISODate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
