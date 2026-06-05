import type { DiagramTheme } from '../lib/renderMermaid';
import type { DiagramTemplate } from '../lib/templates';

interface TopBarProps {
  canExport: boolean;
  theme: DiagramTheme;
  templates: DiagramTemplate[];
  onSelectTemplate: (id: string) => void;
  onCopySource: () => void;
  onToggleTheme: () => void;
  onShowShortcuts: () => void;
  onExport: () => void;
  onNew: () => void;
  onOpen: () => void;
}

export function TopBar({
  canExport,
  theme,
  templates,
  onSelectTemplate,
  onCopySource,
  onToggleTheme,
  onShowShortcuts,
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
          <p>Chat-first flowchart rendering · 实时预览随窗口自适应</p>
        </div>
      </div>

      <div className="topbar__actions">
        <select
          className="topbar__select"
          aria-label="插入模板"
          value=""
          onChange={(event) => {
            if (event.target.value) {
              onSelectTemplate(event.target.value);
              event.target.value = '';
            }
          }}
        >
          <option value="" disabled>
            插入模板…
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="ghost-button"
          onClick={onToggleTheme}
          aria-label="切换深浅主题"
          aria-pressed={theme === 'dark'}
        >
          {theme === 'light' ? '深色' : '浅色'}
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={onShowShortcuts}
          aria-label="键盘快捷键"
          title="键盘快捷键"
        >
          ?
        </button>
        <button type="button" className="ghost-button" onClick={onOpen}>
          Open
        </button>
        <button type="button" className="ghost-button" onClick={onCopySource}>
          Copy code
        </button>
        <button type="button" className="ghost-button" onClick={onNew}>
          New
        </button>
        <button type="button" className="accent-button" onClick={onExport} disabled={!canExport}>
          Export
        </button>
      </div>
    </header>
  );
}
