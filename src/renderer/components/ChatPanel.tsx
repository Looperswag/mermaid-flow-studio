import type { ReactNode } from 'react';

interface ChatPanelProps {
  activeFileLabel?: string | null;
  source: string;
  statusTone: 'info' | 'success' | 'error' | 'working';
  statusTitle: string;
  statusMessage: string;
}

function Bubble({
  children,
  eyebrow,
  tone,
}: {
  children: ReactNode;
  eyebrow: string;
  tone: 'assistant' | 'user' | 'status';
}) {
  return (
    <article className={`bubble bubble--${tone}`}>
      <div className="bubble__eyebrow">{eyebrow}</div>
      <div className="bubble__content">{children}</div>
    </article>
  );
}

export function ChatPanel({
  activeFileLabel,
  source,
  statusTone,
  statusTitle,
  statusMessage,
}: ChatPanelProps) {
  return (
    <section className="chat-panel" aria-label="Chat timeline">
      <Bubble eyebrow="Assistant" tone="assistant">
        <h2>Flowchart workspace</h2>
        <p>
          Paste Mermaid <code>flowchart</code> syntax, render it locally, then export
          the diagram as a polished image.
        </p>
      </Bubble>

      <Bubble eyebrow="You" tone="user">
        <h3>Current source</h3>
        {activeFileLabel ? <p>File: {activeFileLabel}</p> : null}
        <pre>{source}</pre>
      </Bubble>

      <Bubble eyebrow="Studio" tone="status">
        <div className={`status-pill status-pill--${statusTone}`}>{statusTitle}</div>
        <p>{statusMessage}</p>
      </Bubble>
    </section>
  );
}
