import { buildConfig } from '@picstash/eslint-config';

// NOTE: renderer は web-client のソースを参照しており、web-client 側で lint されるため除外
// vite.renderer.config.ts も Vite 設定のため型チェックは不要
export default [
  ...buildConfig({
    ruleSets: ['common', 'node', 'playwright'],
  }),
  {
    ignores: ['src/renderer/**/*', 'vite.renderer.config.ts'],
  },
];
