interface ComposerProps {
  isRendering: boolean;
  /** Inline message shown when the current source is invalid or failed to render. */
  error?: string | null;
  onChange: (value: string) => void;
  onInsertExample: () => void;
  onRender: () => void;
  value: string;
}

export function Composer({
  isRendering,
  error,
  onChange,
  onInsertExample,
  onRender,
  value,
}: ComposerProps) {
  return (
    <div className="composer">
      <div className="composer__heading">
        <label className="composer__label" htmlFor="mermaid-input">
          Mermaid input
        </label>
        <span
          className={`composer__live ${isRendering ? 'composer__live--busy' : ''}`}
          aria-live="polite"
        >
          {isRendering ? '渲染中…' : '实时预览已开启'}
        </span>
      </div>

      <textarea
        id="mermaid-input"
        aria-label="Mermaid input"
        className={`composer__textarea ${error ? 'composer__textarea--error' : ''}`}
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

      {error ? (
        <p className="composer__error" role="alert" data-testid="composer-error">
          {error}
        </p>
      ) : null}

      <div className="composer__footer">
        <p>编辑或粘贴即自动渲染 · Cmd/Ctrl + Enter 立即渲染。当前仅支持 flowchart 语法。</p>
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
            {isRendering ? 'Rendering…' : 'Render now'}
          </button>
        </div>
      </div>
    </div>
  );
}
