import React from 'react';
import { Link } from 'react-router-dom';

const BillingCancel = () => {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-black/5 bg-white px-6 py-8 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-dark">Checkout canceled</h1>
      <p className="mt-2 text-sm text-brand-dark/65">
        No charge was made. You can return to profile billing and choose a plan when ready.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          to="/profile"
          className="inline-flex items-center justify-center rounded-md bg-brand-brown px-4 py-2 text-sm font-medium text-brand-beige hover:bg-[#7b5e4f]"
        >
          Back to profile
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-black/5"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
};

export default BillingCancel;
