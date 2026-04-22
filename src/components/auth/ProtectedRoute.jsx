import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { refreshToken as refreshAccessToken } from '../../services/authService';
import { clearAuthSession } from '../../utils/authSession';

/**
 * Requires a session: valid access token, or refresh + userId with a successful /auth/refresh.
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [gate, setGate] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        if (!cancelled) setGate('ok');
        return;
      }

      const storedRefresh = localStorage.getItem('refreshToken');
      const userId = localStorage.getItem('userId');

      if (storedRefresh && userId) {
        try {
          const data = await refreshAccessToken({
            user_id: Number(userId),
            refreshToken: storedRefresh,
          });
          if (cancelled) return;
          if (data?.status === 'OK' && data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            setGate('ok');
            return;
          }
        } catch {
          // fall through to unauth
        }
        if (!cancelled) {
          clearAuthSession();
          setGate('unauth');
        }
        return;
      }

      if (!cancelled) {
        clearAuthSession();
        setGate('unauth');
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  if (gate === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F7F2] text-brand-dark">
        <p className="text-sm text-brand-dark/60">Loading…</p>
      </div>
    );
  }

  if (gate === 'unauth') {
    return (
      <Navigate to="/signin" replace state={{ from: location.pathname }} />
    );
  }

  return children;
};

export default ProtectedRoute;
