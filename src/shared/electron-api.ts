export type ExportFormat = 'png' | 'jpg';
export type ExportQuality = 'low' | 'medium' | 'high';
export type ExportBackground = 'transparent' | 'paper';

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
  openFile: () => Promise<string | null>;
  saveImage: (request: SaveImageRequest) => Promise<SaveImageResponse>;
}

export const electronChannels = {
  openFile: 'mermaid-flow:open-file',
  saveImage: 'mermaid-flow:save-image',
} as const;
