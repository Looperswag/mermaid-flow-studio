import type { PersistedDiagramCustomization } from './diagram-customization';

export type ExportFormat = 'png' | 'jpg';
export type ExportQuality = 'low' | 'medium' | 'high';
export type ExportBackground = 'transparent' | 'paper';

export interface OpenFileResponse {
  path: string;
  contents: string;
}

export interface SaveImageRequest {
  bytes: ArrayBuffer;
  format: ExportFormat;
  suggestedName: string;
}

export interface SaveImageResponse {
  canceled: boolean;
  filePath?: string;
}

export interface DesktopBridge {
  openFile: () => Promise<OpenFileResponse | null>;
  loadDiagramCustomization: (filePath: string) => Promise<PersistedDiagramCustomization | null>;
  saveDiagramCustomization: (
    filePath: string,
    customization: PersistedDiagramCustomization,
  ) => Promise<void>;
  saveImage: (request: SaveImageRequest) => Promise<SaveImageResponse>;
}

export const electronChannels = {
  openFile: 'mermaid-flow:open-file',
  loadDiagramCustomization: 'mermaid-flow:load-diagram-customization',
  saveDiagramCustomization: 'mermaid-flow:save-diagram-customization',
  saveImage: 'mermaid-flow:save-image',
} as const;
