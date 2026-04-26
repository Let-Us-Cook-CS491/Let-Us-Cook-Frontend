import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentSubscription } from '../services/billingService';

const BillingSuccess = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getCurrentSubscription();
        if (cancelled) return;
        if (res?.status !== 'OK') {
          throw new Error(res?.message || 'Could not load subscription.');
        }
        setSubscription(res.data || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not load subscription.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-black/5 bg-white px-6 py-8 shadow-sm">
      <h1 className="text-2xl font-bold text-brand-dark">Payment successful</h1>
      <p className="mt-2 text-sm text-brand-dark/65">
        Your subscription checkout completed. We are refreshing your current plan details.
      </p>
      {loading && <p className="mt-4 text-sm text-brand-dark/60">Loading subscription...</p>}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Active plan:{' '}
          <span className="font-semibold">
            {String(subscription?.display_name || subscription?.plan_code || 'free')}
          </span>
        </div>
      )}
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

export default BillingSuccess;
