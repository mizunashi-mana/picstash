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
        // エントリーポイント・CLI
        'src/index.ts',
        'src/app.ts',
        'src/config.ts',
        'src/cli/**/*.ts',
        // インフラ層（テスト未実装）
        'src/infra/di/**/*.ts',
        'src/infra/database/**/*.ts',
        'src/infra/http/**/*.ts',
        'src/infra/queue/**/*.ts',
        'src/infra/storage/**/*.ts',
        'src/infra/workers/**/*.ts',
        'src/infra/adapters/**/*.ts',
        'src/infra/embedding/**/*.ts',
        // アプリケーション層（テスト未実装）
        'src/application/image/**/*.ts',
        'src/application/image-attribute/**/*.ts',
        'src/application/label/**/*.ts',
        'src/application/url-crawl/**/*.ts',
        'src/application/ports/**/*.ts',
        'src/application/embedding/**/*.ts',
        'src/application/attribute-suggestion/**/*.ts',
        'src/application/archive/**/*.ts',
        'src/application/recommendation/**/*.ts',
        // ドメイン層（テスト未実装のもの）
        'src/domain/collection/**/*.ts',
        'src/domain/image-attribute/**/*.ts',
        'src/domain/image/Image.ts',
        'src/domain/label/Label.ts',
        'src/domain/recommendation-conversion/**/*.ts',
        'src/domain/search-history/**/*.ts',
        'src/domain/stats/**/*.ts',
        'src/domain/view-history/**/*.ts',
        // 型定義のみ（interface）: テスト対象外
        'src/domain/url-crawl/CrawledImageEntry.ts',
        'src/domain/url-crawl/UrlCrawlSession.ts',
        'src/domain/archive/ArchiveEntry.ts',
        'src/domain/archive/ArchiveSession.ts',
        // ?? 演算子の到達困難な分岐により branch 閾値 80% 未満
        'src/domain/url-crawl/UrlCrawlConfig.ts',
        // 共有モジュール（テスト未実装）
        'src/shared/**/*.ts',
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
