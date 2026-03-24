import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { FRIDGE_CATEGORIES, FRIDGE_UNITS, tomorrowISODate } from '../../utils/fridgeItem';

const emptyForm = {
  name: '',
  category: 'Produce',
  quantity: '',
  unit: 'pcs',
  location: '',
  expiresOn: '',
};

const IngredientFormModal = ({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
}) => {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitError('');
    if (mode === 'edit' && initialValues) {
      setValues({
        name: initialValues.name || '',
        category: initialValues.category || 'Produce',
        quantity:
          initialValues.quantityNum != null
            ? String(initialValues.quantityNum)
            : '',
        unit: initialValues.unit || 'pcs',
        location: initialValues.location || '',
        expiresOn: initialValues.expiresOn || '',
      });
    } else {
      setValues({
        ...emptyForm,
        expiresOn: tomorrowISODate(),
      });
    }
    setErrors({});
  }, [open, mode, initialValues]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = 'Name is required';
    const q = Number(values.quantity);
    if (values.quantity === '' || Number.isNaN(q) || q <= 0) {
      next.quantity = 'Quantity must be a number greater than 0';
    }
    if (!values.unit) next.unit = 'Unit is required';
    if (!values.expiresOn) next.expiresOn = 'Expiration date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload = {
      name: values.name.trim(),
      category: values.category,
      quantity: Number(values.quantity),
      unit: values.unit,
      location: values.location.trim(),
      expiresOn: values.expiresOn,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const msg =
        (err && err.message) ||
        (typeof err === 'string' ? err : null) ||
        'Something went wrong. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingredient-form-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-lg p-1 text-brand-dark/50 hover:bg-black/5 hover:text-brand-dark disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="ingredient-form-title"
          className="pr-10 text-lg font-semibold text-brand-dark"
        >
          {mode === 'edit' ? 'Edit ingredient' : 'Add ingredient'}
        </h2>
        <p className="mt-1 text-sm text-brand-dark/60">
          {mode === 'edit'
            ? 'Update details for this item in your kitchen.'
            : 'Add something new to track in your fridge.'}
        </p>

        {submitError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            autoComplete="off"
            disabled={submitting}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              name="category"
              value={values.category}
              onChange={handleChange}
              disabled={submitting}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FRIDGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              min="0"
              step="any"
              value={values.quantity}
              onChange={handleChange}
              placeholder="e.g. 6"
              error={errors.quantity}
              disabled={submitting}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <select
                name="unit"
                value={values.unit}
                onChange={handleChange}
                disabled={submitting}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FRIDGE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="text-xs text-red-600">{errors.unit}</p>
              )}
            </div>
          </div>

          <Input
            label="Location (optional)"
            name="location"
            value={values.location}
            onChange={handleChange}
            placeholder="e.g. Crisper drawer"
            disabled={submitting}
          />

          <Input
            label="Expiration date"
            name="expiresOn"
            type="date"
            value={values.expiresOn}
            onChange={handleChange}
            error={errors.expiresOn}
            disabled={submitting}
          />
          <p className="text-xs text-brand-dark/50">
            Expiration must be in the future (required by the server).
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              className="border border-black/10 bg-white text-brand-dark hover:bg-black/5"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-green hover:bg-brand-green/90"
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : mode === 'edit'
                  ? 'Save changes'
                  : 'Add item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IngredientFormModal;
