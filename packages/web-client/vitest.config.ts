import { resolve } from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    projects: [
      // Unit tests (jsdom)
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          include: ['tests/**/*.test.{ts,tsx}'],
          setupFiles: ['./tests/setup.ts'],
        },
      },
      // Storybook tests (browser mode)
      {
        extends: './vite.config.ts',
        plugins: [
          storybookTest({
            configDir: '.storybook',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // エントリーポイント
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Storybook ファイル
        'src/**/*.stories.tsx',
        // 全 feature（テスト未実装）
        'src/features/**/*.{ts,tsx}',
        // API クライアント（テスト未実装）
        'src/api/**/*.ts',
        // ルーティング
        'src/routes/**/*.tsx',
        // 共有コンポーネント・フック（テスト未実装）
        'src/shared/components/**/*.{ts,tsx}',
        'src/shared/hooks/**/*.{ts,tsx}',
        // App コンポーネント
        'src/App.tsx',
        // インデックスファイル
        'src/**/index.ts',
      ],
      thresholds: {
        perFile: true,
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
