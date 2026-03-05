import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const IconWrap = ({ children }) => (
  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
    {children}
  </div>
);

const UtensilsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none">
    <path
      d="M4 3V8.5C4 10.43 5.57 12 7.5 12V21M8 3V8M11 3V8M17 3L20 6L16 10L13 7L17 3ZM13 7L21 15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none">
    <path
      d="M9 6L15 12L9 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefrigeratorIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#ACAB9E] mb-6" fill="none">
    <rect x="6" y="2.5" width="12" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.5 7.5H14.5M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ListChecksIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#ACAB9E] mb-6" fill="none">
    <path d="M4 6.5L6.3 8.8L10 5.2M4 12L6.3 14.3L10 10.7M4 17.5L6.3 19.8L10 16.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 7H20M13 12H20M13 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-10 h-10 text-[#ACAB9E] mb-6" fill="none">
    <rect x="4" y="5" width="16" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 3V7M16 3V7M4 10H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#567257] text-white flex flex-col">
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <IconWrap>
            <UtensilsIcon />
          </IconWrap>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">
            Let Us Cook
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-[0.25em] text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>

        <div className="flex gap-3 md:gap-4">
          <Button
            className="bg-transparent hover:bg-white/10 border-none text-white font-bold px-4 h-11 rounded-xl"
            onClick={() => navigate('/signin')}
          >
            Sign In
          </Button>
          <Button
            className="bg-[#896A58] hover:bg-[#2A2420] text-white border-none font-bold px-6 h-11 rounded-xl shadow-xl shadow-black/20"
            onClick={() => navigate('/signup')}
          >
            Get Started
          </Button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 grid lg:grid-cols-2 gap-12 items-center py-12 md:py-20">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <span className="w-2 h-2 rounded-full bg-[#896A58] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">New: AI Recipe Generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tighter italic uppercase">
            Stop Guessing,
            <br />
            <span className="text-[#ACAB9E]">Start Cooking</span>
          </h1>

          <p className="text-lg text-white/70 max-w-lg leading-relaxed font-medium">
            Turn your leftover ingredients into chef-quality meals. Let Us Cook analyzes what&apos;s in your fridge, tracks expiration dates, and plans your perfect weekly menu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              className="h-14 px-8 rounded-2xl bg-[#896A58] hover:bg-[#2A2420] text-white font-black text-lg border-none shadow-2xl shadow-black/20 group"
              onClick={() => navigate('/signup')}
            >
              START YOUR MEAL PLAN
              <ChevronRightIcon />
            </Button>
            <Button className="h-14 px-8 rounded-2xl border border-white/20 text-white hover:bg-white/10 font-bold bg-transparent">
              SEE HOW IT WORKS
            </Button>
          </div>

          <div id="about" />
        </div>

        <div className="relative aspect-square flex items-center justify-center">
          <div className="absolute inset-0 bg-[#896A58]/20 blur-[120px] rounded-full" />
          <img
            src="/assets/let-us-cook-pan.png"
            alt="Let Us Cook Logo"
            className="w-full max-w-[520px] h-auto relative z-10 drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]"
          />
        </div>
      </main>

      <section id="features" className="bg-[#2A2420] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
              <RefrigeratorIcon />
              <h3 className="text-4xl md:text-[2.7rem] font-bold mb-3 uppercase italic tracking-tight">Smart Fridge</h3>
              <p className="text-white/55 text-2xl md:text-[2.1rem] leading-[1.3]">Scan receipts and track every ingredient. We&apos;ll alert you before anything expires.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
              <ListChecksIcon />
              <h3 className="text-4xl md:text-[2.7rem] font-bold mb-3 uppercase italic tracking-tight">Recipe Discovery</h3>
              <p className="text-white/55 text-2xl md:text-[2.1rem] leading-[1.3]">Find thousands of recipes you can cook right now based on what&apos;s already in your kitchen.</p>
            </div>
            <div id="pricing" className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
              <CalendarIcon />
              <h3 className="text-4xl md:text-[2.7rem] font-bold mb-3 uppercase italic tracking-tight">Batch Planning</h3>
              <p className="text-white/55 text-2xl md:text-[2.1rem] leading-[1.3]">Optimize your week. Our AI suggests prep-heavy days to save you hours of cooking time.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 text-center text-white/30 text-xs font-bold uppercase tracking-[0.3em]">
        &copy; 2026 Let Us Cook • All Rights Reserved
      </footer>
    </div>
  );
};

export default Landing;
