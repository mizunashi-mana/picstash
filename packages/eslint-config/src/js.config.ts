import eslintJs from '@eslint/js';
import { defineConfig } from 'eslint/config';

// These globals are restricted in Node.js environment to encourage better patterns
// In browser environment, these are legitimate APIs
const restrictedGlobals = [
  {
    name: 'window',
    message: 'Avoid using window global directly. Consider injection or specific imports.',
  },
  {
    name: 'document',
    message: 'Avoid using document global directly. Consider React refs or DOM utilities.',
  },
  {
    name: 'crypto',
    message: 'Avoid using crypto global directly. Consider explicit imports.',
  },
  {
    name: 'navigator',
    message: 'Avoid using navigator global directly. Consider injection for testing.',
  },
];

export function buildJsConfig(props: {
  entrypointFiles: string[];
}) {
  return defineConfig([
    eslintJs.configs.recommended,
    {
      rules: {
        // Complexity and maintainability
        'complexity': ['error', { max: 20 }],
        'max-lines': ['error', { max: 450, skipBlankLines: true, skipComments: true }],
        'max-depth': ['error', 5],
        'max-nested-callbacks': ['error', 3],

        // Best practices
        'eqeqeq': ['error', 'always', { null: 'ignore' }],
        'no-console': 'error',
        'no-alert': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-iterator': 'error',
        'no-labels': 'error',
        'no-lone-blocks': 'error',
        'no-multi-str': 'error',
        'no-new': 'error',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-octal-escape': 'error',
        'no-proto': 'error',
        'no-return-assign': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-useless-call': 'error',
        'no-useless-concat': 'error',
        'no-void': 'error',
        'prefer-promise-reject-errors': 'error',
        'radix': 'error',
        'yoda': 'error',

        // Variable declarations
        'no-var': 'error',
        'prefer-const': 'error',
        'no-shadow': 'off', // Use @typescript-eslint/no-shadow instead

        // Restricted globals
        'no-restricted-globals': ['error', ...restrictedGlobals.filter(item => !['window', 'document'].includes(item.name))],

        // Import path restrictions (absolute paths with @)
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../*'],
                message: 'Use absolute imports with @ prefix instead of relative paths.',
              },
            ],
          },
        ],
      },
    },
    {
      files: props.entrypointFiles,
      rules: {
        'no-restricted-globals': ['error', ...restrictedGlobals],
      },
    },
    // Storybook files can use console and alert
    {
      files: ['**/*.stories.{ts,tsx}'],
      rules: {
        'no-console': 'off',
        'no-alert': 'off',
      },
    },
    // Test files can have more nested callbacks
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        'max-nested-callbacks': ['error', 4],
      },
    },
    // Config files can use relative imports
    {
      files: ['eslint/**/*.mjs', '*.config.{js,mjs,ts}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ]);
}
