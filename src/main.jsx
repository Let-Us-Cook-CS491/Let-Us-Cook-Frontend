import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './app/routes/router';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" closeButton />
    </>
  </React.StrictMode>,
);

