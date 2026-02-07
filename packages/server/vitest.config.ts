import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@~generated': resolve(__dirname, 'generated'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        // エントリーポイント・設定
        'src/index.ts',
        'src/app.ts',
        'src/config.ts',
        // CLI コマンド
        'src/cli/generate-embeddings.ts',
        'src/cli/generate-label-embeddings.ts',
        // インフラ層: データベース
        'src/infra/database/prisma-service.ts',
        // インフラ層: DI
        'src/infra/di/app-container.ts',
        'src/infra/di/container.ts',
        // インフラ層: HTTP コントローラー
        'src/infra/http/controllers/archive-controller.ts',
        'src/infra/http/controllers/collection-controller.ts',
        'src/infra/http/controllers/image-attribute-controller.ts',
        'src/infra/http/controllers/job-controller.ts',
        'src/infra/http/controllers/label-controller.ts',
        'src/infra/http/controllers/recommendation-controller.ts',
        'src/infra/http/controllers/recommendation-conversion-controller.ts',
        'src/infra/http/controllers/search-controller.ts',
        'src/infra/http/controllers/stats-controller.ts',
        'src/infra/http/controllers/url-crawl-controller.ts',
        'src/infra/http/controllers/view-history-controller.ts',
        // インフラ層: HTTP プラグイン
        'src/infra/http/plugins/cors.ts',
        'src/infra/http/plugins/multipart.ts',
        'src/infra/http/plugins/rate-limit.ts',
        // インフラ層: HTTP ルート
        'src/infra/http/routes/health.ts',
        'src/infra/http/routes/index.ts',
      ],
      thresholds: {
        perFile: true,
        lines: 70,
        branches: 70,
        functions: 65,
        statements: 70,
      },
    },
  },
});
