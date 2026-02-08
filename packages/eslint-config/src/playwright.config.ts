import { defineConfig } from 'eslint/config';
import pluginPlaywright from 'eslint-plugin-playwright';

export function buildPlaywrightConfig(props: {
  files?: string[];
}) {
  return defineConfig([
    {
      ...pluginPlaywright.configs['flat/recommended'],
      ...(props.files === undefined
        ? {}
        : {
            files: props.files,
          }),
      rules: {
        ...pluginPlaywright.configs['flat/recommended'].rules,
        'playwright/no-conditional-in-test': 'error',
        'playwright/no-conditional-expect': 'error',
        'playwright/expect-expect': 'error',
      },
    },
  ]);
}
