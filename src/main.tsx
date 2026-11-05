import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.tsx';
import { getThemeNow } from './data';
import { applyTheme } from './lib/theme';

// Colors and fonts come from content (theme.json), so editors can change them without code.
applyTheme(getThemeNow());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
