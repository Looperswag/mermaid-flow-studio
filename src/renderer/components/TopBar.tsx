interface TopBarProps {
  canExport: boolean;
  onExport: () => void;
  onNew: () => void;
  onOpen: () => void;
}

export function TopBar({ canExport, onExport, onNew, onOpen }: TopBarProps) {
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
        <button type="button" className="ghost-button" onClick={onNew}>
          New
        </button>
        <button type="button" className="ghost-button" onClick={onOpen}>
          Open
        </button>
        <button type="button" className="accent-button" onClick={onExport} disabled={!canExport}>
          Export
        </button>
      </div>
    </header>
  );
}
