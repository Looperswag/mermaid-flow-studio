import { useEffect, useRef } from 'react';

export interface DiagramShortcutHandlers {
  onRender: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFit: () => void;
  onExport: () => void;
  onOpen: () => void;
  onNew: () => void;
  canExport: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Global keyboard shortcuts (⌘/Ctrl based). The handlers are kept in a ref so the
 * listener is bound once and always sees the latest callbacks.
 *
 *   ⌘↵ render · ⌘+/⌘- zoom · ⌘0 100% · ⌘⇧0 fit · ⌘E export · ⌘O open · ⌘N new
 */
export function useKeyboardShortcuts(handlers: DiagramShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }

      const handler = handlersRef.current;

      // Enter renders. While typing in the composer the textarea handles ⌘↵ itself,
      // so skip here to avoid a double render.
      if (event.key === 'Enter') {
        if (!isEditableTarget(event.target)) {
          event.preventDefault();
          handler.onRender();
        }
        return;
      }

      switch (event.code) {
        case 'Equal':
        case 'NumpadAdd':
          event.preventDefault();
          handler.onZoomIn();
          return;
        case 'Minus':
        case 'NumpadSubtract':
          event.preventDefault();
          handler.onZoomOut();
          return;
        case 'Digit0':
        case 'Numpad0':
          event.preventDefault();
          if (event.shiftKey) {
            handler.onFit();
          } else {
            handler.onResetZoom();
          }
          return;
        case 'KeyE':
          if (handler.canExport) {
            event.preventDefault();
            handler.onExport();
          }
          return;
        case 'KeyO':
          event.preventDefault();
          handler.onOpen();
          return;
        case 'KeyN':
          event.preventDefault();
          handler.onNew();
          return;
        default:
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
