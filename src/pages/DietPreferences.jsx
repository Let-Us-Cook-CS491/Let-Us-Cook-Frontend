import React, { useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import { setDietPreferences } from '../services/dietPreferencesService';

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

const DietPreferences = () => {
  const [currentDiet, setCurrentDiet] = useState('Everything');
  const [restrictions, setRestrictions] = useState([]);
  const [smartAlerts, setSmartAlerts] = useState({
    kitchen_briefing: true,
    waste_prevention: true,
  });
  const [touched, setTouched] = useState(false);
  const [saveState, setSaveState] = useState({
    saving: false,
    error: '',
    success: '',
  });

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

      await setDietPreferences(payload);
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

