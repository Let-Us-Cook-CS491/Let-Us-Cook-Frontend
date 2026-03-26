import React, { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { fetchHealthGoals, setHealthGoals } from '../services/healthGoalsService';
import { loadProfileSnapshot, saveProfileSnapshot } from '../utils/profileStorage';

const GOAL_API = {
  lose: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain: 'Gain Weight',
};

const ACTIVITY_API = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

const goalTypeFromApi = (goal) => {
  if (!goal || typeof goal !== 'string') return null;
  const entry = Object.entries(GOAL_API).find(([, v]) => v === goal);
  return entry ? entry[0] : null;
};

const activityFromApi = (level) => {
  if (!level || typeof level !== 'string') return null;
  const entry = Object.entries(ACTIVITY_API).find(([, v]) => v === level);
  if (entry) return entry[0];
  const lower = level.toLowerCase().replace(/\s+/g, '_');
  if (ACTIVITY_API[lower]) return lower;
  return null;
};

const goalTypeFromLegacyString = (s) => {
  const lower = s.toLowerCase();
  if (lower.includes('lose')) return 'lose';
  if (lower.includes('gain')) return 'gain';
  if (lower.includes('maintain')) return 'maintain';
  return null;
};

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Something went wrong. Please try again.';
};

const HEALTH_GOALS_SNAPSHOT_KEY = 'healthGoals';

const HealthGoals = () => {
  const [formValues, setFormValues] = useState({
    goalType: 'maintain',
    activityLevel: 'moderate',
    weeklyChangeLbs: '',
    dailyCalorieTarget: '',
  });
  const [touched, setTouched] = useState({});
  const [loadState, setLoadState] = useState({
    loading: true,
    error: '',
  });
  const [saveState, setSaveState] = useState({
    saving: false,
    error: '',
    success: false,
  });
  const [savedSummary, setSavedSummary] = useState(null);

  const errors = useMemo(() => {
    const next = {};

    if (!formValues.goalType) next.goalType = 'Select a goal';
    if (!formValues.activityLevel) next.activityLevel = 'Select an activity level';

    const weekly = toNumber(formValues.weeklyChangeLbs);
    if (formValues.goalType !== 'maintain') {
      if (weekly === null) {
        next.weeklyChangeLbs = 'Enter a weekly change';
      } else if (weekly <= 0 || weekly > 2) {
        next.weeklyChangeLbs = 'Use a value between 0.1 and 2.0';
      }
    }

    const calories = toNumber(formValues.dailyCalorieTarget);
    if (formValues.dailyCalorieTarget !== '') {
      if (calories === null) next.dailyCalorieTarget = 'Enter a number';
      else if (calories < 800 || calories > 6000) next.dailyCalorieTarget = 'Use 800–6000';
    }

    return next;
  }, [formValues]);

  const isValid = Object.keys(errors).length === 0;

  const showError = (key) => touched[key] && errors[key];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setSaveState((prev) => ({ ...prev, success: false, error: '' }));
  };

  const handleBlur = (event) => {
    setTouched((prev) => ({ ...prev, [event.target.name]: true }));
  };

  const hydrateFromApi = (data) => {
    const raw = data?.data ?? data;
    if (!raw || typeof raw !== 'object') return;

    const g = raw.goal ?? raw.goalType;
    const a = raw.activity_level ?? raw.activityLevel;
    const cal = raw.calorie_target ?? raw.dailyCalorieTarget;

    const mappedGoal = goalTypeFromApi(g) || (typeof g === 'string' ? goalTypeFromLegacyString(g) : null);
    const mappedActivity = activityFromApi(a) || (typeof a === 'string' && ACTIVITY_API[a] ? a : null);

    setFormValues((prev) => ({
      ...prev,
      goalType: mappedGoal || prev.goalType,
      activityLevel: mappedActivity || prev.activityLevel,
      weeklyChangeLbs:
        raw.weeklyChangeLbs === 0 || raw.weeklyChangeLbs
          ? String(raw.weeklyChangeLbs)
          : prev.weeklyChangeLbs,
      dailyCalorieTarget:
        cal === 0 || cal ? String(cal) : prev.dailyCalorieTarget,
    }));
  };

  useEffect(() => {
    const snap = loadProfileSnapshot(HEALTH_GOALS_SNAPSHOT_KEY);
    if (snap && typeof snap === 'object') {
      setSavedSummary(snap);
      const gt = goalTypeFromApi(snap.goal);
      const al = activityFromApi(snap.activity_level);
      setFormValues((prev) => ({
        ...prev,
        goalType: gt || prev.goalType,
        activityLevel: al || prev.activityLevel,
        dailyCalorieTarget:
          snap.calorie_target === 0 || snap.calorie_target != null
            ? String(snap.calorie_target)
            : prev.dailyCalorieTarget,
      }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoadState({ loading: true, error: '' });
      try {
        const data = await fetchHealthGoals();
        if (cancelled) return;
        hydrateFromApi(data);
        setLoadState({ loading: false, error: '' });
      } catch (error) {
        if (cancelled) return;
        setLoadState({ loading: false, error: getErrorMessage(error) });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRetry = () => {
    setTouched({});
    setLoadState((prev) => ({ ...prev, error: '', loading: true }));
    fetchHealthGoals()
      .then((data) => {
        hydrateFromApi(data);
        setLoadState({ loading: false, error: '' });
      })
      .catch((error) => {
        setLoadState({ loading: false, error: getErrorMessage(error) });
      });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({
      goalType: true,
      activityLevel: true,
      weeklyChangeLbs: true,
      dailyCalorieTarget: true,
    });

    if (!isValid) return;

    setSaveState({ saving: true, error: '', success: false });

    try {
      const calorieTarget = toNumber(formValues.dailyCalorieTarget);
      const payload = {
        goal: GOAL_API[formValues.goalType],
        activity_level: ACTIVITY_API[formValues.activityLevel],
        ...(calorieTarget != null ? { calorie_target: calorieTarget } : {}),
      };

      await setHealthGoals(payload);
      saveProfileSnapshot(HEALTH_GOALS_SNAPSHOT_KEY, payload);
      setSavedSummary(payload);
      setSaveState({ saving: false, error: '', success: true });
    } catch (error) {
      setSaveState({ saving: false, error: getErrorMessage(error), success: false });
    }
  };

  return (
    <div className="h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 h-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-dark">Health Goals</h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Set targets we can use to personalize meal plans and suggestions.
            </p>
          </div>
        </div>

        <div className="mt-4 h-[1px] bg-black/5" />

        {savedSummary && (
          <div className="mt-5 rounded-xl border border-brand-green/30 bg-brand-green/5 px-4 py-4 text-sm max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-dark/70">
              Your saved health goals
            </div>
            <dl className="mt-3 space-y-2 text-brand-dark">
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-brand-dark/60">Goal</dt>
                <dd className="font-medium">{savedSummary.goal || '—'}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-brand-dark/60">Activity</dt>
                <dd className="font-medium">{savedSummary.activity_level || '—'}</dd>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-brand-dark/60">Calorie target</dt>
                <dd className="font-medium">
                  {savedSummary.calorie_target != null && savedSummary.calorie_target !== ''
                    ? String(savedSummary.calorie_target)
                    : 'Not set'}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-brand-dark/50">
              Shown from your last successful save on this browser. A server GET endpoint can
              replace this when available.
            </p>
          </div>
        )}

        {loadState.loading ? (
          <div className="mt-6 text-sm text-brand-dark/60">
            Loading your goals…
          </div>
        ) : loadState.error ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadState.error}
            </div>
            <Button type="button" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-5 max-w-xl" onSubmit={handleSubmit}>
            {saveState.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveState.error}
              </div>
            )}
            {saveState.success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Saved!
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Goal
              </label>
              <select
                name="goalType"
                className={[
                  'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  showError('goalType') ? 'border-red-500' : 'border-gray-300',
                ].join(' ')}
                value={formValues.goalType}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={saveState.saving}
              >
                <option value="lose">Lose weight</option>
                <option value="maintain">Maintain weight</option>
                <option value="gain">Gain weight</option>
              </select>
              {showError('goalType') && (
                <p className="text-xs text-red-600">{errors.goalType}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Activity level
              </label>
              <select
                name="activityLevel"
                className={[
                  'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  showError('activityLevel') ? 'border-red-500' : 'border-gray-300',
                ].join(' ')}
                value={formValues.activityLevel}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={saveState.saving}
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very active</option>
              </select>
              {showError('activityLevel') && (
                <p className="text-xs text-red-600">{errors.activityLevel}</p>
              )}
            </div>

            {formValues.goalType !== 'maintain' && (
              <Input
                label="Weekly change (lbs/week)"
                name="weeklyChangeLbs"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.1"
                max="2"
                placeholder="e.g. 1.0"
                value={formValues.weeklyChangeLbs}
                onChange={handleChange}
                onBlur={handleBlur}
                error={showError('weeklyChangeLbs') ? errors.weeklyChangeLbs : undefined}
                disabled={saveState.saving}
              />
            )}

            <Input
              label="Daily calorie target (optional)"
              name="dailyCalorieTarget"
              type="number"
              inputMode="numeric"
              step="10"
              min="800"
              max="6000"
              placeholder="e.g. 2200"
              value={formValues.dailyCalorieTarget}
              onChange={handleChange}
              onBlur={handleBlur}
              error={showError('dailyCalorieTarget') ? errors.dailyCalorieTarget : undefined}
              disabled={saveState.saving}
            />

            <div className="pt-1 flex items-center gap-3">
              <Button type="submit" disabled={saveState.saving || !isValid}>
                {saveState.saving ? 'Saving…' : 'Save goals'}
              </Button>
              {!isValid && (
                <span className="text-xs text-brand-dark/60">
                  Fix the highlighted fields to continue.
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HealthGoals;

