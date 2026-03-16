import React from 'react';

const EXPIRING_SOON_DAYS = 3;

const ingredients = [
  {
    name: 'Baby spinach',
    quantity: '1 bag',
    location: 'Crisper drawer',
    category: 'Produce',
    expiresOn: '2026-03-13',
  },
  {
    name: 'Chicken breast',
    quantity: '2 lb',
    location: 'Bottom shelf',
    category: 'Protein',
    expiresOn: '2026-03-12',
  },
  {
    name: 'Greek yogurt',
    quantity: '500 g',
    location: 'Top shelf',
    category: 'Dairy',
    expiresOn: '2026-03-15',
  },
  {
    name: 'Cherry tomatoes',
    quantity: '1 pint',
    location: 'Crisper drawer',
    category: 'Produce',
    expiresOn: '2026-03-18',
  },
  {
    name: 'Pesto',
    quantity: '1 jar',
    location: 'Door',
    category: 'Condiments',
    expiresOn: '2026-03-20',
  },
];

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysUntil = (dateString) => {
  const today = startOfToday();
  const target = new Date(dateString);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const MyFridge = () => {
  const expiringSoon = ingredients.filter(
    (item) => {
      const daysLeft = daysUntil(item.expiresOn);
      return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
    }
  );
  const sortedIngredients = [...ingredients].sort(
    (a, b) => daysUntil(a.expiresOn) - daysUntil(b.expiresOn)
  );

  return (
    <div className="h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 h-full flex flex-col">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-dark">My Fridge</h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Track expiration dates and keep your ingredients in rotation.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-brand-dark/50">
              Expiring Soon Window
            </div>
            <div className="mt-1 text-sm font-semibold text-brand-dark">
              {EXPIRING_SOON_DAYS} days
            </div>
          </div>
        </div>

        <div className="mt-5 h-[1px] bg-black/5" />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/5 bg-[#F7F7F2] px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-brand-dark/50">
              Total items
            </div>
            <div className="mt-2 text-2xl font-semibold text-brand-dark">
              {ingredients.length}
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-red-700/80">
              Expiring soon
            </div>
            <div className="mt-2 text-2xl font-semibold text-red-700">
              {expiringSoon.length}
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-brand-dark/50">
              Fresh items
            </div>
            <div className="mt-2 text-2xl font-semibold text-brand-dark">
              {Math.max(ingredients.length - expiringSoon.length, 0)}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {sortedIngredients.map((item) => {
            const daysLeft = daysUntil(item.expiresOn);
            const isExpiringSoon =
              daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
            const safeDaysLeft = Math.max(daysLeft, 0);
            const daysLabel = `${safeDaysLeft} day${
              safeDaysLeft === 1 ? '' : 's'
            } left`;

            return (
              <div
                key={`${item.name}-${item.expiresOn}`}
                className={[
                  'rounded-2xl border px-4 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                  isExpiringSoon
                    ? 'border-red-200 bg-red-50'
                    : 'border-black/5 bg-white',
                ].join(' ')}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-sm font-semibold text-brand-dark">
                      {item.name}
                    </h3>
                    <span className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs text-brand-dark/70">
                      {item.category}
                    </span>
                    <span className="text-xs text-brand-dark/50">
                      {item.location}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-brand-dark/60">
                    {item.quantity} • Expires {formatDate(item.expiresOn)}
                  </div>
                </div>
                <div className="text-right">
                  {isExpiringSoon ? (
                    <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Expiring soon
                    </div>
                  ) : (
                    <div className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-dark/80">
                      Fresh
                    </div>
                  )}
                  <div
                    className={[
                      'mt-2 text-xs font-semibold',
                      isExpiringSoon ? 'text-red-700' : 'text-brand-dark/70',
                    ].join(' ')}
                  >
                    {daysLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyFridge;
