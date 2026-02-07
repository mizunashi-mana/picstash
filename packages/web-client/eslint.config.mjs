import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  ruleSets: ['common', 'react', 'storybook', 'playwright'],
  e2eTestFiles: ['tests/e2e/**/*.spec.ts'],
});
