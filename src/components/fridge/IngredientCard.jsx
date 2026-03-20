import React from 'react';
import { Calendar, Pencil, Trash2, AlertCircle, Clock, Leaf } from 'lucide-react';

export const EXPIRING_SOON_DAYS = 3;

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const daysUntil = (dateString) => {
  const today = startOfToday();
  const target = new Date(dateString);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatExpires = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

const IngredientCard = ({ item, onEdit, onRemove }) => {
  const d = daysUntil(item.expiresOn);
  const isExpired = d < 0;
  const isExpiringSoon = !isExpired && d >= 0 && d <= EXPIRING_SOON_DAYS;

  let statusLabel = 'Fresh';
  let StatusIcon = Leaf;
  let statusClass =
    'bg-brand-green/15 text-brand-dark border-brand-green/30';

  if (isExpired) {
    statusLabel = 'Expired';
    StatusIcon = AlertCircle;
    statusClass = 'bg-red-50 text-red-700 border-red-200';
  } else if (isExpiringSoon) {
    statusLabel = 'Expiring soon';
    StatusIcon = Clock;
    statusClass = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return (
    <div className="flex h-full min-h-[132px] flex-col rounded-2xl border border-black/5 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md sm:min-h-[148px] sm:p-3">
      <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-dark/45 sm:text-[10px]">
        {item.category}
      </div>
      <h3 className="mt-0.5 line-clamp-2 text-xs font-bold uppercase italic leading-tight text-brand-dark sm:text-sm">
        {item.name}
      </h3>

      <div className="mt-1.5 grid grid-cols-2 gap-1 text-[9px] sm:mt-2 sm:gap-2 sm:text-[10px]">
        <div>
          <div className="font-semibold uppercase tracking-wide text-brand-dark/45">
            Quantity
          </div>
          <div className="mt-0.5 line-clamp-2 font-medium text-brand-dark">
            {item.quantity}
          </div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-wide text-brand-dark/45">
            Status
          </div>
          <div
            className={`mt-0.5 inline-flex max-w-full items-center gap-0.5 rounded-full border px-1 py-0.5 text-[8px] font-semibold sm:text-[9px] ${statusClass}`}
          >
            <StatusIcon className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" strokeWidth={2.25} />
            <span className="truncate">{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-1.5 sm:flex-row sm:items-center sm:justify-between sm:pt-2">
        <div className="flex min-w-0 items-center gap-0.5 text-[9px] text-brand-dark/50 sm:text-[10px]">
          <Calendar className="h-3 w-3 shrink-0" strokeWidth={2} />
          <span className="truncate">Expires: {formatExpires(item.expiresOn)}</span>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-1 text-brand-dark/60 hover:bg-black/5 hover:text-brand-dark"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-lg p-1 text-red-600/70 hover:bg-red-50 hover:text-red-700"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;
