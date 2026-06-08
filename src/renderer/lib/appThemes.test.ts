import { afterEach, beforeEach, expect, test } from 'vitest';

import {
  applyAppTheme,
  defaultAccent,
  defaultThemeMode,
  loadAccent,
  loadThemeMode,
  resolveMode,
  saveAccent,
  saveThemeMode,
} from './appThemes';

beforeEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.accent;
});

afterEach(() => {
  window.localStorage.clear();
});

test('resolveMode passes through explicit modes', () => {
  expect(resolveMode('light')).toBe('light');
  expect(resolveMode('dark')).toBe('dark');
});

test('resolveMode("auto") falls back to light when matchMedia is unavailable', () => {
  // jsdom does not implement matchMedia, so auto resolves to the safe default.
  expect(resolveMode('auto')).toBe('light');
});

test('applyAppTheme reflects the resolved mode and accent onto <html>', () => {
  applyAppTheme('dark', 'harbor');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.dataset.accent).toBe('harbor');

  applyAppTheme('auto', 'ember');
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.dataset.accent).toBe('ember');
});

test('preferences round-trip through localStorage', () => {
  saveThemeMode('dark');
  saveAccent('graphite');
  expect(loadThemeMode()).toBe('dark');
  expect(loadAccent()).toBe('graphite');
});

test('invalid or missing preferences fall back to defaults', () => {
  window.localStorage.setItem('mfs.theme.mode', 'rainbow');
  window.localStorage.setItem('mfs.theme.accent', 'neon');
  expect(loadThemeMode()).toBe(defaultThemeMode);
  expect(loadAccent()).toBe(defaultAccent);
});
