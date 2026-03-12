import React from 'react';

const Recipes = () => {
  return (
    <div className="h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 h-full">
        <h2 className="text-lg font-semibold text-brand-dark">Recipes</h2>
        <p className="mt-1 text-sm text-brand-dark/60">
          Discover meals you can cook with what you have.
        </p>

        <div className="mt-4 h-[1px] bg-black/5" />

        <div className="mt-6 text-sm text-brand-dark/50">
          Recipe discovery coming soon…
        </div>
      </div>
    </div>
  );
};

export default Recipes;

