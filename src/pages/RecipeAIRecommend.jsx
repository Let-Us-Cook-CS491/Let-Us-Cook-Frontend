import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { requestAiRecipeRecommend } from '../services/aiRecommendService';

const MODES = [
  {
    id: 'new',
    label: 'New recipe',
    hint: 'Describe a dish you want created from scratch.',
  },
  {
    id: 'extend',
    label: 'Extend existing',
    hint: 'Build on a recipe you already have (e.g. double batch, side pairings).',
  },
  {
    id: 'modify',
    label: 'Modify existing',
    hint: 'Change diet, spice level, swaps, or technique while keeping the core idea.',
  },
];

const PROMPT_MIN = 10;
const PROMPT_MAX = 2000;
const REF_MIN = 1;
const REF_MAX = 200;

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') {
    if (error.trim().startsWith('<!')) return 'The AI service is not available yet.';
    return error;
  }
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Something went wrong. Please try again.';
};

const labelStyle =
  'text-[11px] font-bold uppercase italic tracking-[0.14em] text-[#a0a0a0]';

const headingStyle =
  'text-base font-bold uppercase italic tracking-wide text-[#231F20]';

const normalizeResult = (payload) => {
  const raw = payload?.data ?? payload;
  if (!raw || typeof raw !== 'object') return null;
  return {
    title: raw.title ?? raw.recipe_title ?? 'Recommendation',
    body: raw.body ?? raw.content ?? raw.description ?? raw.text ?? '',
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.map(String) : [],
    steps: Array.isArray(raw.steps) ? raw.steps.map(String) : [],
    notes: raw.notes != null ? String(raw.notes) : '',
  };
};

const RecipeAIRecommend = () => {
  const [mode, setMode] = useState('new');
  const [recipeRef, setRecipeRef] = useState('');
  const [prompt, setPrompt] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const refLabel = mode === 'extend' ? 'Recipe to extend' : 'Recipe to modify';

  const validation = useMemo(() => {
    const next = {};
    const p = prompt.trim();
    if (!p) next.prompt = 'Describe what you want the AI to do.';
    else if (p.length < PROMPT_MIN)
      next.prompt = `Use at least ${PROMPT_MIN} characters so we have enough context.`;
    else if (p.length > PROMPT_MAX) next.prompt = `Keep instructions under ${PROMPT_MAX} characters.`;

    if (mode !== 'new') {
      const r = recipeRef.trim();
      if (!r) next.recipeRef = `Name or describe the existing recipe (${REF_MIN}–${REF_MAX} characters).`;
      else if (r.length < REF_MIN) next.recipeRef = 'Add a bit more detail to identify the recipe.';
      else if (r.length > REF_MAX) next.recipeRef = `Shorten to ${REF_MAX} characters or less.`;
    }
    return next;
  }, [prompt, recipeRef, mode]);

  const isValid = Object.keys(validation).length === 0;

  const runRecommend = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const body = {
        mode,
        prompt: prompt.trim(),
        ...(mode !== 'new'
          ? { recipe_title: recipeRef.trim() }
          : {}),
      };
      const res = await requestAiRecipeRecommend(body);
      setResult(normalizeResult(res));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    runRecommend();
  };

  return (
    <div className="h-full space-y-6">
      <div className="rounded-[40px] border border-black/[0.06] bg-white px-8 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <header className="flex items-start gap-3">
          <svg
            className="mt-0.5 h-8 w-8 shrink-0 text-brand-brown"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
          <div>
            <h2 className={`${headingStyle} text-lg md:text-xl`}>AI recipe recommend</h2>
            <p className="mt-2 max-w-xl text-[10px] font-medium uppercase italic leading-relaxed tracking-[0.12em] text-[#a0a0a0] md:text-[11px]">
              Unlike <strong className="text-brand-dark/80">Recipe suggest</strong>, which picks from recipes you
              already have, this flow asks the service to <strong className="text-brand-dark/80">create</strong>,{' '}
              <strong className="text-brand-dark/80">extend</strong>, or{' '}
              <strong className="text-brand-dark/80">modify</strong> a recipe from your instructions.
            </p>
          </div>
        </header>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section>
            <h3 className={labelStyle}>What should the AI do?</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => {
                const selected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMode(m.id);
                      setError('');
                      setResult(null);
                    }}
                    disabled={loading}
                    className={clsx(
                      'rounded-2xl border px-4 py-4 text-left text-[10px] font-bold uppercase italic leading-snug transition-colors md:text-xs',
                      selected
                        ? 'border-brand-brown bg-brand-brown/10 text-brand-dark shadow-sm'
                        : 'border-transparent bg-[#EFEFED] text-[#a0a0a0] hover:bg-[#e8e8e6]',
                      loading && 'opacity-60',
                    )}
                  >
                    <span className="block">{m.label}</span>
                    <span className="mt-2 block font-medium normal-case not-italic tracking-normal text-brand-dark/55">
                      {m.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {mode !== 'new' && (
            <section>
              <label htmlFor="ai-recipe-ref" className={labelStyle}>
                {refLabel}
              </label>
              <input
                id="ai-recipe-ref"
                type="text"
                value={recipeRef}
                onChange={(e) => {
                  setRecipeRef(e.target.value);
                  setError('');
                  setResult(null);
                }}
                onBlur={() => setTouched(true)}
                disabled={loading}
                placeholder="E.G. Sunday lasagna, recipe #12"
                className={clsx(
                  'mt-3 w-full rounded-[22px] border bg-white px-4 py-3.5 text-sm font-medium text-brand-dark placeholder:text-[#a0a0a0] placeholder:font-bold placeholder:uppercase placeholder:italic focus:outline-none focus:ring-2 focus:ring-brand-brown/30',
                  touched && validation.recipeRef ? 'border-red-400' : 'border-black/[0.08]',
                )}
              />
              {touched && validation.recipeRef && (
                <p className="mt-2 text-xs italic text-red-600">{validation.recipeRef}</p>
              )}
            </section>
          )}

          <section>
            <label htmlFor="ai-prompt" className={labelStyle}>
              Instructions for the AI
            </label>
            <textarea
              id="ai-prompt"
              rows={6}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError('');
                setResult(null);
              }}
              onBlur={() => setTouched(true)}
              disabled={loading}
              placeholder="E.G. Turn this into a 30-minute weeknight version with pantry staples only, or generate a vegan dessert using chocolate and raspberries."
              className={clsx(
                'mt-3 w-full resize-y rounded-[22px] border bg-white px-4 py-3.5 text-sm font-medium text-brand-dark placeholder:text-[#a0a0a0] placeholder:font-bold placeholder:uppercase placeholder:italic focus:outline-none focus:ring-2 focus:ring-brand-brown/30',
                touched && validation.prompt ? 'border-red-400' : 'border-black/[0.08]',
              )}
            />
            <div className="mt-2 flex justify-between text-[10px] font-medium uppercase italic tracking-wide text-[#a0a0a0]">
              <span>
                {touched && validation.prompt ? (
                  <span className="text-red-600 not-italic">{validation.prompt}</span>
                ) : (
                  <span>{PROMPT_MIN}–{PROMPT_MAX} characters</span>
                )}
              </span>
              <span>{prompt.trim().length} / {PROMPT_MAX}</span>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex w-full max-w-xl items-center justify-center gap-2 rounded-full bg-brand-brown py-4 text-xs font-bold uppercase italic tracking-[0.12em] text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 md:text-sm"
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
                Generating recommendation…
              </>
            ) : (
              <>
                Get AI recommendation
                <span aria-hidden className="text-base">
                  ›
                </span>
              </>
            )}
          </button>

          {error && isValid && (
            <button
              type="button"
              onClick={() => runRecommend()}
              className="text-sm font-semibold text-brand-brown underline-offset-2 hover:underline"
            >
              Try again
            </button>
          )}
        </form>
      </div>

      {result && (
        <div className="rounded-[40px] border border-black/[0.06] bg-white px-8 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h3 className={`${headingStyle} mb-2 text-lg`}>{result.title}</h3>
          {result.body ? (
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-brand-dark/85">
              {result.body}
            </div>
          ) : null}
          {result.ingredients.length > 0 && (
            <div className="mt-6">
              <h4 className={labelStyle}>Ingredients</h4>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-brand-dark/80">
                {result.ingredients.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {result.steps.length > 0 && (
            <div className="mt-6">
              <h4 className={labelStyle}>Steps</h4>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-brand-dark/80">
                {result.steps.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
          )}
          {result.notes ? (
            <p className="mt-6 rounded-2xl bg-[#F7F7F2] px-4 py-3 text-xs italic text-brand-dark/65">
              {result.notes}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default RecipeAIRecommend;
