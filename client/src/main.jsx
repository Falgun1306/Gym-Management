import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/react-query';
import App from './App';
import './index.css';

// Apply persisted theme on mount (defaulting to 'light' to match UI design examples)
const savedTheme = JSON.parse(localStorage.getItem('gym-ui-storage') || '{}')?.state?.theme || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#059669',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom" />}
    </QueryClientProvider>
  </React.StrictMode>
);

// Register Service Worker for PWA installation & offline functionality
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // console.log('SW registered successfully:', registration.scope);
      })
      .catch((err) => {
        console.warn('SW registration warning:', err);
      });
  });
}
