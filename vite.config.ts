import path from 'node:path';

import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/main.ts',
      },
      preload: {
        input: path.join(__dirname, 'src/main/preload.ts'),
      },
    }),
  ],
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/renderer/test/setup.ts',
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
