import React, { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2,
  RefreshCw,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  X,
  Wand2,
} from 'lucide-react';
import {
  suggestRecipesFromFridge,
  browseRecipes,
  getPersonalizedRecommendations,
} from '../services/recipeSuggestService';
import { setDietPreferences } from '../services/dietPreferencesService';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const BROWSE_PAGE = 20;

const AI_MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function apiErrorMessage(err) {
  if (!err) return 'Something went wrong.';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return 'Something went wrong.';
}

function isGeneratedRecipe(r) {
  return r && r.source === 'generated';
}

function formatApiStrategyShort(s) {
  if (s === 'generated') return 'AI generated';
  if (s === 'llm_first') return 'AI-ranked';
  if (s === 'deterministic_fallback') return 'Ranked (fallback)';
  return s || '';
}

function filtersSummaryLine(filters) {
  if (!filters || typeof filters !== 'object') return '';
  return [
    filters.cuisine,
    filters.mealType,
    filters.servings != null && `${filters.servings} people`,
    filters.maxMinutes != null && `≤${filters.maxMinutes} min`,
  ]
    .filter(Boolean)
    .join(' · ');
}

const Recipes = () => {
  const [activeTab, setActiveTab] = useState('suggested');

  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [suggestedMeta, setSuggestedMeta] = useState(null);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedError, setSuggestedError] = useState('');

  const [browseList, setBrowseList] = useState([]);
  const [browsePagination, setBrowsePagination] = useState(null);
  const [browseFilters, setBrowseFilters] = useState(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseNavLoading, setBrowseNavLoading] = useState(false);
  const [browseError, setBrowseError] = useState('');
  const [browseSearchInput, setBrowseSearchInput] = useState('');
  const [browseSearchDebounced, setBrowseSearchDebounced] = useState('');

  const [allowSubstitutions, setAllowSubstitutions] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  const [personalizedRecipes, setPersonalizedRecipes] = useState([]);
  const [personalizedMeta, setPersonalizedMeta] = useState(null);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [personalizedError, setPersonalizedError] = useState('');

  const [detailRecipe, setDetailRecipe] = useState(null);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiCuisine, setAiCuisine] = useState('');
  const [aiMealType, setAiMealType] = useState('dinner');
  const [aiServings, setAiServings] = useState('4');
  const [aiMaxMinutes, setAiMaxMinutes] = useState('45');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);

  const isAuthed = Boolean(localStorage.getItem('accessToken'));

  const loadSuggestions = useCallback(async () => {
    if (!isAuthed) {
      setSuggestedRecipes([]);
      setSuggestedMeta(null);
      return;
    }
    setSuggestedLoading(true);
    setSuggestedError('');
    try {
      const res = await suggestRecipesFromFridge({
        limit: 12,
        maxIngredients: 8,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Could not load suggestions');
      }
      const data = res.data || {};
      setSuggestedRecipes(Array.isArray(data.recipes) ? data.recipes : []);
      setAllowSubstitutions(data.allowSubstitutions === true);
      setSuggestedMeta({
        filteredByMissing: data.filteredByMissing === true,
        allowSubstitutions: data.allowSubstitutions === true,
        matchingHeuristicUsed: data.matchingHeuristicUsed === true,
        matchingDisclaimer: data.matchingDisclaimer || '',
        message: res.message || '',
      });
    } catch (e) {
      setSuggestedError(apiErrorMessage(e));
      setSuggestedRecipes([]);
      setSuggestedMeta(null);
    } finally {
      setSuggestedLoading(false);
    }
  }, [isAuthed]);

  const loadBrowseAtSkip = useCallback(async (skip, { isInitial = false, searchText = '' } = {}) => {
    if (!isAuthed) {
      setBrowseList([]);
      setBrowsePagination(null);
      setBrowseFilters(null);
      return;
    }
    if (isInitial) setBrowseLoading(true);
    else setBrowseNavLoading(true);
    setBrowseError('');
    try {
      const q = String(searchText || '').trim();
      const res = await browseRecipes({
        limit: BROWSE_PAGE,
        skip,
        sortBy: 'title',
        ...(q ? { searchText: q } : {}),
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Could not load recipes');
      }
      const data = res.data || {};
      const items = Array.isArray(data.recipes) ? data.recipes : [];
      const p = data.pagination || {};
      setBrowseList(items);
      setBrowsePagination(p);
      setBrowseFilters(data.filters || null);
    } catch (e) {
      setBrowseError(apiErrorMessage(e));
      setBrowseList([]);
      setBrowsePagination(null);
      setBrowseFilters(null);
    } finally {
      if (isInitial) setBrowseLoading(false);
      else setBrowseNavLoading(false);
    }
  }, [isAuthed]);

  const goBrowsePrev = useCallback(() => {
    if (!browsePagination || browseNavLoading || browseLoading) return;
    const lim = browsePagination.limit ?? BROWSE_PAGE;
    const newSkip = Math.max(0, (browsePagination.skip ?? 0) - lim);
    loadBrowseAtSkip(newSkip, { isInitial: false, searchText: browseSearchDebounced });
  }, [browsePagination, browseNavLoading, browseLoading, loadBrowseAtSkip, browseSearchDebounced]);

  const goBrowseNext = useCallback(() => {
    if (!browsePagination || browseNavLoading || browseLoading || !browsePagination.hasMore) return;
    const lim = browsePagination.limit ?? BROWSE_PAGE;
    const newSkip = (browsePagination.skip ?? 0) + lim;
    loadBrowseAtSkip(newSkip, { isInitial: false, searchText: browseSearchDebounced });
  }, [browsePagination, browseNavLoading, browseLoading, loadBrowseAtSkip, browseSearchDebounced]);

  const openAiModal = useCallback(() => {
    setAiError('');
    setAiResults(null);
    setAiMeta(null);
    setAiModalOpen(true);
  }, []);

  const runAiRecipeGenerate = useCallback(async () => {
    if (!isAuthed) return;
    const cuisine = aiCuisine.trim();
    if (!cuisine) {
      setAiError('Enter a cuisine or region (e.g. Italian).');
      return;
    }
    const servings = Number(aiServings);
    const maxMin = Number(aiMaxMinutes);
    if (!Number.isFinite(servings) || servings < 1 || servings > 20) {
      setAiError('Servings must be between 1 and 20.');
      return;
    }
    if (!Number.isFinite(maxMin) || maxMin < 5 || maxMin > 300) {
      setAiError('Max minutes must be between 5 and 300.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiResults(null);
    setAiMeta(null);
    try {
      const res = await getPersonalizedRecommendations({
        cuisine,
        mealType: aiMealType,
        servings,
        maxMinutes: maxMin,
        limit: 8,
        maxMissingIngredients: 6,
        includeReasons: true,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Could not generate recipes');
      }
      const data = res.data || {};
      const list = Array.isArray(data.recommendations) ? data.recommendations : [];
      setAiResults(list);
      setAiMeta({
        strategy: data.strategy || '',
        candidateCount: data.candidateCount ?? 0,
        aiRecipeRequest: data.aiRecipeRequest || null,
        filters: data.filters || null,
      });
    } catch (e) {
      setAiError(apiErrorMessage(e));
      setAiResults(null);
    } finally {
      setAiLoading(false);
    }
  }, [
    isAuthed,
    aiCuisine,
    aiMealType,
    aiServings,
    aiMaxMinutes,
  ]);

  useEffect(() => {
    if (!aiModalOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !aiLoading) setAiModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [aiModalOpen, aiLoading]);

  const loadPersonalized = useCallback(async () => {
    if (!isAuthed) return;
    setPersonalizedLoading(true);
    setPersonalizedError('');
    try {
      const res = await getPersonalizedRecommendations({
        limit: 8,
        maxMissingIngredients: 6,
        includeReasons: true,
      });
      if (res?.status !== 'OK') {
        throw new Error(res?.message || 'Could not load personalized recommendations');
      }
      const data = res.data || {};
      const list = Array.isArray(data.recommendations) ? data.recommendations : [];
      setPersonalizedRecipes(list);
      setPersonalizedMeta({
        strategy: data.strategy || '',
        candidateCount: data.candidateCount ?? 0,
        allowSubstitutions: data.allowSubstitutions === true,
        filteredByMissing: data.filteredByMissing === true,
        matchingHeuristicUsed: data.matchingHeuristicUsed === true,
        matchingDisclaimer: data.matchingDisclaimer || '',
        expandedInventoryNames: data.expandedInventoryNames,
        filters: data.filters || null,
      });
    } catch (e) {
      setPersonalizedError(apiErrorMessage(e));
      setPersonalizedRecipes([]);
      setPersonalizedMeta(null);
    } finally {
      setPersonalizedLoading(false);
    }
  }, [isAuthed]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    const t = setTimeout(() => setBrowseSearchDebounced(browseSearchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [browseSearchInput]);

  useEffect(() => {
    if (activeTab !== 'browse' || !isAuthed) return;
    loadBrowseAtSkip(0, { isInitial: true, searchText: browseSearchDebounced });
  }, [activeTab, isAuthed, browseSearchDebounced, loadBrowseAtSkip]);

  const handleRefresh = () => {
    if (activeTab === 'suggested') loadSuggestions();
    else loadBrowseAtSkip(0, { isInitial: true, searchText: browseSearchDebounced });
  };

  const refreshDisabled =
    !isAuthed ||
    (activeTab === 'suggested' && suggestedLoading) ||
    (activeTab === 'browse' && (browseLoading || browseNavLoading));

  const personalizedStrategyLabel = (() => {
    const s = personalizedMeta?.strategy;
    if (s === 'generated') return 'AI generated';
    if (s === 'llm_first') return 'AI-personalized';
    if (s === 'deterministic_fallback') return 'Ranked (smart fallback)';
    if (s === 'none') return '—';
    if (s === 'guardrail_filtered') return 'Filtered by diet';
    return s || '';
  })();

  const handleToggleSubstitutions = async () => {
    if (!isAuthed || savingPref) return;
    const next = !allowSubstitutions;
    setSavingPref(true);
    setSuggestedError('');
    try {
      await setDietPreferences({ allow_substitutions: next });
      setAllowSubstitutions(next);
      await loadSuggestions();
    } catch (e) {
      setSuggestedError(apiErrorMessage(e));
    } finally {
      setSavingPref(false);
    }
  };

  const showSuggestedLoading = activeTab === 'suggested' && suggestedLoading;
  const showBrowseLoading = activeTab === 'browse' && browseLoading;
  const currentError = activeTab === 'suggested' ? suggestedError : browseError;

  const browsePageLim = browsePagination?.limit ?? BROWSE_PAGE;
  const browseSkip = browsePagination?.skip ?? 0;
  const browseCurrentPage = Math.floor(browseSkip / browsePageLim) + 1;
  const browseTotalPages =
    browsePagination?.total != null
      ? Math.max(1, Math.ceil(browsePagination.total / browsePageLim))
      : null;
  const canBrowsePrev = browseSkip > 0;
  const canBrowseNext = browsePagination?.hasMore === true;

  return (
    <div className="h-full">
      <div className="h-full rounded-2xl border border-black/5 bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black uppercase italic tracking-tight text-brand-dark sm:text-3xl">
              Recipes for you
            </h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-dark/45 sm:text-xs">
              {activeTab === 'suggested'
                ? "Suggested from what's in your fridge — no manual search."
                : 'Browse the full catalog. Diet preferences apply.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAuthed && (
              <button
                type="button"
                onClick={openAiModal}
                className="inline-flex items-center gap-2 rounded-full border border-brand-green/35 bg-brand-green/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-dark hover:bg-brand-green/15"
              >
                <Wand2 className="h-4 w-4 text-brand-green" strokeWidth={2} />
                AI generate recipe
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshDisabled}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-dark hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {refreshDisabled && isAuthed ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" strokeWidth={2} />
              )}
              Refresh
            </button>
          </div>
        </div>

        {isAuthed && (
          <div className="mt-5 inline-flex rounded-full border border-black/10 bg-[#F7F7F2] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('suggested')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === 'suggested'
                  ? 'bg-white text-brand-dark shadow-sm'
                  : 'text-brand-dark/55 hover:text-brand-dark'
              }`}
            >
              Suggested for you
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white text-brand-dark shadow-sm'
                  : 'text-brand-dark/55 hover:text-brand-dark'
              }`}
            >
              Browse all recipes
            </button>
          </div>
        )}

        {isAuthed && activeTab === 'browse' && (
          <div className="relative mt-5">
            <span className="pointer-events-none absolute left-3 top-1/2 z-[1] flex h-5 w-5 -translate-y-1/2 items-center justify-center text-brand-dark/55">
              <Search className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
            </span>
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={browseSearchInput}
              onChange={(e) => setBrowseSearchInput(e.target.value)}
              placeholder="Search recipes by name"
              autoComplete="off"
              className="w-full rounded-2xl border border-black/10 bg-[#F7F7F2] py-3 pl-11 pr-10 text-sm text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/20"
              aria-label="Search recipes"
            />
            {browseSearchInput ? (
              <button
                type="button"
                onClick={() => setBrowseSearchInput('')}
                className="absolute right-2 top-1/2 z-[1] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-brand-dark/50 hover:bg-black/5 hover:text-brand-dark"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            ) : null}
          </div>
        )}

        {!isAuthed && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Link
              to="/signin"
              className="font-semibold text-brand-green underline hover:no-underline"
            >
              Sign in
            </Link>{' '}
            to see recipe suggestions and browse the catalog.
          </div>
        )}

        {isAuthed && activeTab === 'suggested' && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-[#F7F7F2] px-4 py-4 sm:px-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-black/20 text-brand-green focus:ring-brand-green/30"
                checked={allowSubstitutions}
                onChange={handleToggleSubstitutions}
                disabled={savingPref || suggestedLoading}
              />
              <span>
                <span className="text-sm font-semibold text-brand-dark">
                  Allow recipes with missing ingredients
                </span>
                <span className="mt-0.5 block text-xs text-brand-dark/60">
                  When off, only recipes you can make fully from your fridge are shown. When on,
                  substitutions are allowed and you may see extra ingredients to buy. Saved to your
                  profile.
                </span>
              </span>
            </label>
            {savingPref && (
              <p className="mt-2 text-xs text-brand-dark/50">Saving preference…</p>
            )}
          </div>
        )}

        {activeTab === 'suggested' && suggestedMeta?.matchingHeuristicUsed && suggestedMeta.matchingDisclaimer && (
          <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
            {suggestedMeta.matchingDisclaimer}
          </p>
        )}

        {currentError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {currentError}
          </div>
        )}

        {activeTab === 'suggested' && personalizedError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {personalizedError}
          </div>
        )}

        {showSuggestedLoading && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
          </div>
        )}

        {showBrowseLoading && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand-green" />
          </div>
        )}

        {activeTab === 'suggested' &&
          !suggestedLoading &&
          isAuthed &&
          suggestedRecipes.length === 0 &&
          !suggestedError && (
            <div className="mt-10 rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-6 py-12 text-center">
              <ChefHat className="mx-auto h-12 w-12 text-brand-dark/25" strokeWidth={1.25} />
              <p className="mt-3 text-sm font-semibold text-brand-dark/75">
                {suggestedMeta?.message || 'No recipes matched your fridge yet.'}
              </p>
              <p className="mt-1 text-xs text-brand-dark/45">
                Add ingredients in{' '}
                <Link to="/my-fridge" className="font-semibold text-brand-green underline">
                  My Fridge
                </Link>{' '}
                and refresh.
              </p>
            </div>
          )}

        {activeTab === 'browse' && !browseLoading && isAuthed && browseList.length === 0 && !browseError && (
          <div className="mt-10 rounded-2xl border border-dashed border-black/15 bg-[#F7F7F2]/80 px-6 py-12 text-center">
            <ChefHat className="mx-auto h-12 w-12 text-brand-dark/25" strokeWidth={1.25} />
            <p className="mt-3 text-sm font-semibold text-brand-dark/75">No recipes in the catalog yet.</p>
          </div>
        )}

        {activeTab === 'suggested' && !suggestedLoading && suggestedRecipes.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {suggestedRecipes.map((r) => {
              const missing = Array.isArray(r.missingIngredients)
                ? r.missingIngredients.length
                : 0;
              const matched = Array.isArray(r.matchedIngredients)
                ? r.matchedIngredients.length
                : 0;
              const thumb = r.strMealThumb || '';
              return (
                <li
                  key={r.idMeal || r.strMeal}
                  className="flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-[#F7F7F2]/50 shadow-sm"
                >
                  <div className="aspect-video w-full overflow-hidden bg-black/5">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-dark/25">
                        <ChefHat className="h-12 w-12" strokeWidth={1} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="line-clamp-2 text-sm font-bold uppercase tracking-wide text-brand-dark">
                      {r.strMeal || 'Recipe'}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                      <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-brand-green">
                        {matched} matched
                      </span>
                      {missing > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-900">
                          {missing} missing
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailRecipe(r)}
                      className="mt-3 w-full rounded-full border border-black/10 bg-white py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark transition-colors hover:bg-black/[0.04]"
                    >
                      View details
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {isAuthed && activeTab === 'suggested' && (
          <div className="mt-10 rounded-2xl border border-brand-green/25 bg-brand-green/[0.06] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-dark">AI-personalized picks</p>
                <p className="mt-0.5 text-xs text-brand-dark/60">
                  Uses your fridge, diet preferences, health goals, and AI ranking — separate from the
                  quick suggestions list.
                </p>
              </div>
              <button
                type="button"
                onClick={loadPersonalized}
                disabled={personalizedLoading || suggestedLoading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-brand-green/30 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-brand-dark shadow-sm hover:bg-[#F7F7F2] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {personalizedLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
                ) : (
                  <Sparkles className="h-4 w-4 text-brand-green" strokeWidth={2} />
                )}
                Generate personalized picks
              </button>
            </div>
            {filtersSummaryLine(personalizedMeta?.filters) && (
              <p className="mt-3 text-xs text-brand-dark/55">
                {filtersSummaryLine(personalizedMeta.filters)}
              </p>
            )}
            {personalizedMeta?.strategy && personalizedRecipes.length > 0 && (
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-brand-dark/45">
                {personalizedStrategyLabel}
                {personalizedMeta.candidateCount != null && personalizedMeta.candidateCount > 0 && (
                  <span className="ml-2 normal-case">
                    · {personalizedMeta.candidateCount} candidates considered
                  </span>
                )}
              </p>
            )}
            {personalizedMeta?.matchingHeuristicUsed && personalizedMeta.matchingDisclaimer && (
              <p className="mt-2 text-xs text-amber-900/90">{personalizedMeta.matchingDisclaimer}</p>
            )}

            {!personalizedLoading &&
              personalizedMeta &&
              personalizedRecipes.length === 0 &&
              !personalizedError && (
                <p className="mt-4 text-sm text-brand-dark/70">
                  {personalizedMeta.strategy === 'none'
                    ? 'Add ingredients to your fridge to get AI-personalized recommendations.'
                    : 'No recipes matched after filtering — try allowing missing ingredients or updating your diet preferences.'}
                </p>
              )}

            {!personalizedLoading && personalizedRecipes.length > 0 && (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {personalizedRecipes.map((r, pIdx) => {
                  const gen = isGeneratedRecipe(r);
                  const missing = Array.isArray(r.missingIngredients)
                    ? r.missingIngredients.length
                    : 0;
                  const matched = Array.isArray(r.matchedIngredients)
                    ? r.matchedIngredients.length
                    : 0;
                  const thumb = r.strMealThumb || '';
                  const reason = r.personalization?.reason;
                  const effort = r.personalization?.effort;
                  const usedN = Array.isArray(r.usedFromFridge) ? r.usedFromFridge.length : 0;
                  const pantryN = Array.isArray(r.optionalPantry) ? r.optionalPantry.length : 0;
                  const title = gen ? r.title || 'Recipe' : r.strMeal || 'Recipe';
                  return (
                    <li
                      key={`p-${gen ? `g-${pIdx}-${title}` : r.idMeal || r.strMeal || pIdx}`}
                      className="flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white/80 shadow-sm"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-black/5">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-brand-dark/25">
                            <ChefHat className="h-12 w-12" strokeWidth={1} />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h2 className="line-clamp-2 text-sm font-bold uppercase tracking-wide text-brand-dark">
                          {title}
                        </h2>
                        {gen && r.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-brand-dark/55">{r.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                          {gen ? (
                            <>
                              {usedN > 0 && (
                                <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-brand-green">
                                  {usedN} from fridge
                                </span>
                              )}
                              {pantryN > 0 && (
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-brand-dark/70">
                                  +{pantryN} pantry
                                </span>
                              )}
                              {r.prepMinutes != null && (
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-brand-dark/70">
                                  ~{r.prepMinutes} min
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-brand-green">
                                {matched} matched
                              </span>
                              {missing > 0 && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-900">
                                  {missing} missing
                                </span>
                              )}
                              {effort && (
                                <span className="rounded-full bg-black/5 px-2 py-0.5 capitalize text-brand-dark/70">
                                  {effort}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {reason && (
                          <p className="mt-3 border-t border-black/5 pt-3 text-xs leading-snug text-brand-dark/75">
                            {reason}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setDetailRecipe({
                              ...r,
                              responseFilters: personalizedMeta?.filters || null,
                            })
                          }
                          className="mt-3 w-full rounded-full border border-black/10 bg-white py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark transition-colors hover:bg-black/[0.04]"
                        >
                          View details
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'browse' && !browseLoading && browseList.length > 0 && (
          <>
            <p className="mt-6 text-xs text-brand-dark/50">
              Showing {browseList.length}
              {browsePagination?.total != null ? ` of ${browsePagination.total}` : ''} recipes
              {browseFilters?.appliedDiet != null && (
                <span className="ml-1">· Diet: {browseFilters.appliedDiet}</span>
              )}
            </p>
            <ul
              className={`mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
                browseNavLoading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {browseList.map((r) => {
                const ingCount = Array.isArray(r.recipeIngredients)
                  ? r.recipeIngredients.length
                  : Array.isArray(r.ingredients)
                    ? r.ingredients.length
                    : 0;
                const thumb = r.image_url || '';
                const key = r._id != null ? String(r._id) : r.title;
                return (
                  <li
                    key={key}
                    className="flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-[#F7F7F2]/50 shadow-sm"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-black/5">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-brand-dark/25">
                          <ChefHat className="h-12 w-12" strokeWidth={1} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="line-clamp-2 text-sm font-bold uppercase tracking-wide text-brand-dark">
                        {r.title || 'Recipe'}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
                        <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-brand-green">
                          {ingCount} ingredients
                        </span>
                        {Array.isArray(r.tags) && r.tags.length > 0 && (
                          <span className="rounded-full bg-black/5 px-2 py-0.5 text-brand-dark/70">
                            {r.tags.slice(0, 2).join(' · ')}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDetailRecipe(r)}
                        className="mt-3 w-full rounded-full border border-black/10 bg-white py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark transition-colors hover:bg-black/[0.04]"
                      >
                        View details
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {browsePagination != null && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={goBrowsePrev}
                  disabled={!canBrowsePrev || browseNavLoading}
                  aria-label="Previous page"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#F7F7F2] text-brand-dark transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                </button>
                <div className="flex min-w-[11rem] items-center justify-center gap-2 px-2">
                  {browseNavLoading && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-green" aria-hidden />
                  )}
                  <span className="text-center text-xs font-semibold uppercase tracking-wide text-brand-dark/75">
                    Page {browseCurrentPage}
                    {browseTotalPages != null ? ` of ${browseTotalPages}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={goBrowseNext}
                  disabled={!canBrowseNext || browseNavLoading}
                  aria-label="Next page"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#F7F7F2] text-brand-dark transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="ai-recipe-modal-title"
          onClick={() => !aiLoading && setAiModalOpen(false)}
        >
          <div
            className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-black/10 px-5 py-4">
              <h2
                id="ai-recipe-modal-title"
                className="text-lg font-bold text-brand-dark"
              >
                AI recipe from your fridge
              </h2>
              <p className="mt-1 text-sm text-brand-dark/60">
                Choose cuisine, meal, servings, and time. We&apos;ll rank recipes that fit your
                inventory and preferences.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {!aiLoading && aiResults === null && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runAiRecipeGenerate();
                  }}
                >
                  <Input
                    label="Cuisine / region"
                    value={aiCuisine}
                    onChange={(e) => setAiCuisine(e.target.value)}
                    placeholder="e.g. Italian, Japanese, Mexican"
                    required
                  />
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-brand-dark/55">
                      Meal
                    </label>
                    <select
                      value={aiMealType}
                      onChange={(e) => setAiMealType(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-[#F7F7F2] px-3 py-2 text-sm text-brand-dark"
                    >
                      {AI_MEAL_TYPES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="People (servings)"
                      type="number"
                      min={1}
                      max={20}
                      value={aiServings}
                      onChange={(e) => setAiServings(e.target.value)}
                      required
                    />
                    <Input
                      label="Max cook (minutes)"
                      type="number"
                      min={5}
                      max={300}
                      value={aiMaxMinutes}
                      onChange={(e) => setAiMaxMinutes(e.target.value)}
                      required
                    />
                  </div>
                  {aiError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {aiError}
                    </div>
                  )}
                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-dark/70 hover:bg-black/5"
                      onClick={() => setAiModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <Button type="submit">Generate</Button>
                  </div>
                </form>
              )}

              {aiLoading && (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-brand-green" />
                  <p className="text-center text-sm font-medium text-brand-dark">
                    Generating personalized recipes…
                  </p>
                  <p className="max-w-xs text-center text-xs text-brand-dark/55">
                    This uses your fridge, diet settings, and AI ranking. May take a few seconds.
                  </p>
                </div>
              )}

              {!aiLoading && aiResults !== null && (
                <div className="space-y-4">
                  {aiError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {aiError}
                    </div>
                  )}
                  {filtersSummaryLine(aiMeta?.filters) && (
                    <p className="text-xs text-brand-dark/60">{filtersSummaryLine(aiMeta.filters)}</p>
                  )}
                  {aiMeta?.strategy && aiResults.length > 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-dark/45">
                      {formatApiStrategyShort(aiMeta.strategy)}
                      {aiMeta.candidateCount != null && aiMeta.candidateCount > 0 && (
                        <span className="ml-2 normal-case">
                          · {aiMeta.candidateCount} candidates
                        </span>
                      )}
                    </p>
                  )}
                  {aiResults.length === 0 && !aiError && (
                    <p className="text-sm text-brand-dark/70">
                      No recipes matched. Try different cuisine or time, or add more to your fridge.
                    </p>
                  )}
                  {aiResults.length > 0 && (
                    <ul className="grid gap-3 sm:grid-cols-1">
                      {aiResults.map((r, idx) => {
                        const gen = isGeneratedRecipe(r);
                        const missing = Array.isArray(r.missingIngredients)
                          ? r.missingIngredients.length
                          : 0;
                        const matched = Array.isArray(r.matchedIngredients)
                          ? r.matchedIngredients.length
                          : 0;
                        const thumb = r.strMealThumb || '';
                        const reason = r.personalization?.reason;
                        const usedN = Array.isArray(r.usedFromFridge) ? r.usedFromFridge.length : 0;
                        const pantryN = Array.isArray(r.optionalPantry) ? r.optionalPantry.length : 0;
                        const title = gen ? r.title || 'Recipe' : r.strMeal || r.title || 'Recipe';
                        return (
                          <li
                            key={`ai-${gen ? `g-${idx}-${title}` : r.idMeal || r.strMeal || idx}`}
                            className="flex gap-3 rounded-xl border border-black/10 bg-[#F7F7F2]/80 p-3"
                          >
                            <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-black/5">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <ChefHat className="h-8 w-8 text-brand-dark/25" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-sm font-bold text-brand-dark">{title}</h3>
                              {gen && r.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-brand-dark/55">{r.description}</p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold uppercase">
                                {gen ? (
                                  <>
                                    {usedN > 0 && (
                                      <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-brand-green">
                                        {usedN} from fridge
                                      </span>
                                    )}
                                    {pantryN > 0 && (
                                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-brand-dark/70">
                                        +{pantryN} pantry
                                      </span>
                                    )}
                                    {r.prepMinutes != null && (
                                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-brand-dark/70">
                                        ~{r.prepMinutes} min
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className="rounded-full bg-brand-green/15 px-2 py-0.5 text-brand-green">
                                      {matched} matched
                                    </span>
                                    {missing > 0 && (
                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-900">
                                        {missing} missing
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {reason && (
                                <p className="mt-2 line-clamp-3 text-xs text-brand-dark/70">
                                  {reason}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailRecipe({
                                    ...r,
                                    responseFilters: aiMeta?.filters || null,
                                  });
                                  setAiModalOpen(false);
                                }}
                                className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-green underline hover:no-underline"
                              >
                                View details
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2 border-t border-black/10 pt-4">
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-sm font-medium text-brand-dark/70 hover:bg-black/5"
                      onClick={() => {
                        setAiResults(null);
                        setAiMeta(null);
                        setAiError('');
                      }}
                    >
                      New search
                    </button>
                    <button
                      type="button"
                      className="rounded-xl px-4 py-2 text-sm font-medium text-brand-dark/70 hover:bg-black/5"
                      onClick={() => setAiModalOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          sourceSurface={activeTab === 'browse' ? 'browse' : 'suggest'}
          onClose={() => setDetailRecipe(null)}
        />
      )}
    </div>
  );
};

export default Recipes;
