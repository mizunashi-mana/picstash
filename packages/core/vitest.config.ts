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
        'src/config.ts',
        // インフラ層: DI
        'src/infra/di/core-container.ts',
        // インフラ層: Database
        'src/infra/database/prisma.ts',
        'src/infra/database/sqlite-vec.ts',
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
    },
  },
});
