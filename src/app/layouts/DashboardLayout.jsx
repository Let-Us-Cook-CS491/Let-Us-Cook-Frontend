import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarNav from '../../components/layout/SidebarNav';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F2] flex text-brand-dark">
      <SidebarNav />

      <main className="flex-1 flex flex-col">
        <header className="px-8 py-6 border-b border-black/5 bg-[#F7F7F2]">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, chef!
            </h1>
            <p className="text-sm text-brand-dark/60">
              You have 0 items that need your attention soon.
            </p>
          </div>
        </header>

        <section className="flex-1 px-8 pb-8 pt-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;

