import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { applyAppTheme, loadAccent, loadThemeMode } from './lib/appThemes';
import './styles/app.css';

// Apply the saved appearance before first paint so there is no light/dark flash.
applyAppTheme(loadThemeMode(), loadAccent());

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
