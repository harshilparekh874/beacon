import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Global error handler to help debug blank screen in production
window.onerror = function (msg, url, lineNo, columnNo, error) {
  console.error('Fatal App Error:', msg, 'at', url, 'line', lineNo);
  const root = document.getElementById('root');
  if (root && root.innerHTML === "") {
    root.innerHTML = `<div style="padding: 20px; color: red;">
      <h2>Application Error</h2>
      <p>${msg}</p>
      <small>Check console for details.</small>
    </div>`;
  }
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('App initialization starting...');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
