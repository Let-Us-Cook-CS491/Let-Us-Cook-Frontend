import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
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
import BillingSuccess from '../../pages/BillingSuccess';
import BillingCancel from '../../pages/BillingCancel';

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
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
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
        element: <Navigate to="/my-fridge?view=expiry" replace />,
      },
      {
        path: '/inventory-sync',
        element: <Navigate to="/dashboard" replace />,
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
        path: '/meal-reminders',
        element: <Navigate to="/dashboard" replace />,
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
      {
        path: '/billing/success',
        element: <BillingSuccess />,
      },
      {
        path: '/billing/cancel',
        element: <BillingCancel />,
      },
    ],
  },
]);


