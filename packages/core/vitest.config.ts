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
        // インフラ層: DI（コンテナ設定）
        'src/infra/di/core-container.ts',
        // インフラ層: Database（DB接続）
        'src/infra/database/prisma.ts',
        'src/infra/database/prisma-service.ts',
        // インフラ層: 外部サービス依存（モック困難）
        'src/infra/caption/transformers-caption-service.ts',
        'src/infra/embedding/clip-embedding-service.ts',
        'src/infra/llm/ollama-llm-service.ts',
        'src/infra/ocr/tesseract-ocr-service.ts',
        // インフラ層: Prismaリポジトリ（DB統合テスト向け）
        'src/infra/adapters/prisma-collection-repository.ts',
        'src/infra/adapters/prisma-image-attribute-repository.ts',
        'src/infra/adapters/prisma-image-repository.ts',
        'src/infra/adapters/prisma-job-queue.ts',
        'src/infra/adapters/prisma-label-repository.ts',
        'src/infra/adapters/prisma-recommendation-conversion-repository.ts',
        'src/infra/adapters/prisma-search-history-repository.ts',
        'src/infra/adapters/prisma-stats-repository.ts',
        'src/infra/adapters/prisma-view-history-repository.ts',
        'src/infra/adapters/sqlite-vec-embedding-repository.ts',
        // インフラ層: その他外部依存
        'src/infra/adapters/sharp-image-processor.ts',
        'src/infra/adapters/rar-archive-handler.ts',
      ],
    },
  },
});
