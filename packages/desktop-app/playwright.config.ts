import { defineConfig } from '@playwright/test';

const isCI = process.env.CI !== undefined;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: 0, // Electron テストではリトライ時にアプリ再起動がタイムアウトするため無効化
  workers: 1,
  reporter: [
    ['list', {}],
    ['html', { open: 'never' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  timeout: 60000,
});
