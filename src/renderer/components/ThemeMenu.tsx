import { useEffect, useId, useRef, useState } from 'react';

import {
  appAccents,
  appThemeModes,
  type AppAccent,
  type AppThemeMode,
} from '../lib/appThemes';

interface ThemeMenuProps {
  mode: AppThemeMode;
  accent: AppAccent;
  onModeChange: (mode: AppThemeMode) => void;
  onAccentChange: (accent: AppAccent) => void;
}

const modeGlyph: Record<AppThemeMode, string> = {
  light: '☀',
  dark: '☾',
  auto: '◐',
};

export function ThemeMenu({ mode, accent, onModeChange, onAccentChange }: ThemeMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="theme-menu" ref={containerRef}>
      <button
        type="button"
        className="ghost-button theme-menu__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        title="Theme & appearance"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="theme-menu__glyph" aria-hidden="true">
          {modeGlyph[mode]}
        </span>
        Theme
      </button>

      {open ? (
        <div className="theme-menu__panel" id={panelId} role="dialog" aria-label="Theme settings">
          <div className="theme-menu__group">
            <span className="theme-menu__label">Appearance</span>
            <div className="theme-menu__segmented" role="radiogroup" aria-label="Appearance">
              {appThemeModes.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === option.id}
                  className={`theme-menu__segment ${mode === option.id ? 'is-active' : ''}`}
                  onClick={() => onModeChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="theme-menu__group">
            <span className="theme-menu__label">Accent</span>
            <div className="theme-menu__accents" role="radiogroup" aria-label="Accent color">
              {appAccents.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={accent === option.id}
                  aria-label={option.label}
                  title={option.label}
                  className={`theme-menu__accent ${accent === option.id ? 'is-active' : ''}`}
                  onClick={() => onAccentChange(option.id)}
                >
                  <span className="theme-menu__swatch" style={{ background: option.swatch }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
