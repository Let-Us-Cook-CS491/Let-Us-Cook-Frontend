import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Landing from '../../pages/Landing';
import AuthPage from '../../pages/auth/AuthPage';
import Dashboard from '../../pages/Dashboard';
import MyFridge from '../../pages/MyFridge';
import Recipes from '../../pages/Recipes';
import MealPlan from '../../pages/MealPlan';
import Groceries from '../../pages/Groceries';
import Profile from '../../pages/Profile';
import ReceiptUpload from '../../pages/ReceiptUpload';
import ExpiryPriority from '../../pages/ExpiryPriority';

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
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/my-fridge',
        element: <MyFridge />,
      },
      {
        path: '/expiry/priority',
        element: <ExpiryPriority />,
      },
      {
        path: '/recipes',
        element: <Recipes />,
      },
      {
        path: '/meal-plan',
        element: <MealPlan />,
      },
      {
        path: '/groceries',
        element: <Groceries />,
      },
      {
        path: '/profile',
        element: <Profile />,
      },
      {
        path: '/receipt-upload',
        element: <ReceiptUpload />,
      },
    ],
  },
]);


