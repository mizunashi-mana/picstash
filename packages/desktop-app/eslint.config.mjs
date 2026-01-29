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
    // main/preload は @desktop-app/shared エイリアスで shared ディレクトリを参照
    // esbuild が解決するため import-x/no-unresolved を無効化
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
    rules: {
      'import-x/no-unresolved': 'off',
    },
  },
  {
    // preload は ipcRenderer.invoke が any を返すため、unsafe 関連ルールを緩和
    files: ['src/preload/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
  {
    // tests/main は Vitest のユニットテストのため、Playwright ルールを無効化
    // 動的インポートにより型が解決されないため unsafe 関連ルールも緩和
    files: ['tests/main/**/*.ts'],
    rules: {
      'playwright/no-standalone-expect': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
];
