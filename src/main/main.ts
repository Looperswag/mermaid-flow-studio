import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { app, BrowserWindow, dialog, ipcMain } from 'electron';

import { createCustomizationStore } from './customizationStore';
import { electronChannels, type SaveImageRequest } from '../shared/electron-api';
import type { PersistedDiagramCustomization } from '../shared/diagram-customization';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isMac = process.platform === 'darwin';
const customizationStore = createCustomizationStore(app.getPath('userData'));

async function openMermaidFile() {
  const window = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(window ?? undefined, {
    properties: ['openFile'],
    filters: [
      { name: 'Mermaid Files', extensions: ['mmd', 'mermaid', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  return {
    path: filePath,
    contents: await fs.readFile(filePath, 'utf8'),
  };
}

async function saveImageAsset(request: SaveImageRequest) {
  const window = BrowserWindow.getFocusedWindow();
  const extension = request.format === 'jpg' ? 'jpg' : 'png';
  const defaultPath = `${request.suggestedName}.${extension}`;
  const result = await dialog.showSaveDialog(window ?? undefined, {
    defaultPath,
    filters: [
      {
        name: request.format === 'jpg' ? 'JPEG Image' : 'PNG Image',
        extensions: [extension],
      },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true } as const;
  }

  await fs.writeFile(result.filePath, Buffer.from(request.bytes));
  return {
    canceled: false,
    filePath: result.filePath,
  } as const;
}

async function loadDiagramCustomization(filePath: string) {
  return customizationStore.load(filePath);
}

async function saveDiagramCustomization(
  filePath: string,
  customization: PersistedDiagramCustomization,
) {
  await customizationStore.save(filePath, customization);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: 'Mermaid Flow Studio',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f4ede2',
    trafficLightPosition: { x: 18, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle(electronChannels.openFile, openMermaidFile);
  ipcMain.handle(electronChannels.loadDiagramCustomization, (_event, filePath: string) =>
    loadDiagramCustomization(filePath),
  );
  ipcMain.handle(
    electronChannels.saveDiagramCustomization,
    (_event, filePath: string, customization: PersistedDiagramCustomization) =>
      saveDiagramCustomization(filePath, customization),
  );
  ipcMain.handle(electronChannels.saveImage, (_event, request: SaveImageRequest) =>
    saveImageAsset(request),
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});
