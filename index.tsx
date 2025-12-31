
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical: Could not find root element to mount to");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Give React a moment to start mounting, then hide the initial loader
    setTimeout(() => {
      if (typeof (window as any).hideOmniLoader === 'function') {
        (window as any).hideOmniLoader();
      }
    }, 100);
  } catch (error) {
    console.error("Failed to render OmniPlayer App:", error);
    // Even if it fails, try to hide the loader so the user sees the error in the console or a blank page instead of a spinner
    if (typeof (window as any).hideOmniLoader === 'function') {
      (window as any).hideOmniLoader();
    }
  }
}
