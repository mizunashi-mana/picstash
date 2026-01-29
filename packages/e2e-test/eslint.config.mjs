import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  ruleSets: ['common', 'playwright'],
  e2eTestFiles: ['tests/**/*.spec.ts'],
});
