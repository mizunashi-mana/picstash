import { defineConfig } from 'eslint/config';
import promisePlugin from 'eslint-plugin-promise';

export function buildPromiseConfig() {
  return defineConfig([
  // @ts-expect-error -- Type compatibility issue between eslint-plugin-promise and eslint/config
    promisePlugin.configs['flat/recommended'],
    {
      rules: {
        'promise/always-return': ['error', { ignoreLastCallback: true }],
        'promise/no-promise-in-callback': 'error',
        '@typescript-eslint/require-await': 'off',
      },
    },
  ]);
}
