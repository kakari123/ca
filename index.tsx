
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Render error:", error);
  rootElement.innerHTML = `<div style="color: white; padding: 20px; background: #900; font-family: sans-serif;">
    <h2>هەڵەیەک ڕوویدا</h2>
    <p>${error instanceof Error ? error.message : "Error loading app"}</p>
  </div>`;
}
