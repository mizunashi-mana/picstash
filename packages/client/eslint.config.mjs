import { buildConfig } from '@picstash/eslint-config';

export default buildConfig({
  environment: 'browser',
  ruleSets: ['common', 'react'],
});
