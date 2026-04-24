import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getWeekPlan,
  generateWeekPlan,
  patchWeekSlot,
} from '../services/mealPlanService';
import { markRecipeAsCooked } from '../services/recipeSuggestService';

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

function formatLocalYMD(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** e.g. "Feb 16 - 22" or "Jan 30 - Feb 5" */
function formatWeekRangeShort(anchorDate) {
  const start = startOfWeek(anchorDate);
  const end = addDays(start, 6);
  const mon = (d) =>
    new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${mon(start)} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${mon(start)} ${start.getDate()} - ${mon(end)} ${end.getDate()}`;
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

/** Backend expects a number; MealDB ids are numeric strings; Mongo ObjectIds are not — use 0. */
function numericRecipeIdForMarkCooked(slotData) {
  if (!slotData || typeof slotData !== 'object') return 0;
  if (slotData.source === 'mealdb' && slotData.idMeal != null) {
    const digits = String(slotData.idMeal).replace(/\D/g, '');
    const n = digits ? Number(digits) : Number(slotData.idMeal);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  if (slotData.recipe_id != null) {
    const n = Number(slotData.recipe_id);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
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
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [plan, setPlan] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generating, setGenerating] = useState(false);

  const weekStart = useMemo(() => startOfWeek(currentWeek), [currentWeek]);
  const weekStartParam = useMemo(() => formatLocalYMD(weekStart), [weekStart]);
  const isAuthed = Boolean(localStorage.getItem('accessToken'));

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

  const handleGeneratePlan = () => {
    if (!isAuthed || !weekStartParam || generating) return;
    setGenerating(true);
    setLoadError('');
    const p = (async () => {
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
      return res;
    })();
    toast.promise(p, {
      loading: 'Building your week from fridge & recipes…',
      success: (r) => r?.message || 'Weekly meal plan ready.',
      error: (e) => apiErrorMessage(e),
    });
    p.finally(() => setGenerating(false));
  };

  const handleClearSlot = async (dateYmd, slotKey) => {
    try {
      const res = await patchWeekSlot({
        weekStart: weekStartParam,
        date: dateYmd,
        slot: slotKey,
        slotData: null,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Could not clear slot');
      }
      setPlan(res.data?.plan ?? null);
      toast.success('Meal removed from your plan');
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const handleMarkAsCooked = useCallback(
    async (slotData) => {
      if (!slotData || !isAuthed) return;
      const recipe_id = numericRecipeIdForMarkCooked(slotData);
      try {
        const res = await markRecipeAsCooked(recipe_id);
        if (res?.status !== 'OK') {
          throw new Error(res?.message || 'Could not mark as cooked');
        }
        toast.success('Counted as a meal cooked.');
      } catch (e) {
        toast.error(apiErrorMessage(e));
      }
    },
    [isAuthed],
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-20">
      <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tight text-brand-dark">
            Meal Planner
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-khaki">
            Plan your week ahead
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
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
              {formatWeekRangeShort(currentWeek)}
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
            Auto-Generate
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

      {loadingPlan && isAuthed && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
        </div>
      )}

      <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-lg">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-[#f4f4f3]">
          {DAYS.map((day, idx) => {
            const dayDate = addDays(weekStart, idx);
            return (
              <div
                key={day}
                className="border-r border-slate-200 p-6 text-center last:border-r-0"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-khaki">
                  {day}
                </p>
                <p className="mt-1 text-3xl font-black italic leading-none text-brand-dark">
                  {dayDate.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {MEAL_TYPES.map((mealType, mealIdx) => (
          <div
            key={mealType}
            className={clsx(
              'grid grid-cols-7',
              mealIdx !== MEAL_TYPES.length - 1 && 'border-b border-slate-100',
            )}
          >
            {DAYS.map((day, dayIdx) => {
              const key = mealType.toLowerCase();
              const slots = findDaySlots(plan, weekStart, dayIdx);
              const slotData = slots?.[key] ?? null;
              const dateYmd = formatLocalYMD(addDays(weekStart, dayIdx));
              return (
                <div
                  key={`${day}-${mealType}`}
                  className="border-r border-slate-100 p-4 last:border-r-0"
                >
                  <MealSlot
                    type={mealType}
                    day={day}
                    slotData={slotData}
                    isAuthed={isAuthed}
                    onAdd={() => navigate('/recipes')}
                    onClear={() => handleClearSlot(dateYmd, key)}
                    onMarkAsCooked={() => handleMarkAsCooked(slotData)}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

function mealTypeIcon(type) {
  if (type === 'Breakfast') {
    return <Sunrise className="h-5 w-5 text-brand-brown" strokeWidth={2} />;
  }
  if (type === 'Lunch') {
    return <Sun className="h-5 w-5 text-brand-brown" strokeWidth={2} />;
  }
  return <Moon className="h-5 w-5 text-brand-brown" strokeWidth={2} />;
}

function MealSlot({ type, day, slotData, isAuthed, onAdd, onClear, onMarkAsCooked }) {
  const meal = slotData
    ? {
        title: slotData.title || 'Recipe',
        img: slotData.image_url || FALLBACK_IMAGE,
        time: slotData.prep_minutes
          ? `${Number(slotData.prep_minutes)}`
          : null,
      }
    : null;

  return (
    <div className="group relative min-h-[200px]">
      <div className="mb-3 flex items-center gap-2">
        {mealTypeIcon(type)}
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-khaki">
          {type}
        </span>
      </div>

      {meal ? (
        <div className="relative cursor-pointer rounded-2xl border border-transparent bg-[#f4f4f3]/40 p-3 transition-all duration-300 hover:border-brand-green/20 hover:bg-white hover:shadow-lg">
          <div className="space-y-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
              <ImageWithFallback
                src={meal.img}
                alt={`${meal.title} for ${day} ${type}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 px-1">
              <p className="line-clamp-2 text-xs font-black uppercase italic leading-tight tracking-tight text-brand-dark">
                {meal.title}
              </p>
              {meal.time != null && (
                <div className="mt-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-brand-khaki">
                  <Clock className="h-3 w-3 text-brand-brown" />
                  {meal.time} min
                </div>
              )}
              {isAuthed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsCooked();
                  }}
                  className="mt-3 w-full rounded-lg border border-brand-green/35 bg-brand-green/8 py-2 text-[8px] font-black uppercase tracking-widest text-brand-green transition-colors hover:bg-brand-green/15"
                >
                  Mark as cooked
                </button>
              )}
            </div>
          </div>
          {isAuthed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-brand-dark opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              aria-label="Remove meal from slot"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!isAuthed) return;
            onAdd();
          }}
          disabled={!isAuthed}
          className="group/add flex h-[160px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-khaki/25 bg-transparent text-brand-khaki transition-all duration-300 hover:border-brand-green/40 hover:bg-brand-green/5 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Add meal for ${day} ${type}`}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/50 transition-all duration-300 group-hover/add:bg-brand-green group-hover/add:text-white">
            <Plus className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.15em]">
            Add meal
          </span>
        </button>
      )}
    </div>
  );
}

export default MealPlan;
