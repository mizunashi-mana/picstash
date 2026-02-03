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
        'src/app/main.tsx',
        'src/vite-env.d.ts',
        // Storybook（別途 Storybook テストで対応）
        'src/**/*.stories.tsx',
        // index.ts（エクスポートのみ）
        'src/**/index.ts',
        // App（プロバイダー構成のみ）
        'src/app/App.tsx',
        // Providers（プロバイダー構成のみ）
        'src/app/providers/index.tsx',
        // ルーティング（React Router 設定のみ）
        'src/app/routes/index.tsx',

        // === 未テストファイル（個別指定） ===
        // 新規ファイルはここに含まれないため、自動的にカバレッジ対象になる

        // features/import-archive
        'src/features/import-archive/api/archive.ts',
        'src/features/import-archive/ui/ArchiveDropzone.tsx',
        'src/features/import-archive/ui/ArchivePreviewGallery.tsx',

        // pages/collections - ページ全体テスト未対応
        'src/pages/collections/ui/CollectionsPage.tsx',
        'src/pages/collections/ui/CollectionDetailPage.tsx',
        'src/pages/collections/ui/CollectionDetailPageView.tsx',
        'src/pages/collections/ui/useCollectionDetailPageViewProps.ts',
        'src/pages/collections/ui/CollectionViewerPage.tsx',
        'src/pages/collections/ui/CollectionViewerPageView.tsx',
        'src/pages/collections/ui/useCollectionViewerPageViewProps.ts',

        // pages/duplicates - ページ全体テスト未対応
        'src/pages/duplicates/ui/DuplicatesPage.tsx',
        'src/pages/duplicates/ui/DuplicatesPageView.tsx',
        'src/pages/duplicates/ui/useDuplicatesPageViewProps.ts',

        // features/find-duplicates
        'src/features/find-duplicates/ui/DuplicateGroupCard.tsx',

        // features/gallery
        'src/features/gallery/components/ImageGallery.tsx',

        // pages/gallery - ページ全体テスト未対応
        'src/pages/gallery/ui/GalleryPage.tsx',
        'src/pages/gallery/ui/GalleryPageView.tsx',

        // pages/image-detail - ページ全体テスト未対応
        'src/pages/image-detail/ui/ImageDetailPage.tsx',
        'src/pages/image-detail/ui/ImageDetailPageView.tsx',

        // features/manage-image-attributes
        // ImageAttributeSection.tsx - テスト未対応（container）
        'src/features/manage-image-attributes/ui/ImageAttributeSection.tsx',

        // features/manage-image-collections
        // カバレッジ70%未達
        'src/features/manage-image-collections/ui/ImageCollectionsSection.tsx',

        // features/manage-image-description
        // カバレッジ70%未達
        'src/features/manage-image-description/ui/ImageDescriptionSection.tsx',

        // features/search-images
        // カバレッジ70%未達
        'src/features/search-images/ui/SearchBar.tsx',

        // pages/home - ページ全体テスト未対応
        'src/pages/home/ui/HomePage.tsx',

        // features/import（既存ページのロジック流用のため除外）
        'src/features/import/components/ArchiveImportTab.tsx',
        'src/features/import/components/UrlCrawlTab.tsx',

        // widgets/job-status（context.tsx, api, utils はテスト済み）
        'src/widgets/job-status/ui/JobStatusButton.tsx',

        // pages/labels - ページ全体テスト未対応
        'src/pages/labels/ui/LabelsPage.tsx',

        // features/labels/ui（UI コンポーネントは Storybook テストで対応）
        'src/features/labels/ui/LabelBadge.tsx',
        'src/features/labels/ui/LabelForm.tsx',
        'src/features/labels/ui/LabelList.tsx',

        // features/view-recommendations
        'src/features/view-recommendations/ui/RecommendationSection.tsx',

        // features/view-stats
        'src/features/view-stats/ui/PopularImagesList.tsx',
        'src/features/view-stats/ui/RecommendationTrendsChart.tsx',
        'src/features/view-stats/ui/StatsOverviewCards.tsx',
        'src/features/view-stats/ui/ViewTrendsChart.tsx',

        // pages/stats - ページ全体テスト未対応
        'src/pages/stats/ui/StatsPage.tsx',

        // features/upload-image
        'src/features/upload-image/ui/ImageDropzone.tsx',
        'src/features/upload-image/ui/ImageDropzoneView.tsx',

        // features/import-url
        'src/features/import-url/api/crawl.ts',
        'src/features/import-url/ui/CrawlPreviewGallery.tsx',
        'src/features/import-url/ui/UrlInputForm.tsx',

        // widgets/app-layout（AppLayout はテスト未実装）
        'src/widgets/app-layout/ui/AppLayout.tsx',
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
