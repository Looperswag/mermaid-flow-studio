import { contextBridge, ipcRenderer } from 'electron';

import {
  electronChannels,
  type DesktopBridge,
  type OpenFileResponse,
  type SaveImageRequest,
  type SaveImageResponse,
} from '../shared/electron-api';
import type { PersistedDiagramCustomization } from '../shared/diagram-customization';

const bridge: DesktopBridge = {
  openFile: () => ipcRenderer.invoke(electronChannels.openFile) as Promise<OpenFileResponse | null>,
  loadDiagramCustomization: (filePath: string) =>
    ipcRenderer.invoke(
      electronChannels.loadDiagramCustomization,
      filePath,
    ) as Promise<PersistedDiagramCustomization | null>,
  saveDiagramCustomization: (filePath: string, customization: PersistedDiagramCustomization) =>
    ipcRenderer.invoke(electronChannels.saveDiagramCustomization, filePath, customization) as Promise<void>,
  saveImage: (request: SaveImageRequest) =>
    ipcRenderer.invoke(electronChannels.saveImage, request) as Promise<SaveImageResponse>,
};

contextBridge.exposeInMainWorld('mermaidApp', bridge);
