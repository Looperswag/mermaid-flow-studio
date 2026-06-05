import { useCallback, useEffect, useState } from 'react';

import type { DiagramTheme } from '../lib/renderMermaid';

const STORAGE_KEY = 'mfs:theme';

function readStoredTheme(): DiagramTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore storage failures.
  }
  return 'light';
}

export interface ThemeController {
  theme: DiagramTheme;
  toggleTheme: () => void;
  setTheme: (theme: DiagramTheme) => void;
}

/**
 * Owns the light/dark theme. Applies `data-theme` (and `color-scheme`) to the document root
 * so CSS can switch palettes, and persists the choice. The returned `theme` also feeds the
 * Mermaid renderer so the diagram colors follow the UI.
 */
export function useTheme(): ThemeController {
  const [theme, setThemeState] = useState<DiagramTheme>(readStoredTheme);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures.
    }
  }, [theme]);

  const setTheme = useCallback((next: DiagramTheme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === 'light' ? 'dark' : 'light')),
    [],
  );

  return { theme, toggleTheme, setTheme };
}
