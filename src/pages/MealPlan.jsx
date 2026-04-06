import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  MoreVertical,
  Plus,
  RefreshCw,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react';

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
    date
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

const ImageWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
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
  const [status, setStatus] = useState(null);
  const timeoutsRef = useRef([]);
  const weekStart = useMemo(() => startOfWeek(currentWeek), [currentWeek]);

  const clearTimers = () => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const handleGeneratePlan = () => {
    clearTimers();
    setStatus({
      type: 'loading',
      message: 'AI is analyzing your kitchen and habits...',
    });

    const successTimer = setTimeout(() => {
      setStatus({
        type: 'success',
        message: 'Weekly meal plan generated and optimized!',
      });
    }, 2000);

    const clearTimer = setTimeout(() => {
      setStatus(null);
    }, 6000);

    timeoutsRef.current.push(successTimer, clearTimer);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-brand-dark italic uppercase">
            Meal Planner
          </h1>
          <p className="text-brand-khaki mt-1 font-bold uppercase text-xs tracking-[0.25em]">
            Schedule your meals and optimize your kitchen output.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-black/5">
            <button
              type="button"
              onClick={() => setCurrentWeek((prev) => addDays(prev, -7))}
              className="h-10 w-10 rounded-xl hover:bg-[#f4f4f3] text-brand-green inline-flex items-center justify-center transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 px-6 py-2 text-sm font-black text-brand-dark uppercase tracking-widest italic">
              <CalendarIcon className="w-4 h-4 text-brand-brown" />
              {formatWeekRange(currentWeek)}
            </div>
            <button
              type="button"
              onClick={() => setCurrentWeek((prev) => addDays(prev, 7))}
              className="h-10 w-10 rounded-xl hover:bg-[#f4f4f3] text-brand-green inline-flex items-center justify-center transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            className="bg-brand-dark hover:bg-brand-green text-white border-none shadow-2xl shadow-black/10 h-14 px-8 rounded-2xl font-black uppercase italic transition-all group inline-flex items-center"
          >
            <Sparkles className="w-5 h-5 mr-3 group-hover:animate-pulse text-brand-khaki" />
            Auto-Generate
          </button>
        </div>
      </header>

      {status && (
        <div
          className={clsx(
            'inline-flex items-center px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.2em] font-black',
            status.type === 'loading'
              ? 'bg-white text-brand-dark shadow-sm border border-black/5'
              : 'bg-brand-green text-white shadow-lg shadow-black/10'
          )}
        >
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-6">
        {DAYS.map((day, idx) => {
          const dayDate = addDays(weekStart, idx);
          return (
            <div key={day} className="space-y-6">
              <div className="flex flex-col items-center py-5 bg-white border border-black/5 rounded-[2rem] shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-500">
                <div
                  className={clsx(
                    'absolute top-0 left-0 w-full h-1.5',
                    idx < 3 ? 'bg-brand-green' : 'bg-brand-khaki/30'
                  )}
                />
                <span className="text-[10px] font-black text-brand-khaki uppercase tracking-[0.3em]">
                  {day}
                </span>
                <p className="text-2xl font-black text-brand-dark mt-1 italic leading-none">
                  {dayDate.getDate()}
                </p>
              </div>

              <div className="space-y-6">
                {MEAL_TYPES.map((type) => (
                  <MealSlot key={`${day}-${type}`} type={type} day={day} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6">
        <section className="border-none rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col bg-white">
          <header className="bg-[#f4f4f3]/60 border-b border-black/5 p-8 pb-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-khaki flex items-center gap-3">
              <Flame className="w-4 h-4 text-brand-brown" />
              Nutrient Summary
            </h3>
          </header>
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-black text-brand-dark uppercase italic tracking-widest text-[10px]">
                  Weekly Progress
                </span>
                <span className="font-black text-brand-green text-lg">85%</span>
              </div>
              <div className="w-full h-4 bg-[#f4f4f3] rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-brand-green rounded-full shadow-lg"
                  style={{ width: '85%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Carbs', value: '1,240g' },
                { label: 'Prot', value: '640g' },
                { label: 'Fats', value: '320g' },
              ].map((macro) => (
                <div
                  key={macro.label}
                  className="text-center p-4 rounded-2xl bg-[#f4f4f3] group hover:bg-brand-green hover:text-white transition-all duration-300"
                >
                  <p className="text-[9px] text-brand-khaki font-black uppercase tracking-widest group-hover:text-white/70">
                    {macro.label}
                  </p>
                  <p className="text-sm font-black mt-1 italic tracking-tight">
                    {macro.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="md:col-span-2 rounded-[2.5rem] shadow-2xl shadow-black/10 border-none bg-brand-dark text-white relative group overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
            <RefreshCw className="w-64 h-64" />
          </div>
          <header className="p-8 border-b border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-khaki flex items-center gap-3">
                <Zap className="w-4 h-4 text-brand-brown" />
                Kitchen Efficiency
              </h3>
              <div className="px-3 py-1 bg-brand-green text-white rounded-lg text-[9px] font-black tracking-widest uppercase italic">
                Optimized
              </div>
            </div>
          </header>
          <div className="p-10 flex flex-col xl:flex-row items-center gap-10">
            <div className="w-24 h-24 rounded-[2rem] bg-brand-green flex items-center justify-center flex-shrink-0 shadow-2xl shadow-brand-green/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <RefreshCw className="w-12 h-12 text-white/60" />
            </div>
            <div className="space-y-6 text-center xl:text-left">
              <h4 className="text-3xl font-black uppercase italic leading-tight tracking-tighter">
                Save 1 hour of prep this week
              </h4>
              <p className="text-white/45 text-sm leading-relaxed max-w-lg font-medium">
                We&apos;ve optimized your plan to reuse core ingredients. Prep
                your <b>Chicken Breast</b> and <b>Spinach</b> once on Sunday
                evening to eliminate redundant chopping and clean-up.
              </p>
              <button
                type="button"
                className="bg-brand-brown hover:bg-white hover:text-brand-dark text-white rounded-xl font-black italic uppercase h-12 px-8 border-none transition-all shadow-xl shadow-black/20 group inline-flex items-center justify-center"
              >
                View Smart Prep Guide
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const MealSlot = ({ type, day }) => {
  const [meal] = useState(() => {
    if (Math.random() <= 0.3) {
      return null;
    }

    if (type === 'Breakfast') {
      return {
        title: 'Avocado & Egg',
        img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=200&h=200&fit=crop',
        time: '15 MIN',
      };
    }

    if (type === 'Lunch') {
      return {
        title: 'Grilled Chicken',
        img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200&h=200&fit=crop',
        time: '30 MIN',
      };
    }

    return {
      title: 'Salmon Fillet',
      img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=200&h=200&fit=crop',
      time: '20 MIN',
    };
  });

  return (
    <div className="group relative">
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-[10px] font-black text-brand-khaki uppercase tracking-[0.2em] italic">
          {type}
        </span>
        {meal && (
          <div className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(86,114,87,0.5)]" />
        )}
      </div>

      {meal ? (
        <div className="bg-white border-none rounded-[2rem] p-4 shadow-sm hover:shadow-2xl hover:shadow-brand-green/10 transition-all duration-500 cursor-pointer relative">
          <div className="flex flex-col gap-4">
            <div className="aspect-square w-full rounded-2xl overflow-hidden relative shadow-inner">
              <ImageWithFallback
                src={meal.img}
                alt={`${meal.title} for ${day} ${type}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-brand-dark truncate uppercase italic tracking-tight leading-tight">
                {meal.title}
              </p>
              <div className="flex items-center gap-2 text-[9px] text-brand-khaki font-black uppercase tracking-widest mt-1.5">
                <Clock className="w-3 h-3 text-brand-brown" /> {meal.time}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-brand-dark hover:text-brand-green shadow-xl transition-all duration-300"
            aria-label={`Meal options for ${type} on ${day}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="w-full h-[180px] bg-[#f4f4f3]/60 border-2 border-dashed border-brand-khaki/30 rounded-[2rem] flex flex-col items-center justify-center text-brand-khaki hover:border-brand-green/50 hover:bg-brand-green/5 hover:text-brand-green transition-all duration-500 group overflow-hidden relative"
          aria-label={`Add ${type} for ${day}`}
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center group-hover:shadow-lg transition-all duration-500 group-hover:rotate-12">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black mt-4 uppercase tracking-[0.2em] italic">
              Add Meal
            </span>
          </div>
          <Utensils className="absolute inset-0 w-full h-full p-8 opacity-0 group-hover:opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-all duration-700" />
        </button>
      )}
    </div>
  );
};

export default MealPlan;
