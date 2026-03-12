import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarNav from '../../components/layout/SidebarNav';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F2] flex text-brand-dark">
      <SidebarNav />

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-8 py-6 border-b border-black/5 bg-[#F7F7F2]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, chef!
            </h1>
            <p className="text-sm text-brand-dark/60">
              You have 0 items that need your attention soon.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-brand-green text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-brand-green/90"
          >
            + Add Ingredients
          </button>
        </header>

        <section className="flex-1 px-8 pb-8 pt-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;

