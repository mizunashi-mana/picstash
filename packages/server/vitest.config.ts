import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
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
        // インフラ層: DI
        'src/infra/di/app-container.ts',
        'src/infra/di/container.ts',
        // インフラ層: Database
        'src/infra/database/prisma.ts',
        'src/infra/database/sqlite-vec.ts',
        'src/infra/database/image-repository.ts',
        'src/infra/database/image-attribute-repository.ts',
        'src/infra/database/label-repository.ts',
        // インフラ層: HTTP（コントローラー・プラグイン・ルート）
        'src/infra/http/controllers/archive-controller.ts',
        'src/infra/http/controllers/collection-controller.ts',
        'src/infra/http/controllers/image-attribute-controller.ts',
        'src/infra/http/controllers/image-controller.ts',
        'src/infra/http/controllers/job-controller.ts',
        'src/infra/http/controllers/label-controller.ts',
        'src/infra/http/controllers/recommendation-controller.ts',
        'src/infra/http/controllers/recommendation-conversion-controller.ts',
        'src/infra/http/controllers/search-controller.ts',
        'src/infra/http/controllers/stats-controller.ts',
        'src/infra/http/controllers/url-crawl-controller.ts',
        'src/infra/http/controllers/view-history-controller.ts',
        'src/infra/http/plugins/cors.ts',
        'src/infra/http/plugins/multipart.ts',
        'src/infra/http/plugins/rate-limit.ts',
        'src/infra/http/routes/health.ts',
        'src/infra/http/routes/index.ts',
        // インフラ層: Queue/Workers
        'src/infra/queue/job-worker.ts',
        'src/infra/workers/caption-worker.ts',
        // インフラ層: Storage
        'src/infra/storage/file-storage.ts',
        'src/infra/storage/image-processor.ts',
        // インフラ層: Adapters（テスト未実装または外部依存が強い）
        'src/infra/adapters/prisma-collection-repository.ts',
        'src/infra/adapters/prisma-image-repository.ts',
        'src/infra/adapters/prisma-job-queue.ts',
        'src/infra/adapters/prisma-stats-repository.ts',
        'src/infra/adapters/sharp-image-processor.ts',
        'src/infra/adapters/sqlite-vec-embedding-repository.ts',
        'src/infra/adapters/in-memory-url-crawl-session-manager.ts',
        // インフラ層: Archive（RARファイル生成ツール依存のためテスト困難）
        'src/infra/adapters/rar-archive-handler.ts',
        // インフラ層: Embedding
        'src/infra/embedding/clip-embedding-service.ts',
        // インデックスファイル（再エクスポートのみ）
        'src/**/index.ts',
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
