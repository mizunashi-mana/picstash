import { defineConfig } from 'eslint/config';
import pluginPlaywright from 'eslint-plugin-playwright';

export function buildPlaywrightConfig() {
  return defineConfig([
    pluginPlaywright.configs['flat/recommended'],
    {
      rules: {
        'playwright/no-conditional-in-test': 'error',
        'playwright/no-conditional-expect': 'error',
      },
    },
  ]);
}
