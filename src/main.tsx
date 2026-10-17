import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for Android PWA installability & offline support
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('Map2Medic Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Map2Medic Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerSW();
  } else {
    window.addEventListener('DOMContentLoaded', registerSW);
    window.addEventListener('load', registerSW);
  }
}

createRoot(document.getElementById('root')!).render(<App />);

