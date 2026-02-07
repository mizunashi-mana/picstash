import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rendererSrc = resolve(currentDir, '../src/renderer');

const config: StorybookConfig = {
  stories: ['../src/renderer/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-vitest'],
  viteFinal: async (viteConfig) => {
    return {
      ...viteConfig,
      resolve: {
        ...viteConfig.resolve,
        alias: {
          '@': rendererSrc,
        },
      },
    };
  },
};

export default config;
