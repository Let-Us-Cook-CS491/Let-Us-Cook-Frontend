import React from 'react';

const MealPlan = () => {
  return (
    <div className="h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 h-full">
        <h2 className="text-lg font-semibold text-brand-dark">Meal Plan</h2>
        <p className="mt-1 text-sm text-brand-dark/60">
          Plan your week of meals with ease.
        </p>

        <div className="mt-4 h-[1px] bg-black/5" />

        <div className="mt-6 text-sm text-brand-dark/50">
          Meal planning tools coming soon…
        </div>
      </div>
    </div>
  );
};

export default MealPlan;

