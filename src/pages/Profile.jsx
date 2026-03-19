import React, { useState } from 'react';
import HealthGoals from './HealthGoals';
import DietPreferences from './DietPreferences';

const Profile = () => {
  const [activeSection, setActiveSection] = useState('preferences');

  const sections = [
    { id: 'preferences', label: 'Preferences' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'health-goals', label: 'Health Goals' },
    { id: 'security', label: 'Security' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderContent = () => {
    if (activeSection === 'health-goals') {
      return <HealthGoals />;
    }

    if (activeSection === 'preferences') {
      return <DietPreferences />;
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-6">
        <h3 className="text-base font-semibold text-brand-dark">
          {sections.find((item) => item.id === activeSection)?.label}
        </h3>
        <p className="mt-2 text-sm text-brand-dark/60">
          This section is coming soon.
        </p>
      </div>
    );
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 h-full">
        <aside className="bg-white rounded-2xl shadow-sm border border-black/5 px-4 py-4">
          <h2 className="px-2 pb-3 text-sm font-semibold tracking-[0.14em] uppercase text-brand-dark/70">
            Profile
          </h2>
          <div className="space-y-2">
            {sections.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={[
                    'w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-dark text-brand-beige'
                      : 'bg-transparent text-brand-dark/70 hover:bg-black/5 hover:text-brand-dark',
                  ].join(' ')}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Profile;

