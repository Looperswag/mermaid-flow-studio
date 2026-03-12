import type { PersistedDiagramCustomization } from '@shared/diagram-customization';

export function buildDefaultCustomization(): PersistedDiagramCustomization {
  return {
    paletteId: 'studio-default',
    direction: 'down',
    layoutMode: 'fixed',
    layoutsByDirection: {},
    lastSourceHash: '',
    updatedAt: '',
  };
}
