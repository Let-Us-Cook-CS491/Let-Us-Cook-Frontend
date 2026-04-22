import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react';
import { getWeekPlan, generateWeekPlan } from '../services/mealPlanService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=200&h=200&fit=crop';

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const startOfWeek = (date) => {
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(date, offset);
};

const formatMonthDay = (date) => {
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
    date,
  );
  return `${month} ${date.getDate()}`;
};

const formatWeekRange = (date) => {
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${formatMonthDay(start)} - ${end.getDate()}`;
  }
  return `${formatMonthDay(start)} - ${formatMonthDay(end)}`;
};

/** Local YYYY-MM-DD for API weekStart */
function formatLocalYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function findDaySlots(plan, weekStart, dayIndex) {
  if (!plan?.days?.length) return null;
  const target = formatLocalYMD(addDays(weekStart, dayIndex));
  const row = plan.days.find((pd) => formatLocalYMD(pd.date) === target);
  return row?.slots || null;
}

function apiErrorMessage(err) {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return 'Something went wrong.';
}

const ImageWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

  useEffect(() => {
    setImgSrc(src || FALLBACK_IMAGE);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setImgSrc(FALLBACK_IMAGE)}
    />
  );
};

const MealPlan = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [plan, setPlan] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(null);

  const weekStart = useMemo(() => startOfWeek(currentWeek), [currentWeek]);
  const weekStartParam = useMemo(() => formatLocalYMD(weekStart), [weekStart]);
  const isAuthed = Boolean(localStorage.getItem('accessToken'));

  const slotFillPercent = useMemo(() => {
    if (!plan?.days?.length) return 0;
    const filled = plan.days.reduce((acc, d) => {
      const s = d.slots || {};
      return (
        acc + (s.breakfast ? 1 : 0) + (s.lunch ? 1 : 0) + (s.dinner ? 1 : 0)
      );
    }, 0);
    return Math.min(100, Math.round((filled / 21) * 100));
  }, [plan]);

  const loadWeek = useCallback(async () => {
    if (!isAuthed || !weekStartParam) return;
    setLoadingPlan(true);
    setLoadError('');
    try {
      const res = await getWeekPlan({
        weekStart: weekStartParam,
        createIfMissing: true,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Failed to load meal plan');
      }
      setPlan(res.data?.plan ?? null);
    } catch (e) {
      setLoadError(apiErrorMessage(e));
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  }, [isAuthed, weekStartParam]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const handleGeneratePlan = async () => {
    if (!isAuthed || !weekStartParam || generating) return;
    setGenerating(true);
    setStatus({ type: 'loading', message: 'Building your week from fridge & recipes…' });
    setLoadError('');
    try {
      const res = await generateWeekPlan({
        weekStart: weekStartParam,
        replace: true,
        useFridge: true,
        fillEmptyOnly: true,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Could not generate meal plan');
      }
      setPlan(res.data?.plan ?? null);
      setStatus({
        type: 'success',
        message: res.message || 'Weekly meal plan ready.',
      });
      setTimeout(() => setStatus(null), 5000);
    } catch (e) {
      setLoadError(apiErrorMessage(e));
      setStatus(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-20">
      <header className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tight text-brand-dark">
            Meal Planner
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-brand-khaki">
            Weekly plan generated from your kitchen — adjust the week anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-2xl border border-black/5 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrentWeek((prev) => addDays(prev, -7))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-brand-green transition-colors hover:bg-[#f4f4f3]"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 px-6 py-2 text-sm font-black uppercase italic tracking-widest text-brand-dark">
              <CalendarIcon className="h-4 w-4 text-brand-brown" />
              {formatWeekRange(currentWeek)}
            </div>
            <button
              type="button"
              onClick={() => setCurrentWeek((prev) => addDays(prev, 7))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-brand-green transition-colors hover:bg-[#f4f4f3]"
              aria-label="Next week"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={!isAuthed || generating}
            className="group inline-flex h-14 items-center rounded-2xl border-none bg-brand-dark px-8 font-black uppercase italic text-white shadow-2xl shadow-black/10 transition-all hover:bg-brand-green disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin text-brand-khaki" />
            ) : (
              <Sparkles className="mr-3 h-5 w-5 text-brand-khaki group-hover:animate-pulse" />
            )}
            Auto-generate week
          </button>
        </div>
      </header>

      {!isAuthed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Link
            to="/signin"
            className="font-semibold text-brand-green underline hover:no-underline"
          >
            Sign in
          </Link>{' '}
          to load and generate your meal plan.
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </div>
      )}

      {status && (
        <div
          className={clsx(
            'inline-flex items-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em]',
            status.type === 'loading'
              ? 'border border-black/5 bg-white text-brand-dark shadow-sm'
              : 'bg-brand-green text-white shadow-lg shadow-black/10',
          )}
        >
          {status.message}
        </div>
      )}

      {loadingPlan && isAuthed && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-7">
        {DAYS.map((day, idx) => {
          const dayDate = addDays(weekStart, idx);
          const slots = findDaySlots(plan, weekStart, idx);
          return (
            <div key={day} className="space-y-6">
              <div className="group relative overflow-hidden rounded-[2rem] border border-black/5 bg-white py-5 shadow-sm transition-all duration-500 hover:shadow-lg">
                <div
                  className={clsx(
                    'absolute left-0 top-0 h-1.5 w-full',
                    idx < 3 ? 'bg-brand-green' : 'bg-brand-khaki/30',
                  )}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-khaki">
                  {day}
                </span>
                <p className="mt-1 text-2xl font-black italic leading-none text-brand-dark">
                  {dayDate.getDate()}
                </p>
              </div>

              <div className="space-y-6">
                {MEAL_TYPES.map((type) => {
                  const key = type.toLowerCase();
                  const slotData = slots?.[key] ?? null;
                  return (
                    <MealSlot
                      key={`${day}-${type}`}
                      type={type}
                      day={day}
                      slotData={slotData}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 pt-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="flex flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-sm">
          <header className="border-b border-black/5 bg-[#f4f4f3]/60 p-8 pb-6">
            <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-brand-khaki">
              <Flame className="h-4 w-4 text-brand-brown" />
              Nutrient summary
            </h3>
          </header>
          <div className="space-y-8 p-8">
            <p className="text-xs text-brand-dark/55">
              Totals will reflect your saved recipes when the dashboard adds macro
              rollups for the week.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[10px] font-black uppercase italic tracking-widest text-brand-dark">
                  Slots filled
                </span>
                <span className="text-lg font-black text-brand-green">
                  {slotFillPercent}%
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-[#f4f4f3] shadow-inner">
                <div
                  className="h-full rounded-full bg-brand-green shadow-lg"
                  style={{ width: `${slotFillPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2.5rem] border-none bg-brand-dark text-white shadow-2xl shadow-black/10 md:col-span-2 xl:col-span-2">
          <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-5 transition-transform duration-1000 group-hover:scale-125">
            <RefreshCw className="h-64 w-64" />
          </div>
          <header className="border-b border-white/5 p-8">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-brand-khaki">
                <Zap className="h-4 w-4 text-brand-brown" />
                Kitchen efficiency
              </h3>
              <div className="rounded-lg bg-brand-green px-3 py-1 text-[9px] font-black uppercase italic tracking-widest text-white">
                Fridge-aware
              </div>
            </div>
          </header>
          <div className="flex flex-col items-center gap-10 p-10 xl:flex-row xl:text-left">
            <div className="flex h-24 w-24 flex-shrink-0 rotate-3 items-center justify-center rounded-[2rem] bg-brand-green shadow-2xl shadow-brand-green/30 transition-transform duration-500 group-hover:rotate-0">
              <RefreshCw className="h-12 w-12 text-white/60" />
            </div>
            <div className="max-w-lg space-y-6 text-center xl:text-left">
              <h4 className="text-3xl font-black uppercase italic leading-tight tracking-tighter">
                One tap fills your week
              </h4>
              <p className="text-sm font-medium leading-relaxed text-white/45">
                Auto-generate pulls from your fridge preferences (substitutions on/off)
                and your recipe pool. Open{' '}
                <Link to="/recipes" className="font-semibold text-brand-khaki underline">
                  Recipes
                </Link>{' '}
                to see what you can cook first.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MealSlot = ({ type, day, slotData }) => {
  const meal = slotData
    ? {
        title: slotData.title || 'Recipe',
        img: slotData.image_url || FALLBACK_IMAGE,
        time: slotData.prep_minutes
          ? `${Number(slotData.prep_minutes)} min`
          : '—',
      }
    : null;

  return (
    <div className="group relative">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-brand-khaki">
          {type}
        </span>
        {meal && (
          <div className="h-2 w-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(86,114,87,0.5)]" />
        )}
      </div>

      {meal ? (
        <div className="relative cursor-pointer rounded-[2rem] border-none bg-white p-4 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/10">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-inner">
              <ImageWithFallback
                src={meal.img}
                alt={`${meal.title} for ${day} ${type}`}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase italic leading-tight tracking-tight text-brand-dark">
                {meal.title}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-khaki">
                <Clock className="h-3 w-3 text-brand-brown" /> {meal.time}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-brand-dark opacity-0 shadow-xl backdrop-blur-md transition-all duration-300 hover:text-brand-green group-hover:opacity-100"
            aria-label={`Meal options for ${type} on ${day}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="group relative flex h-[180px] w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-brand-khaki/30 bg-[#f4f4f3]/60 text-brand-khaki transition-all duration-500 hover:border-brand-green/50 hover:bg-brand-green/5 hover:text-brand-green"
          aria-label={`Empty ${type} for ${day}`}
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-500 group-hover:rotate-12 group-hover:shadow-lg">
              <Plus className="h-6 w-6" />
            </div>
            <span className="mt-4 text-[10px] font-black uppercase italic tracking-[0.2em]">
              Empty slot
            </span>
          </div>
          <Utensils className="absolute inset-0 -rotate-12 p-8 opacity-0 transition-all duration-700 group-hover:rotate-0 group-hover:opacity-[0.03]" />
        </button>
      )}
    </div>
  );
};

export default MealPlan;
