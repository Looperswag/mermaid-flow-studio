interface ComposerProps {
  isRendering: boolean;
  onChange: (value: string) => void;
  onInsertExample: () => void;
  onRender: () => void;
  value: string;
}

export function Composer({
  isRendering,
  onChange,
  onInsertExample,
  onRender,
  value,
}: ComposerProps) {
  return (
    <div className="composer">
      <label className="composer__label" htmlFor="mermaid-input">
        Mermaid input
      </label>
      <textarea
        id="mermaid-input"
        aria-label="Mermaid input"
        className="composer__textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
            event.preventDefault();
            onRender();
          }
        }}
        spellCheck={false}
      />

      <div className="composer__footer">
        <p>Cmd + Enter to render. Only Mermaid flowchart syntax is supported in v1.</p>
        <div className="composer__actions">
          <button type="button" className="ghost-button" onClick={onInsertExample}>
            Insert sample
          </button>
          <button
            type="button"
            className="accent-button"
            onClick={onRender}
            disabled={isRendering}
          >
            {isRendering ? 'Rendering…' : 'Render'}
          </button>
        </div>
      </div>
    </div>
  );
}
