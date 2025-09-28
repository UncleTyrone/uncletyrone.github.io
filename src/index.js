import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error handler to suppress browser-specific errors
window.addEventListener('error', function(e) {
  // Suppress browser translation errors
  if (e.message && (
    e.message.includes('translateDisabled') ||
    e.message.includes('translation') ||
    e.message.includes('ethereum') ||
    e.message.includes('Script error')
  )) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});

// Suppress unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  if (e.reason && (
    e.reason.message && (
      e.reason.message.includes('translateDisabled') ||
      e.reason.message.includes('translation') ||
      e.reason.message.includes('ethereum')
    )
  )) {
    e.preventDefault();
    return false;
  }
});

// Prevent ethereum-related errors
if (typeof window !== 'undefined' && !window.ethereum) {
  window.ethereum = {
    selectedAddress: null,
    isConnected: function() { return false; },
    request: function() { return Promise.reject(new Error('Ethereum not available')); }
  };
}

// Suppress specific error messages in console
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('translateDisabled') || 
      message.includes('translation') || 
      message.includes('ethereum') ||
      message.includes('Script error')) {
    return; // Suppress these errors
  }
  originalConsoleError.apply(console, args);
};

// Override the specific handleError function from bundle.js
if (typeof window !== 'undefined') {
  const originalHandleError = window.handleError;
  window.handleError = function(error) {
    if (error && error.message && error.message.includes('translateDisabled')) {
      return false; // Suppress translateDisabled errors
    }
    if (typeof originalHandleError === 'function') {
      return originalHandleError(error);
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
