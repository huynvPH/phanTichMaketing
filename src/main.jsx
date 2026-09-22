import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Intercept fetch to automatically attach client-side stored API keys for Vercel/cloud deployments
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    try {
      const saved = localStorage.getItem('marketing_client_keys');
      if (saved) {
        options = options || {};
        const headers = new Headers(options.headers || {});
        if (!headers.has('x-client-keys')) {
          headers.set('x-client-keys', encodeURIComponent(saved));
        }
        options.headers = headers;
      }
    } catch (e) {
      console.warn('Cannot attach client keys:', e);
    }
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
