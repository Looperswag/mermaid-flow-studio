import { useCallback, useEffect, useState } from 'react';

import {
  applyAppTheme,
  loadAccent,
  loadThemeMode,
  saveAccent,
  saveThemeMode,
  type AppAccent,
  type AppThemeMode,
} from '../lib/appThemes';

export interface UseAppThemeResult {
  mode: AppThemeMode;
  accent: AppAccent;
  setMode: (mode: AppThemeMode) => void;
  setAccent: (accent: AppAccent) => void;
}

/**
 * Owns the global appearance preference (light / dark / auto + accent), persists it
 * to localStorage, reflects it onto <html>, and—while following the system—re-applies
 * whenever the OS colour scheme flips.
 */
export function useAppTheme(): UseAppThemeResult {
  const [mode, setModeState] = useState<AppThemeMode>(() => loadThemeMode());
  const [accent, setAccentState] = useState<AppAccent>(() => loadAccent());

  useEffect(() => {
    applyAppTheme(mode, accent);
  }, [mode, accent]);

  useEffect(() => {
    if (
      mode !== 'auto' ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyAppTheme('auto', accent);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [mode, accent]);

  const setMode = useCallback((next: AppThemeMode) => {
    setModeState(next);
    saveThemeMode(next);
  }, []);

  const setAccent = useCallback((next: AppAccent) => {
    setAccentState(next);
    saveAccent(next);
  }, []);

  return { mode, accent, setMode, setAccent };
}
