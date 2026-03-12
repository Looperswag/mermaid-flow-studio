import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PersistedDiagramCustomization } from '../shared/diagram-customization';

type CustomizationMap = Record<string, PersistedDiagramCustomization>;

function storePathFor(userDataPath: string) {
  return path.join(userDataPath, 'diagram-customizations.json');
}

async function readStore(filePath: string): Promise<CustomizationMap> {
  try {
    const contents = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(contents) as CustomizationMap;
    return parsed ?? {};
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

export function createCustomizationStore(userDataPath: string) {
  const filePath = storePathFor(userDataPath);

  return {
    async load(diagramFilePath: string): Promise<PersistedDiagramCustomization | null> {
      const store = await readStore(filePath);
      return store[diagramFilePath] ?? null;
    },
    async save(
      diagramFilePath: string,
      customization: PersistedDiagramCustomization,
    ): Promise<void> {
      await mkdir(path.dirname(filePath), { recursive: true });
      const store = await readStore(filePath);
      store[diagramFilePath] = customization;
      await writeFile(filePath, JSON.stringify(store, null, 2), 'utf8');
    },
  };
}
