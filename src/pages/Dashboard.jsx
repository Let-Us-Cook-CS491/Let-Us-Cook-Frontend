import React from 'react';

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-4">
    <div className="text-xs uppercase tracking-[0.12em] text-brand-dark/60">
      {label}
    </div>
    <div className="mt-2 text-2xl font-semibold text-brand-dark">{value}</div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 h-full">
      <div className="space-y-6">
        <div className="grid grid-cols-5 gap-4">
          <StatCard label="Items in stock" value="10" />
          <StatCard label="Expiring soon" value="0" />
          <StatCard label="Planned meals" value="8/14" />
          <StatCard label="Waste prevented" value="2.4kg" />
          <StatCard label="Meals cooked" value="0" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">
                Expiring soon
              </h2>
              <p className="text-xs text-brand-dark/60">
                Use these items to prevent food waste.
              </p>
            </div>
            <button className="text-xs font-medium text-brand-dark/70 hover:text-brand-dark">
              View all →
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center text-xs text-brand-dark/50">
            No items expiring soon. Good job!
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="bg-brand-dark text-brand-beige rounded-2xl px-6 py-5">
          <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">
            Quick tip
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            &quot;Store potatoes in a cool, dark place away from onions to
            prevent them from sprouting too early.&quot;
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5">
          <h2 className="text-sm font-semibold tracking-[0.16em] uppercase">
            Next in plan
          </h2>
          <div className="mt-3 text-sm text-brand-dark">Pan-Seared Salmon</div>
          <div className="text-xs text-brand-dark/60">Today · 7:30 PM</div>
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;

