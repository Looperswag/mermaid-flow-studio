import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type { DesktopBridge } from '@shared/electron-api';
import type { PersistedDiagramCustomization } from '@shared/diagram-customization';

import { buildDefaultCustomization } from '../lib/defaultCustomization';

function buildPersistedCustomization(
  next: PersistedDiagramCustomization,
  nextSource: string,
): PersistedDiagramCustomization {
  return {
    ...next,
    lastSourceHash: `${nextSource.length}:${nextSource}`,
    updatedAt: new Date().toISOString(),
  };
}

export interface UseCustomizationResult {
  activeFilePath: string | null;
  setActiveFilePath: Dispatch<SetStateAction<string | null>>;
  customization: PersistedDiagramCustomization;
  setCustomization: Dispatch<SetStateAction<PersistedDiagramCustomization>>;
  persistCustomization: (
    next: PersistedDiagramCustomization,
    nextSource: string,
    filePath?: string | null,
  ) => Promise<void>;
}

/**
 * Owns the per-file diagram customization (palette, direction, layout) and its
 * active file path, plus persistence through the desktop bridge. `persistCustomization`
 * is stable and reads the latest active file path from a ref.
 */
export function useCustomization(desktop: DesktopBridge): UseCustomizationResult {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [customization, setCustomization] = useState<PersistedDiagramCustomization>(
    buildDefaultCustomization(),
  );

  const activeFilePathRef = useRef(activeFilePath);
  activeFilePathRef.current = activeFilePath;

  const persistCustomization = useCallback(
    async (
      next: PersistedDiagramCustomization,
      nextSource: string,
      filePath: string | null = activeFilePathRef.current,
    ) => {
      if (!filePath) {
        return;
      }
      await desktop.saveDiagramCustomization(
        filePath,
        buildPersistedCustomization(next, nextSource),
      );
    },
    [desktop],
  );

  return {
    activeFilePath,
    setActiveFilePath,
    customization,
    setCustomization,
    persistCustomization,
  };
}
