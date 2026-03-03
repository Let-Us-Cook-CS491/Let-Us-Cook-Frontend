import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Landing from '../../pages/Landing';
import AuthPage from '../../pages/auth/AuthPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/signin',
        element: <AuthPage initialTab="signin" />,
      },
      {
        path: '/signup',
        element: <AuthPage initialTab="signup" />,
      },
    ],
  },
]);

