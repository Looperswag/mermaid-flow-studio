import path from 'node:path';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import electron from 'vite-plugin-electron/simple';
import { defineConfig } from 'vitest/config';

// Inject a strict Content-Security-Policy meta tag into the production build only.
// Dev is skipped because Vite's HMR client relies on inline scripts / eval / websockets,
// which a strict `script-src 'self'` would break. The production bundle ships self-hosted
// JS with no inline/eval, so `script-src 'self'` holds. 'unsafe-inline' is allowed for
// styles only (React + Mermaid inject inline styles); scripts stay locked down.
function contentSecurityPolicy(): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    // frame-ancestors is intentionally omitted: it is ignored when delivered via <meta>.
  ].join('; ');

  return {
    name: 'inject-csp',
    transformIndexHtml(html, ctx) {
      if (ctx.server) {
        return html; // dev server: leave HMR untouched
      }
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    contentSecurityPolicy(),
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
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**', 'tests/e2e/**'],
  },
});
