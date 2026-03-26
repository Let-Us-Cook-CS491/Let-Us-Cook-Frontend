import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
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

const DietPreferences = () => {
  const [currentDiet, setCurrentDiet] = useState('Everything');
  const [restrictions, setRestrictions] = useState([]);
  const [smartAlerts, setSmartAlerts] = useState({
    kitchen_briefing: true,
    waste_prevention: true,
  });
  const [savedSummary, setSavedSummary] = useState(null);
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
    setSavedSummary(snap);
  }, []);

  const validationError = useMemo(() => {
    if (!currentDiet) return 'Please select a current diet.';
    return '';
  }, [currentDiet]);

  const toggleRestriction = (value) => {
    setRestrictions((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
    setSaveState((prev) => ({ ...prev, success: '', error: '' }));
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
      const snapshot = fromApi && typeof fromApi === 'object'
        ? {
            current_diet: fromApi.current_diet ?? payload.current_diet,
            restrictions: Array.isArray(fromApi.restrictions)
              ? fromApi.restrictions
              : payload.restrictions,
            smart_alerts: fromApi.smart_alerts ?? payload.smart_alerts,
          }
        : payload;

      saveProfileSnapshot(SNAPSHOT_KEY, snapshot);
      setSavedSummary(snapshot);
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
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-6">
      <h3 className="text-xl font-semibold text-brand-dark">Dietary Pattern</h3>
      <p className="mt-1 text-sm text-brand-dark/60 uppercase tracking-[0.12em]">
        Tailor recommendations based on your habits
      </p>

      {savedSummary && (
        <div className="mt-5 rounded-xl border border-brand-green/30 bg-brand-green/5 px-4 py-4 text-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-dark/70">
            Your saved preferences
          </div>
          <dl className="mt-3 space-y-2 text-brand-dark">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-brand-dark/60">Diet</dt>
              <dd className="font-medium">{savedSummary.current_diet || '—'}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-brand-dark/60">Restrictions</dt>
              <dd>
                {Array.isArray(savedSummary.restrictions) &&
                savedSummary.restrictions.length > 0
                  ? savedSummary.restrictions.join(', ')
                  : 'None'}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="sr-only">Alerts</dt>
              <dd className="text-brand-dark/80">
                Kitchen briefing:{' '}
                <span className="font-medium text-brand-dark">
                  {savedSummary.smart_alerts?.kitchen_briefing ? 'On' : 'Off'}
                </span>
              </dd>
              <dd className="text-brand-dark/80">
                Waste prevention:{' '}
                <span className="font-medium text-brand-dark">
                  {savedSummary.smart_alerts?.waste_prevention ? 'On' : 'Off'}
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-brand-dark/50">
            Shown from your last successful save on this browser.
          </p>
        </div>
      )}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        {saveState.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveState.error}
          </div>
        )}
        {saveState.success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {saveState.success}
          </div>
        )}

        <section>
          <h4 className="text-xs uppercase tracking-[0.16em] text-brand-dark/60 font-semibold">
            Current Diet
          </h4>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                  className={[
                    'rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                    isSelected
                      ? 'border-brand-green bg-brand-green/10 text-brand-dark'
                      : 'border-black/10 bg-[#F7F7F2] text-brand-dark/80 hover:border-brand-green/50',
                  ].join(' ')}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {touched && validationError && (
            <p className="mt-2 text-xs text-red-600">{validationError}</p>
          )}
        </section>

        <section>
          <h4 className="text-xs uppercase tracking-[0.16em] text-brand-dark/60 font-semibold">
            Restrictions
          </h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {restrictionOptions.map((option) => {
              const selected = restrictions.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleRestriction(option)}
                  className={[
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-brand-dark bg-brand-dark text-brand-beige'
                      : 'border-black/10 bg-white text-brand-dark/80 hover:bg-black/5',
                  ].join(' ')}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h4 className="text-xs uppercase tracking-[0.16em] text-brand-dark/60 font-semibold">
            Smart Alerts
          </h4>
          <div className="mt-3 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-brand-dark">Kitchen Briefing</div>
                <div className="text-xs text-brand-dark/60">
                  Get a short daily kitchen summary.
                </div>
              </div>
              <input
                type="checkbox"
                checked={smartAlerts.kitchen_briefing}
                onChange={() => toggleAlert('kitchen_briefing')}
                className="h-4 w-4 accent-brand-green"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-brand-dark">Waste Prevention</div>
                <div className="text-xs text-brand-dark/60">
                  Alerts for ingredients you should use soon.
                </div>
              </div>
              <input
                type="checkbox"
                checked={smartAlerts.waste_prevention}
                onChange={() => toggleAlert('waste_prevention')}
                className="h-4 w-4 accent-brand-green"
              />
            </label>
          </div>
        </section>

        <div className="pt-2">
          <Button type="submit" disabled={saveState.saving}>
            {saveState.saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DietPreferences;

