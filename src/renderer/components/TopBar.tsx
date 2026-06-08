import type { AppAccent, AppThemeMode } from '../lib/appThemes';

import { ThemeMenu } from './ThemeMenu';

interface TopBarProps {
  canExport: boolean;
  themeMode: AppThemeMode;
  accent: AppAccent;
  onThemeModeChange: (mode: AppThemeMode) => void;
  onAccentChange: (accent: AppAccent) => void;
  onExport: () => void;
  onNew: () => void;
  onOpen: () => void;
}

export function TopBar({
  canExport,
  themeMode,
  accent,
  onThemeModeChange,
  onAccentChange,
  onExport,
  onNew,
  onOpen,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__identity">
        <div className="topbar__badge">Offline</div>
        <div>
          <h1>Mermaid Flow Studio</h1>
          <p>Chat-first flowchart rendering for local macOS workflows.</p>
        </div>
      </div>

      <div className="topbar__actions">
        <ThemeMenu
          mode={themeMode}
          accent={accent}
          onModeChange={onThemeModeChange}
          onAccentChange={onAccentChange}
        />
        <button type="button" className="ghost-button" onClick={onNew} title="New (⌘N)">
          New
        </button>
        <button type="button" className="ghost-button" onClick={onOpen} title="Open (⌘O)">
          Open
        </button>
        <button
          type="button"
          className="accent-button"
          onClick={onExport}
          disabled={!canExport}
          title="Export (⌘E)"
        >
          Export
        </button>
      </div>
    </header>
  );
}
