// App-level appearance (chrome) theming. This is intentionally separate from the
// per-file diagram palette in `diagramPalettes.ts`: appearance is a *global* user
// preference stored in localStorage and applied to <html> via data-* attributes,
// while a diagram palette is saved per file inside PersistedDiagramCustomization.

export type AppThemeMode = 'light' | 'dark' | 'auto';
export type AppAccent = 'emerald' | 'harbor' | 'ember' | 'graphite';
export type ResolvedTheme = 'light' | 'dark';

export interface AppThemeModeOption {
  id: AppThemeMode;
  label: string;
}

export interface AppAccentOption {
  id: AppAccent;
  label: string;
  /** Representative colour for the picker chip. */
  swatch: string;
}

export const appThemeModes: AppThemeModeOption[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'auto', label: 'Auto' },
];

// Accents mirror the diagram palette colour families so the chrome and a matching
// diagram palette can feel cohesive when chosen together.
export const appAccents: AppAccentOption[] = [
  { id: 'emerald', label: 'Emerald', swatch: '#1b7667' },
  { id: 'harbor', label: 'Harbor', swatch: '#246d96' },
  { id: 'ember', label: 'Ember', swatch: '#b5642f' },
  { id: 'graphite', label: 'Graphite', swatch: '#4f5b5e' },
];

export const defaultThemeMode: AppThemeMode = 'light';
export const defaultAccent: AppAccent = 'emerald';

const MODE_STORAGE_KEY = 'mfs.theme.mode';
const ACCENT_STORAGE_KEY = 'mfs.theme.accent';

const themeModeIds = new Set<AppThemeMode>(appThemeModes.map((mode) => mode.id));
const accentIds = new Set<AppAccent>(appAccents.map((accent) => accent.id));

export function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveMode(mode: AppThemeMode): ResolvedTheme {
  if (mode === 'auto') {
    return prefersDark() ? 'dark' : 'light';
  }
  return mode;
}

/** Reflect the preference onto <html data-theme data-accent>. CSS does the rest. */
export function applyAppTheme(mode: AppThemeMode, accent: AppAccent): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.dataset.theme = resolveMode(mode);
  root.dataset.accent = accent;
}

function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode / disabled); ignore.
  }
}

export function loadThemeMode(): AppThemeMode {
  const stored = safeRead(MODE_STORAGE_KEY) as AppThemeMode | null;
  return stored && themeModeIds.has(stored) ? stored : defaultThemeMode;
}

export function loadAccent(): AppAccent {
  const stored = safeRead(ACCENT_STORAGE_KEY) as AppAccent | null;
  return stored && accentIds.has(stored) ? stored : defaultAccent;
}

export function saveThemeMode(mode: AppThemeMode): void {
  safeWrite(MODE_STORAGE_KEY, mode);
}

export function saveAccent(accent: AppAccent): void {
  safeWrite(ACCENT_STORAGE_KEY, accent);
}
