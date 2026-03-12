import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Landing from '../../pages/Landing';
import AuthPage from '../../pages/auth/AuthPage';
import FridgeUpload from '../../pages/FridgeUpload';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  // TEMP: Receipt upload testing route. Remove when wiring real navigation.
  {
    path: '/receipt-upload',
    element: <FridgeUpload />,
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

