import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-green px-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;

