import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { setDietPreferences } from '../services/dietPreferencesService';
import { loadProfileSnapshot, saveProfileSnapshot } from '../utils/profileStorage';

const dietOptions = [
  'Everything',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Paleo',
  'Halal',
];

const restrictionOptions = [
  'Gluten',
  'Dairy',
  'Nuts',
  'Shellfish',
  'Soy',
  'Eggs',
];

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Something went wrong. Please try again.';
};

const SNAPSHOT_KEY = 'dietPreferences';

const labelStyle =
  'text-[11px] font-bold uppercase italic tracking-[0.14em] text-[#a0a0a0]';

const headingStyle =
  'text-base font-bold uppercase italic tracking-wide text-[#231F20]';

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={clsx(
      'relative h-7 w-[52px] shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F5D48]/50 disabled:opacity-50',
      checked ? 'bg-[#4F5D48]' : 'bg-[#d4d4d0]',
    )}
  >
    <span
      className={clsx(
        'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out',
        checked && 'translate-x-[22px]',
      )}
    />
  </button>
);

const DietPreferences = () => {
  const [currentDiet, setCurrentDiet] = useState('Everything');
  const [restrictions, setRestrictions] = useState([]);
  const [smartAlerts, setSmartAlerts] = useState({
    kitchen_briefing: true,
    waste_prevention: true,
  });
  const [showAddRestriction, setShowAddRestriction] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saveState, setSaveState] = useState({
    saving: false,
    error: '',
    success: '',
  });

  useEffect(() => {
    const snap = loadProfileSnapshot(SNAPSHOT_KEY);
    if (!snap || typeof snap !== 'object') return;

    if (snap.current_diet && typeof snap.current_diet === 'string') {
      setCurrentDiet(snap.current_diet);
    }
    if (Array.isArray(snap.restrictions)) {
      setRestrictions(snap.restrictions);
    }
    if (snap.smart_alerts && typeof snap.smart_alerts === 'object') {
      setSmartAlerts((prev) => ({
        kitchen_briefing:
          typeof snap.smart_alerts.kitchen_briefing === 'boolean'
            ? snap.smart_alerts.kitchen_briefing
            : prev.kitchen_briefing,
        waste_prevention:
          typeof snap.smart_alerts.waste_prevention === 'boolean'
            ? snap.smart_alerts.waste_prevention
            : prev.waste_prevention,
      }));
    }
  }, []);

  const validationError = useMemo(() => {
    if (!currentDiet) return 'Please select a current diet.';
    return '';
  }, [currentDiet]);

  const availableToAdd = restrictionOptions.filter((r) => !restrictions.includes(r));

  const removeRestriction = (value) => {
    setRestrictions((prev) => prev.filter((item) => item !== value));
    setSaveState((prev) => ({ ...prev, success: '', error: '' }));
  };

  const addRestriction = (value) => {
    setRestrictions((prev) => [...prev, value]);
    setSaveState((prev) => ({ ...prev, success: '', error: '' }));
    if (availableToAdd.length <= 1) setShowAddRestriction(false);
  };

  const toggleAlert = (key) => {
    setSmartAlerts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaveState((prev) => ({ ...prev, success: '', error: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);

    if (validationError) return;

    setSaveState({ saving: true, error: '', success: '' });

    try {
      const payload = {
        current_diet: currentDiet,
        restrictions,
        smart_alerts: smartAlerts,
      };

      const result = await setDietPreferences(payload);
      const fromApi = result?.data;
      const snapshot =
        fromApi && typeof fromApi === 'object'
          ? {
              current_diet: fromApi.current_diet ?? payload.current_diet,
              restrictions: Array.isArray(fromApi.restrictions)
                ? fromApi.restrictions
                : payload.restrictions,
              smart_alerts: fromApi.smart_alerts ?? payload.smart_alerts,
            }
          : payload;

      saveProfileSnapshot(SNAPSHOT_KEY, snapshot);
      setSaveState({
        saving: false,
        error: '',
        success: 'Preferences saved successfully.',
      });
    } catch (error) {
      setSaveState({
        saving: false,
        error: getErrorMessage(error),
        success: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveState.error && (
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {saveState.error}
        </div>
      )}
      {saveState.success && (
        <div className="rounded-[28px] border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-800">
          {saveState.success}
        </div>
      )}

      {/* Dietary Pattern card */}
      <div className="rounded-[40px] border border-black/[0.06] bg-white px-8 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <header className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-8 w-8 shrink-0 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <div>
            <h3 className={`${headingStyle} text-lg md:text-xl`}>Dietary pattern</h3>
            <p className="mt-2 max-w-xl text-[10px] font-medium uppercase italic leading-relaxed tracking-[0.12em] text-[#a0a0a0] md:text-[11px]">
              Tailor your recipe recommendations based on your habits.
            </p>
          </div>
        </header>

        <section className="mt-8">
          <h4 className={labelStyle}>Current diet</h4>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {dietOptions.map((option) => {
              const isSelected = currentDiet === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCurrentDiet(option);
                    setSaveState((prev) => ({ ...prev, success: '', error: '' }));
                  }}
                  className={clsx(
                    'rounded-2xl px-4 py-4 text-center text-xs font-bold uppercase italic transition-colors md:text-sm',
                    isSelected
                      ? 'border-2 border-[#4a634e] bg-white text-[#4a634e] shadow-sm'
                      : 'border border-transparent bg-[#EFEFED] text-[#a0a0a0] hover:bg-[#e8e8e6]',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {touched && validationError && (
            <p className="mt-3 text-xs italic text-red-600">{validationError}</p>
          )}
        </section>

        <section className="mt-10">
          <h4 className={labelStyle}>Restrictions</h4>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {restrictions.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 rounded-full bg-[#262322] py-2 pl-4 pr-3 text-[11px] font-bold uppercase italic text-white"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeRestriction(tag)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[#c8c8c8] hover:bg-white/10 hover:text-white"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setShowAddRestriction((v) => !v)}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full border-2 border-dashed border-[#b8bcc4] bg-white px-4 py-2 text-[11px] font-bold uppercase italic text-[#a0a0a0] transition-colors hover:border-[#a0a0a0]',
                showAddRestriction && 'border-[#4a634e] text-[#4a634e]',
              )}
            >
              <span className="text-base leading-none">+</span>
              Add new
            </button>
          </div>
          {showAddRestriction && availableToAdd.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-[#F5F5F3] p-3">
              {availableToAdd.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => addRestriction(opt)}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[10px] font-bold uppercase italic text-[#6a6a6a] hover:border-[#4a634e] hover:text-[#4a634e]"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Smart Alerts card */}
      <div className="rounded-[40px] border border-black/[0.06] bg-white px-8 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <header className="flex items-center gap-3 border-b border-black/[0.06] pb-5">
          <svg
            className="h-7 w-7 shrink-0 text-[#231F20]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <h3 className={`${headingStyle}`}>Smart alerts</h3>
        </header>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 rounded-3xl bg-[#F5F5F3] px-5 py-5">
            <div className="min-w-0 flex-1">
              <div className={`${headingStyle} text-sm`}>Waste prevention</div>
              <p className="mt-2 text-[9px] font-medium uppercase italic leading-relaxed tracking-[0.1em] text-[#a0a0a0] md:text-[10px]">
                Notifications before items in your fridge go to waste.
              </p>
            </div>
            <Toggle
              checked={smartAlerts.waste_prevention}
              onChange={(v) => {
                setSmartAlerts((p) => ({ ...p, waste_prevention: v }));
                setSaveState((prev) => ({ ...prev, success: '', error: '' }));
              }}
              disabled={saveState.saving}
            />
          </div>

          <div className="flex items-center gap-4 rounded-3xl bg-[#F5F5F3] px-5 py-5">
            <div className="min-w-0 flex-1">
              <div className={`${headingStyle} text-sm`}>Kitchen briefing</div>
              <p className="mt-2 text-[9px] font-medium uppercase italic leading-relaxed tracking-[0.1em] text-[#a0a0a0] md:text-[10px]">
                Daily smart suggestions for your scheduled meals.
              </p>
            </div>
            <Toggle
              checked={smartAlerts.kitchen_briefing}
              onChange={(v) => {
                setSmartAlerts((p) => ({ ...p, kitchen_briefing: v }));
                setSaveState((prev) => ({ ...prev, success: '', error: '' }));
              }}
              disabled={saveState.saving}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saveState.saving}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#231F20] py-4 text-xs font-bold uppercase italic tracking-[0.12em] text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 md:text-sm"
        >
          {saveState.saving ? 'Saving...' : 'Apply all preferences'}
          {!saveState.saving && <span aria-hidden className="text-base">›</span>}
        </button>
      </div>
    </form>
  );
};

export default DietPreferences;
