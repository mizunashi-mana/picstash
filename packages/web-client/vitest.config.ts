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
        // エントリーポイント（テスト不要）
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Storybook（別途 Storybook テストで対応）
        'src/**/*.stories.tsx',
        // index.ts（エクスポートのみ）
        'src/**/index.ts',
        // App（プロバイダー構成のみ）
        'src/App.tsx',
        // ルーティング（React Router 設定のみ）
        'src/routes/index.tsx',

        // === 未テストファイル（個別指定） ===
        // 新規ファイルはここに含まれないため、自動的にカバレッジ対象になる

        // features/archive-import
        'src/features/archive-import/api.ts',
        'src/features/archive-import/components/ArchiveDropzone.tsx',
        'src/features/archive-import/components/ArchivePreviewGallery.tsx',

        // features/collections
        'src/features/collections/api.ts',
        'src/features/collections/pages/CollectionDetailPage.tsx',
        'src/features/collections/pages/CollectionViewerPage.tsx',
        'src/features/collections/pages/CollectionsPage.tsx',

        // features/duplicates
        'src/features/duplicates/api.ts',
        'src/features/duplicates/components/DuplicateGroupCard.tsx',
        'src/features/duplicates/pages/DuplicatesPage.tsx',

        // features/gallery
        'src/features/gallery/api.ts',
        'src/features/gallery/components/ImageAttributeSection.tsx',
        'src/features/gallery/components/ImageAttributeSectionView.tsx',
        'src/features/gallery/components/ImageCarousel.tsx',
        'src/features/gallery/components/ImageCollectionsSection.tsx',
        'src/features/gallery/components/ImageDescriptionSection.tsx',
        'src/features/gallery/components/ImageDescriptionSectionView.tsx',
        'src/features/gallery/components/ImageGallery.tsx',
        'src/features/gallery/components/ImageGalleryView.tsx',
        'src/features/gallery/components/SearchBar.tsx',
        'src/features/gallery/components/SimilarImagesSection.tsx',
        'src/features/gallery/components/SimilarImagesSectionView.tsx',
        'src/features/gallery/pages/GalleryPage.tsx',
        'src/features/gallery/pages/ImageDetailPage.tsx',

        // features/home
        'src/features/home/pages/HomePage.tsx',

        // features/import（既存ページのロジック流用のため除外）
        'src/features/import/components/ArchiveImportTab.tsx',
        'src/features/import/components/UrlCrawlTab.tsx',

        // features/jobs（context.tsx, api.ts, utils.ts はテスト済み）
        'src/features/jobs/components/JobStatusButton.tsx',

        // features/labels
        'src/features/labels/api.ts',
        'src/features/labels/components/LabelBadge.tsx',
        'src/features/labels/components/LabelForm.tsx',
        'src/features/labels/components/LabelList.tsx',
        'src/features/labels/pages/LabelsPage.tsx',

        // features/recommendations
        'src/features/recommendations/api.ts',
        'src/features/recommendations/components/RecommendationSection.tsx',

        // features/stats
        'src/features/stats/api.ts',
        'src/features/stats/components/PopularImagesList.tsx',
        'src/features/stats/components/RecommendationTrendsChart.tsx',
        'src/features/stats/components/StatsOverviewCards.tsx',
        'src/features/stats/components/ViewTrendsChart.tsx',
        'src/features/stats/pages/StatsPage.tsx',

        // features/upload
        'src/features/upload/api.ts',
        'src/features/upload/components/ImageDropzone.tsx',
        'src/features/upload/components/ImageDropzoneView.tsx',

        // features/url-crawl
        'src/features/url-crawl/api.ts',
        'src/features/url-crawl/components/CrawlPreviewGallery.tsx',
        'src/features/url-crawl/components/UrlInputForm.tsx',

        // shared/components（AppLayout はテスト未実装）
        'src/shared/components/AppLayout.tsx',
      ],
      thresholds: {
        perFile: true,
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
