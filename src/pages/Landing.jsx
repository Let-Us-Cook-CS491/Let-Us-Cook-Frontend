import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-green text-brand-beige">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-10 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <span className="text-base font-semibold">🍳</span>
          </div>
          <span className="text-base font-semibold tracking-wide">
            LET US COOK
          </span>
        </div>

        <nav className="hidden items-center gap-10 text-sm font-medium text-brand-beige/85 md:flex">
          <button className="hover:text-brand-beige">Features</button>
          <button className="hover:text-brand-beige">About</button>
          <button className="hover:text-brand-beige">Pricing</button>
        </nav>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            to="/signin"
            className="text-brand-beige/90 hover:text-brand-beige"
          >
            Sign In
          </Link>
          <Link to="/signup">
            <Button className="w-auto rounded-full px-6 py-2.5 text-sm font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-16 px-8 py-10 md:flex-row md:items-center">
          <section className="w-full space-y-6 md:w-1/2">
            <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide text-brand-beige/80">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
              NEW: AI RECIPE GENERATION
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-brand-beige sm:text-6xl">
                STOP GUESSING,
                <br />
                <span className="text-brand-beige/90">START COOKING</span>
              </h1>
              <p className="max-w-lg text-base text-brand-beige sm:text-lg">
                Turn your leftover ingredients into chef-quality meals. Let Us
                Cook analyzes what&apos;s in your fridge, tracks expiration
                dates, and plans your weekly menu.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button className="w-full rounded-full px-8 py-3 text-base font-semibold">
                  Start your meal plan
                </Button>
              </Link>
              <button className="w-full rounded-full border border-brand-khaki bg-transparent px-8 py-3 text-base font-semibold text-brand-beige hover:bg-white/5 sm:w-auto">
                See how it works
              </button>
            </div>
          </section>

          <section className="w-full md:w-1/2">
            <div className="mx-auto max-w-lg">
              <div className="aspect-[4/3] w-full rounded-3xl border border-brand-khaki/40 bg-gradient-to-tr from-[#896A58] via-[#ACAB9E] to-[#D9D8D5] shadow-2xl" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Landing;

