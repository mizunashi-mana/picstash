import { defineConfig } from 'eslint/config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export function buildReactConfig() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- eslint-plugin-react types are incorrectly nullable
  const reactRecommended = react.configs.flat.recommended!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- eslint-plugin-react types are incorrectly nullable
  const reactJsxRuntime = react.configs.flat['jsx-runtime']!;

  return defineConfig([
    reactRecommended,
    reactJsxRuntime,
    reactHooks.configs.flat['recommended-latest'],
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
