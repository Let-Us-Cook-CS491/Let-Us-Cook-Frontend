import React from 'react';
import clsx from 'clsx';
import {
  AlarmClock,
  BellRing,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

const TODAY_REMINDERS = [
  {
    id: 1,
    meal: 'Breakfast',
    time: '7:30 AM',
    menu: 'Avocado toast + soft egg',
    prep: '10 min',
    status: 'done',
    note: 'Completed',
  },
  {
    id: 2,
    meal: 'Lunch',
    time: '12:45 PM',
    menu: 'Miso salmon bowl',
    prep: '25 min',
    status: 'next',
    note: 'In 2h 05m',
  },
  {
    id: 3,
    meal: 'Dinner',
    time: '7:00 PM',
    menu: 'Herb chicken + greens',
    prep: '35 min',
    status: 'upcoming',
    note: 'Evening',
  },
];

const WEEKLY_OVERVIEW = [
  { day: 'Mon', meals: 3, focus: 'Balanced' },
  { day: 'Tue', meals: 3, focus: 'High protein' },
  { day: 'Wed', meals: 2, focus: 'Light day' },
  { day: 'Thu', meals: 3, focus: 'Batch prep' },
  { day: 'Fri', meals: 3, focus: 'Fresh produce' },
  { day: 'Sat', meals: 2, focus: 'Family style' },
  { day: 'Sun', meals: 3, focus: 'Reset' },
];

const QUIET_HOURS = [
  { label: 'Start', value: '9:30 PM' },
  { label: 'End', value: '6:30 AM' },
];

const CHANNELS = [
  { label: 'Push', icon: BellRing, active: true },
  { label: 'Email', icon: Mail, active: true },
  { label: 'SMS', icon: Smartphone, active: false },
];

const TIME_WINDOWS = [
  { meal: 'Breakfast', window: '7:00 - 9:30 AM' },
  { meal: 'Lunch', window: '12:00 - 2:30 PM' },
  { meal: 'Dinner', window: '6:30 - 8:30 PM' },
  { meal: 'Snack', window: '3:30 - 4:30 PM' },
];

const MealReminders = () => {
  const nextReminder = TODAY_REMINDERS.find((item) => item.status === 'next');

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-brand-dark italic uppercase">
            Meal Reminders
          </h1>
          <p className="text-brand-khaki mt-1 font-bold uppercase text-xs tracking-[0.25em]">
            Stay on time with your personalized meal rhythm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="bg-white border border-black/5 h-12 px-5 rounded-2xl font-black uppercase italic text-xs tracking-widest text-brand-dark shadow-sm hover:shadow-lg transition-all inline-flex items-center gap-3"
          >
            <Calendar className="w-4 h-4 text-brand-brown" />
            Sync Calendar
          </button>
          <button
            type="button"
            className="bg-brand-dark hover:bg-brand-green text-white border-none shadow-2xl shadow-black/10 h-12 px-6 rounded-2xl font-black uppercase italic transition-all group inline-flex items-center"
          >
            <Sparkles className="w-4 h-4 mr-3 group-hover:animate-pulse text-brand-khaki" />
            New Reminder
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-khaki">
            Reminders Today
          </p>
          <p className="text-3xl font-black text-brand-dark italic">3</p>
          <p className="text-sm text-brand-dark/60">
            You have one upcoming reminder in the next 3 hours.
          </p>
        </div>
        <div className="bg-brand-dark rounded-[2rem] shadow-2xl shadow-black/10 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/20 rounded-full blur-2xl" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-khaki">
            Next Up
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-black italic uppercase">
                {nextReminder?.meal}
              </p>
              <p className="text-sm text-white/60">{nextReminder?.menu}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black">{nextReminder?.time}</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-brand-khaki">
                {nextReminder?.note}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-black text-brand-khaki"
          >
            View Meal Details
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-khaki">
                Streak
              </p>
              <p className="text-3xl font-black text-brand-dark italic">6 days</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-brand-dark/60">
            You&apos;ve hit every reminder since Tuesday. Keep the rhythm going!
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-8 space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-brand-khaki flex items-center gap-3">
                <AlarmClock className="w-4 h-4 text-brand-brown" />
                Today&apos;s Timeline
              </h2>
              <p className="text-sm text-brand-dark/60 mt-2">
                Reminders are optimized for prep time and travel buffer.
              </p>
            </div>
            <button
              type="button"
              className="bg-[#f4f4f3] hover:bg-brand-green/10 text-brand-dark text-xs uppercase tracking-[0.2em] font-black px-4 py-2 rounded-xl"
            >
              Adjust Times
            </button>
          </header>

          <div className="space-y-4">
            {TODAY_REMINDERS.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  'rounded-[1.8rem] border border-black/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all',
                  item.status === 'next'
                    ? 'bg-brand-green/10 shadow-lg shadow-brand-green/20 border-brand-green/30'
                    : 'bg-[#f9f9f4] hover:shadow-md'
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-2xl flex items-center justify-center',
                      item.status === 'done'
                        ? 'bg-brand-green text-white'
                        : item.status === 'next'
                        ? 'bg-brand-dark text-brand-khaki'
                        : 'bg-white text-brand-dark'
                    )}
                  >
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] font-black text-brand-khaki">
                      {item.meal}
                    </p>
                    <p className="text-lg font-black text-brand-dark italic uppercase">
                      {item.menu}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] font-black text-brand-khaki mt-2">
                      <Clock className="w-3 h-3 text-brand-brown" />
                      Prep {item.prep}
                      <span className="w-1 h-1 rounded-full bg-brand-khaki" />
                      {item.note}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <p className="text-lg font-black text-brand-dark">{item.time}</p>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-brand-khaki">
                      Reminder
                    </p>
                  </div>
                  <button
                    type="button"
                    className={clsx(
                      'h-10 px-4 rounded-xl text-[10px] uppercase tracking-[0.3em] font-black transition-all',
                      item.status === 'done'
                        ? 'bg-brand-green text-white'
                        : 'bg-brand-dark text-brand-khaki hover:bg-brand-green hover:text-white'
                    )}
                  >
                    {item.status === 'done' ? 'Done' : 'Snooze 10m'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-khaki flex items-center gap-2">
                <BellRing className="w-4 h-4 text-brand-brown" />
                Reminder Channels
              </h3>
              <p className="text-sm text-brand-dark/60 mt-2">
                Deliver reminders the way you&apos;ll notice fastest.
              </p>
            </div>
            <div className="grid gap-3">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.label}
                    type="button"
                    className={clsx(
                      'flex items-center justify-between rounded-2xl px-4 py-3 border text-sm font-semibold transition-all',
                      channel.active
                        ? 'bg-brand-green/10 border-brand-green/30 text-brand-dark'
                        : 'bg-[#f4f4f3] border-transparent text-brand-dark/60 hover:text-brand-dark'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-brand-brown" />
                      {channel.label}
                    </span>
                    <span
                      className={clsx(
                        'w-10 h-6 rounded-full flex items-center px-1 transition-all',
                        channel.active ? 'bg-brand-green' : 'bg-brand-beige'
                      )}
                    >
                      <span
                        className={clsx(
                          'w-4 h-4 rounded-full bg-white shadow transition-all',
                          channel.active ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-khaki flex items-center gap-2">
              <AlarmClock className="w-4 h-4 text-brand-brown" />
              Time Windows
            </h3>
            <div className="space-y-3">
              {TIME_WINDOWS.map((entry) => (
                <div
                  key={entry.meal}
                  className="flex items-center justify-between rounded-2xl bg-[#f4f4f3] px-4 py-3"
                >
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark">
                    {entry.meal}
                  </span>
                  <span className="text-xs text-brand-dark/60">
                    {entry.window}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-brand-dark text-white rounded-[2.5rem] shadow-2xl shadow-black/10 p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-khaki">
              Quiet Hours
            </h3>
            <p className="text-sm text-white/60">
              We&apos;ll hold all reminders during this window.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {QUIET_HOURS.map((entry) => (
                <div
                  key={entry.label}
                  className="rounded-2xl bg-white/10 px-4 py-3"
                >
                  <p className="text-[10px] uppercase tracking-[0.3em] text-brand-khaki">
                    {entry.label}
                  </p>
                  <p className="text-lg font-black">{entry.value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full h-11 bg-brand-brown hover:bg-white hover:text-brand-dark text-white rounded-xl font-black italic uppercase text-xs tracking-[0.2em] transition-all"
            >
              Edit Quiet Hours
            </button>
          </section>
        </aside>
      </div>

      <section className="bg-white rounded-[2.5rem] shadow-sm border border-black/5 p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-brand-khaki">
              Weekly Overview
            </h2>
            <p className="text-sm text-brand-dark/60 mt-2">
              Planned reminders for the next seven days.
            </p>
          </div>
          <button
            type="button"
            className="text-xs uppercase tracking-[0.2em] font-black text-brand-dark inline-flex items-center gap-2"
          >
            Manage Schedule
            <ChevronRight className="w-4 h-4" />
          </button>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WEEKLY_OVERVIEW.map((entry, index) => (
            <div
              key={entry.day}
              className={clsx(
                'rounded-2xl border border-black/5 p-4 space-y-3',
                index === 0
                  ? 'bg-brand-green/10 border-brand-green/30 shadow-md'
                  : 'bg-[#f9f9f4] hover:shadow-md transition-all'
              )}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] font-black text-brand-khaki">
                {entry.day}
              </p>
              <p className="text-2xl font-black text-brand-dark italic">
                {entry.meals} meals
              </p>
              <p className="text-xs text-brand-dark/60">{entry.focus}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MealReminders;
