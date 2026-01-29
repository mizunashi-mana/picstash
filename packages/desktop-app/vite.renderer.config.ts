import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// desktop-app 独自の renderer ディレクトリを参照
const rendererSrc = resolve(__dirname, 'src/renderer');

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  root: resolve(__dirname, 'src/renderer'),
  base: './', // Electron で file:// プロトコルを使うため相対パスに
  resolve: {
    alias: {
      '@': rendererSrc,
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  server: {
    port: 5174, // web-client と競合しないようにポートを変更
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
