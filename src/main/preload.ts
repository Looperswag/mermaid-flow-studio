import { contextBridge, ipcRenderer } from 'electron';

import {
  electronChannels,
  type DesktopBridge,
  type SaveImageRequest,
  type SaveImageResponse,
} from '../shared/electron-api';

const bridge: DesktopBridge = {
  openFile: () => ipcRenderer.invoke(electronChannels.openFile),
  saveImage: (request: SaveImageRequest) =>
    ipcRenderer.invoke(electronChannels.saveImage, request) as Promise<SaveImageResponse>,
};

contextBridge.exposeInMainWorld('mermaidApp', bridge);
