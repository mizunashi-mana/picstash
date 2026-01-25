import { buildConfig } from '@picstash/eslint-config';

export default [
  {
    ignores: ['dist/**', 'release/**', 'playwright-report/**', 'test-results/**'],
  },
  ...buildConfig({
    ruleSets: ['common', 'node', 'playwright'],
  }),
];
