import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import * as reactHooks from 'eslint-plugin-react-hooks';

export function buildReactConfig() {
  return defineConfig([
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs['recommended-latest'],
    {
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      rules: {
        'react/prop-types': 'off',
        'react-hooks/exhaustive-deps': 'error',
      },
    },
  ]);
}
