/// <reference types="vite/client" />

import type { DesktopBridge } from '@shared/electron-api';

declare global {
  interface Window {
    mermaidApp?: DesktopBridge;
  }
}

export {};
