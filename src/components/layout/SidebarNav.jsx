import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-fridge', label: 'My Fridge' },
  { to: '/expiry/priority', label: 'Expiry Priority' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/meal-plan', label: 'Meal Plan' },
  { to: '/groceries', label: 'Groceries' },
  { to: '/profile', label: 'Profile' },
];

const SidebarNav = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');

      if (userId) {
        await logout({ user_id: userId });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      navigate('/');
      setLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-black/5 flex flex-col">
      <div className="px-6 py-6 border-b border-black/5">
        <span className="block text-lg font-semibold text-brand-dark">
          Let Us Cook
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium',
                isActive
                  ? 'bg-brand-green/10 text-brand-dark'
                  : 'text-brand-dark/70 hover:bg-black/5 hover:text-brand-dark',
              ].join(' ')
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className="m-4 mt-auto flex items-center gap-2 text-sm text-brand-dark/70 hover:text-brand-dark disabled:opacity-60"
      >
        <span>⏏</span>
        <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
      </button>
    </aside>
  );
};

export default SidebarNav;

