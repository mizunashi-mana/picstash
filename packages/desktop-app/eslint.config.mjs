import { buildConfig } from '@picstash/eslint-config';

// NOTE: renderer は web-client のソースを参照しているが、desktop-app 固有のエントリもあるため lint 対象に含める
export default [
  ...buildConfig({
    // playwright は e2e テストのみに適用するため、ここでは含めない
    ruleSets: ['common', 'node', 'react'],
    e2eTestFiles: [
      'tests/e2e/**/*.spec.ts',
    ],
  }),
  {
    // renderer はブラウザ環境で動作するため、node-builtins チェックと import 解決を無効化
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'import-x/no-unresolved': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
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
];
