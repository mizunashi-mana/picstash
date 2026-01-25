import { buildConfig } from '@picstash/eslint-config';

export default [
  {
    ignores: ['dist/**', 'release/**'],
  },
  ...buildConfig({}),
];
