export type DiagramDirection = 'down' | 'up' | 'right' | 'left';
export type DiagramLayoutMode = 'fixed' | 'free';

export interface PersistedNodeLayout {
  x: number;
  y: number;
}

export interface PersistedDiagramCustomization {
  paletteId: string;
  direction: DiagramDirection;
  layoutMode: DiagramLayoutMode;
  layoutsByDirection: Partial<Record<DiagramDirection, Record<string, PersistedNodeLayout>>>;
  lastSourceHash: string;
  updatedAt: string;
}
