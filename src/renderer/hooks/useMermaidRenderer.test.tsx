import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/renderMermaid', () => ({
  renderMermaid: vi.fn(async (source: string) => ({
    svg: `<svg data-source="${source.length}">${source}</svg>`,
    dimensions: { width: 120, height: 90 },
  })),
}));

import { renderMermaid } from '../lib/renderMermaid';
import { useMermaidRenderer } from './useMermaidRenderer';

const valid = 'flowchart TD\n  A --> B';
const validNext = 'flowchart LR\n  X --> Y';

describe('useMermaidRenderer', () => {
  it('auto-renders the source after it changes (no manual trigger)', async () => {
    const { result, rerender } = renderHook(
      ({ source }) => useMermaidRenderer({ source, debounceMs: 20 }),
      { initialProps: { source: valid } },
    );

    await waitFor(() => expect(result.current.preview).not.toBeNull());
    expect(result.current.preview?.svg).toContain('A --> B');

    rerender({ source: validNext });
    await waitFor(() => expect(result.current.preview?.svg).toContain('X --> Y'));
  });

  it('keeps the last good preview and flags stale when a change is invalid', async () => {
    const { result, rerender } = renderHook(
      ({ source }) => useMermaidRenderer({ source, debounceMs: 20 }),
      { initialProps: { source: valid } },
    );

    await waitFor(() => expect(result.current.preview?.svg).toContain('A --> B'));

    rerender({ source: 'sequenceDiagram\n  A->>B: hi' });
    await waitFor(() => expect(result.current.isStale).toBe(true));

    // Preview is preserved; status reflects the error.
    expect(result.current.preview?.svg).toContain('A --> B');
    expect(result.current.status.tone).toBe('error');
  });

  it('a stale in-flight valid render cannot overwrite a newer invalid-edit error', async () => {
    vi.mocked(renderMermaid).mockClear();
    // Gate the first (valid) render so it is still in-flight when we edit to invalid.
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.mocked(renderMermaid).mockImplementationOnce(async (source: string) => {
      await gate;
      return { svg: `<svg>${source}</svg>`, dimensions: { width: 100, height: 90 } };
    });

    const { result, rerender } = renderHook(
      ({ source }) => useMermaidRenderer({ source, debounceMs: 10 }),
      { initialProps: { source: valid } },
    );

    await waitFor(() => expect(renderMermaid).toHaveBeenCalledTimes(1));

    // Edit to invalid while the valid render is still pending.
    rerender({ source: 'sequenceDiagram\n  A->>B: hi' });
    await waitFor(() => expect(result.current.isStale).toBe(true));
    expect(result.current.status.tone).toBe('error');

    // Releasing the superseded valid render must NOT flip state back to success.
    release();
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(result.current.isStale).toBe(true);
    expect(result.current.status.tone).toBe('error');
    expect(result.current.preview).toBeNull();
  });

  it('stays idle when disabled', async () => {
    vi.mocked(renderMermaid).mockClear();
    const { result } = renderHook(() => useMermaidRenderer({ source: valid, enabled: false }));

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(renderMermaid).not.toHaveBeenCalled();
    expect(result.current.preview).toBeNull();
  });
});
