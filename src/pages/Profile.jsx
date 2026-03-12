import React from 'react';

const Profile = () => {
  return (
    <div className="h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-6 py-5 h-full">
        <h2 className="text-lg font-semibold text-brand-dark">Profile</h2>
        <p className="mt-1 text-sm text-brand-dark/60">
          Manage your account and preferences.
        </p>

        <div className="mt-4 h-[1px] bg-black/5" />

        <div className="mt-6 text-sm text-brand-dark/50">
          Profile settings coming soon…
        </div>
      </div>
    </div>
  );
};

export default Profile;

