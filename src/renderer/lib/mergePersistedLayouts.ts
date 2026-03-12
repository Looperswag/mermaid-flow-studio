import type { PersistedNodeLayout } from '@shared/diagram-customization';

export function mergePersistedLayouts(input: {
  nodeKeys: string[];
  persistedLayouts: Record<string, PersistedNodeLayout>;
}) {
  return Object.fromEntries(
    input.nodeKeys
      .filter((nodeKey) => nodeKey in input.persistedLayouts)
      .map((nodeKey) => [nodeKey, input.persistedLayouts[nodeKey]]),
  );
}
