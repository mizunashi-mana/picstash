import { buildConfig } from '@picstash/eslint-config';

// NOTE: renderer は web-client のソースを参照しているが、desktop-app 固有のエントリもあるため lint 対象に含める
// vite.renderer.config.ts は Vite の設定ファイルのため lint 対象外とする
export default [
  ...buildConfig({
    ruleSets: ['common', 'node', 'react', 'playwright'],
  }),
  {
    ignores: ['vite.renderer.config.ts'],
  },
  {
    // renderer は @/ エイリアスで web-client のソースを参照するため、import 解決を無効化
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'import-x/no-unresolved': 'off',
    },
  },
];
