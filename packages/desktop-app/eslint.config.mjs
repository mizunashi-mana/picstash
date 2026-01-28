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
  {
    // main/preload は shared ディレクトリを相対パスで参照するため、no-restricted-imports を緩和
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // preload は ipcRenderer.invoke が any を返すため、unsafe 関連ルールを緩和
    files: ['src/preload/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
];
