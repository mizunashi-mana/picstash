import { buildConfig } from '@picstash/eslint-config';

export default [
  ...buildConfig({}),
  {
    // client/ ディレクトリは他パッケージから参照される interface 定義のため、
    // @/ エイリアスが解決できず ../ 相対パスを使用する
    files: ['src/client/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
