import React from 'react';
import {
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  AlertCircle,
  Clock,
  Leaf,
} from 'lucide-react';

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

  const locationText =
    typeof item.location === 'string' ? item.location.trim() : '';

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
    <div className="box-border flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-dark/45 sm:text-[10px]">
          {item.category}
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-xs font-bold uppercase italic leading-tight text-brand-dark sm:text-sm">
          {item.name}
        </h3>

        {locationText ? (
          <div className="mt-1.5 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark/45 sm:text-[11px]">
              Location
            </div>
            <div className="mt-0.5 inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-1 text-[9px] font-semibold text-blue-800 sm:text-[10px]">
              <MapPin className="h-3 w-3 shrink-0" strokeWidth={2.25} />
              <span className="max-w-[min(100%,10rem)] break-words leading-tight">
                {locationText}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-1.5 space-y-1.5 text-[9px] sm:mt-2 sm:space-y-2 sm:text-[10px]">
          <div className="min-w-0">
            <div className="font-semibold uppercase tracking-wide text-brand-dark/45">
              Quantity
            </div>
            <div className="mt-0.5 line-clamp-2 font-medium text-brand-dark">
              {item.quantity}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-semibold uppercase tracking-wide text-brand-dark/45">
              Status
            </div>
            <div
              className={`mt-0.5 inline-flex w-fit max-w-full items-center gap-0.5 whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-semibold sm:text-[10px] ${statusClass}`}
            >
              <StatusIcon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5 border-t border-black/5 bg-white px-2.5 pb-2.5 pt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-1 sm:px-3 sm:pb-2.5 sm:pt-2">
        <div className="flex min-w-0 flex-1 items-start gap-1 text-[9px] text-brand-dark/50 sm:text-[10px]">
          <Calendar className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
          <span className="min-w-0 break-words leading-snug">
            Expires: {formatExpires(item.expiresOn)}
          </span>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="rounded-lg p-1.5 text-brand-dark/60 hover:bg-black/5 hover:text-brand-dark"
            aria-label={`Edit ${item.name}`}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="rounded-lg p-1.5 text-red-600/70 hover:bg-red-50 hover:text-red-700"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;
