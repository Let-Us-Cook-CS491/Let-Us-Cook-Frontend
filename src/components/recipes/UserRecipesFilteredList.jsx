import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { fetchUserRecipeLibrary } from '../../services/userRecipesService';
import { filterUserRecipes } from '../../utils/filterUserRecipes';

const labelStyle =
  'text-[11px] font-bold uppercase italic tracking-[0.14em] text-[#a0a0a0]';

const headingStyle =
  'text-base font-bold uppercase italic tracking-wide text-[#231F20]';

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') {
    if (error.trim().startsWith('<!')) return 'Could not load your recipe library.';
    return error;
  }
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Something went wrong. Please try again.';
};

const UserRecipesFilteredList = ({ filter, disabled }) => {
  const [allRecipes, setAllRecipes] = useState([]);
  const [source, setSource] = useState('');
  const [loadState, setLoadState] = useState({ loading: true, error: '' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadState({ loading: true, error: '' });
      try {
        const { recipes, source: src } = await fetchUserRecipeLibrary();
        if (cancelled) return;
        setAllRecipes(recipes);
        setSource(src);
        setLoadState({ loading: false, error: '' });
      } catch (e) {
        if (cancelled) return;
        setLoadState({ loading: false, error: getErrorMessage(e) });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => filterUserRecipes(allRecipes, filter), [allRecipes, filter]);

  const hasFilter =
    (filter?.cuisines?.length ?? 0) > 0 || (filter?.meal_types?.length ?? 0) > 0;

  if (loadState.loading) {
    return (
      <section className="rounded-[28px] border border-black/[0.06] bg-white px-5 py-6 md:px-6">
        <h3 className={`${headingStyle} text-sm md:text-base`}>Your recipes</h3>
        <div className="mt-4 flex items-center gap-3 text-[11px] font-medium uppercase italic tracking-wide text-[#a0a0a0]">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green border-t-transparent"
            aria-hidden
          />
          Loading your recipes…
        </div>
      </section>
    );
  }

  if (loadState.error) {
    return (
      <section className="rounded-[28px] border border-black/[0.06] bg-white px-5 py-6 md:px-6">
        <h3 className={`${headingStyle} text-sm md:text-base`}>Your recipes</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadState.error}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-full bg-[#231F20] px-5 py-2 text-[11px] font-bold uppercase italic text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-black/[0.06] bg-white px-5 py-6 md:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`${headingStyle} text-sm md:text-base`}>Your recipes</h3>
        <span className="text-[10px] font-medium uppercase italic tracking-wide text-[#a0a0a0]">
          {filtered.length} of {allRecipes.length} shown
        </span>
      </div>
      <p className={`mt-2 max-w-2xl ${labelStyle} normal-case not-italic`}>
        Narrow your saved list with <strong className="font-semibold text-brand-dark/80">Categories</strong> above
        (cuisine + breakfast, lunch, dinner, snack). Recipes must match each active dimension: any selected cuisine and
        any selected meal type.
      </p>
      {source === 'demo' && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-950">
          Showing sample recipes until <code className="rounded bg-amber-100/80 px-1">GET /api/recipes/my</code> is
          available. Replace with your library via API or local storage.
        </p>
      )}

      {!hasFilter ? (
        <p className="mt-4 text-sm text-brand-dark/60">
          Choose a cuisine and/or a meal type to filter this list. With nothing selected, all{' '}
          {allRecipes.length} saved recipes are shown.
        </p>
      ) : (
        <p className="mt-4 text-[10px] font-medium uppercase italic tracking-wide text-[#a0a0a0]">
          Active filter ·{' '}
          {filter.cuisines?.length ? filter.cuisines.join(', ') : 'Any cuisine'}
          {' · '}
          {filter.meal_types?.length ? filter.meal_types.join(', ') : 'Any meal'}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-4 py-6 text-center text-sm text-brand-dark/60">
          No recipes match these categories. Try clearing a cuisine or meal type.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((r) => (
            <li
              key={r.id}
              className={clsx(
                'rounded-2xl border border-black/[0.06] px-4 py-3',
                disabled ? 'bg-[#F7F7F2]/50' : 'bg-[#F7F7F2]/90',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-brand-dark">{r.title}</span>
                {r.cuisine ? (
                  <span className="rounded-full bg-brand-green/15 px-2.5 py-0.5 text-[10px] font-bold uppercase italic text-brand-green">
                    {r.cuisine}
                  </span>
                ) : null}
              </div>
              {Array.isArray(r.meal_types) && r.meal_types.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.meal_types.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-brand-dark/10 px-2 py-0.5 text-[10px] font-bold uppercase italic text-brand-dark/80"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {r.description ? (
                <p className="mt-2 text-xs leading-relaxed text-brand-dark/65">{r.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default UserRecipesFilteredList;
