import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';

const ConfirmDeleteDialog = ({ open, itemName, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const handleRemove = async () => {
    setError('');
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      const msg =
        (err && err.message) ||
        (typeof err === 'string' ? err : null) ||
        'Could not remove item.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-dark/50 hover:bg-black/5 hover:text-brand-dark disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="rounded-full bg-red-50 p-2 text-red-600">
            <AlertTriangle className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold text-brand-dark"
            >
              Remove ingredient?
            </h2>
            <p className="mt-2 text-sm text-brand-dark/65">
              <span className="font-medium text-brand-dark">{itemName}</span>{' '}
              will be removed from your fridge (entire quantity). You can add it
              again later.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            className="border border-black/10 bg-white text-brand-dark hover:bg-black/5"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <button
            type="button"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60"
            onClick={handleRemove}
          >
            {submitting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;
