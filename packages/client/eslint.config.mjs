import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  disableFixedRules: false,
  ruleSets: ['common', 'react'],
});
