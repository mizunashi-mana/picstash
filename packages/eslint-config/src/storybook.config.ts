import { defineConfig } from 'eslint/config';
import storybook from 'eslint-plugin-storybook';

export function buildStorybookConfig() {
  return defineConfig([
    storybook.configs['flat/recommended'],
  ]);
}
