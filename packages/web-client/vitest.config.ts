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
          include: ['tests/unit/**/*.test.{ts,tsx}'],
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

        // pages/collections - View Props パターン適用済み（Storybook テストで対応）
        'src/pages/collections/ui/CollectionsPage.tsx',
        'src/pages/collections/ui/CollectionsPageView.tsx',
        'src/pages/collections/ui/useCollectionsPageViewProps.ts',
        'src/pages/collections/ui/CollectionDetailPage.tsx',
        'src/pages/collections/ui/CollectionDetailPageView.tsx',
        'src/pages/collections/ui/useCollectionDetailPageViewProps.ts',
        'src/pages/collections/ui/CollectionViewerPage.tsx',
        'src/pages/collections/ui/CollectionViewerPageView.tsx',
        'src/pages/collections/ui/useCollectionViewerPageViewProps.ts',

        // pages/duplicates - View Props パターン適用済み（Storybook テストで対応）
        'src/pages/duplicates/ui/DuplicatesPage.tsx',
        'src/pages/duplicates/ui/DuplicatesPageView.tsx',
        'src/pages/duplicates/ui/useDuplicatesPageViewProps.ts',

        // features/find-duplicates
        'src/features/find-duplicates/ui/DuplicateGroupCard.tsx',

        // features/gallery
        'src/features/gallery/ui/ImageGallery.tsx',

        // pages/gallery - View Props パターン適用済み（Storybook テストで対応）
        'src/pages/gallery/ui/GalleryPage.tsx',
        'src/pages/gallery/ui/GalleryPageView.tsx',
        'src/pages/gallery/ui/useGalleryPageViewProps.ts',

        // pages/image-detail - View Props パターン適用済み（Storybook テストで対応）
        'src/pages/image-detail/ui/ImageDetailPage.tsx',
        'src/pages/image-detail/ui/ImageDetailPageView.tsx',
        'src/pages/image-detail/ui/useImageDetailPageViewProps.ts',

        // features/manage-image-attributes（container は Storybook テストで対応）
        'src/features/manage-image-attributes/ui/ImageAttributeSection.tsx',

        // features/manage-image-collections - View Props パターン適用済み（Storybook テストで対応）
        'src/features/manage-image-collections/ui/ImageCollectionsSection.tsx',
        'src/features/manage-image-collections/ui/ImageCollectionsSectionView.tsx',
        'src/features/manage-image-collections/ui/useImageCollectionsSectionViewProps.ts',

        // features/manage-image-description（container は Storybook テストで対応）
        'src/features/manage-image-description/ui/ImageDescriptionSection.tsx',

        // features/search-images
        'src/features/search-images/ui/SearchBar.tsx',

        // pages/home - ページ全体テスト未対応
        'src/pages/home/ui/HomePage.tsx',

        // features/import - View Props パターン適用済み（Storybook テストで対応）
        'src/features/import/ui/ArchiveImportTab.tsx',
        'src/features/import/ui/ArchiveImportTabView.tsx',
        'src/features/import/ui/useArchiveImportTabViewProps.ts',
        'src/features/import/ui/UrlCrawlTab.tsx',
        'src/features/import/ui/UrlCrawlTabView.tsx',
        'src/features/import/ui/useUrlCrawlTabViewProps.ts',
        'src/features/import/ui/ImageUploadTab.tsx',
        'src/features/import/ui/ImageUploadTabView.tsx',
        'src/features/import/ui/useImageUploadTabViewProps.ts',

        // widgets/job-status（context.tsx, api, utils はテスト済み）
        'src/widgets/job-status/ui/JobStatusButton.tsx',

        // pages/labels - View Props パターン適用済み（Storybook テストで対応）
        'src/pages/labels/ui/LabelsPage.tsx',
        'src/pages/labels/ui/LabelsPageView.tsx',
        'src/pages/labels/ui/useLabelsPageViewProps.ts',

        // features/labels/ui（UI コンポーネントは Storybook テストで対応）
        'src/features/labels/ui/LabelBadge.tsx',
        'src/features/labels/ui/LabelForm.tsx',
        'src/features/labels/ui/LabelList.tsx',

        // features/view-recommendations - View Props パターン適用済み（Storybook テストで対応）
        'src/features/view-recommendations/ui/RecommendationSection.tsx',
        'src/features/view-recommendations/ui/RecommendationSectionView.tsx',
        'src/features/view-recommendations/ui/useRecommendationSectionViewProps.ts',

        // features/view-stats
        'src/features/view-stats/ui/PopularImagesList.tsx',
        'src/features/view-stats/ui/RecommendationTrendsChart.tsx',
        'src/features/view-stats/ui/StatsOverviewCards.tsx',
        'src/features/view-stats/ui/ViewTrendsChart.tsx',

        // pages/stats - View Props パターン適用済み（Storybook テストで対応）
        'src/pages/stats/ui/StatsPage.tsx',
        'src/pages/stats/ui/StatsPageView.tsx',
        'src/pages/stats/ui/useStatsPageViewProps.ts',

        // features/upload-image
        'src/features/upload-image/ui/ImageDropzone.tsx',
        'src/features/upload-image/ui/ImageDropzoneView.tsx',

        // features/import-url - View Props パターン適用済み（Storybook テストで対応）
        'src/features/import-url/api/crawl.ts',
        'src/features/import-url/ui/CrawlPreviewGallery.tsx',
        'src/features/import-url/ui/CrawlPreviewGalleryView.tsx',
        'src/features/import-url/ui/useCrawlPreviewGalleryViewProps.ts',
        'src/features/import-url/ui/UrlInputForm.tsx',

        // features/find-similar-images（Storybook テストで対応）
        'src/features/find-similar-images/ui/SimilarImagesSection.tsx',
        'src/features/find-similar-images/ui/SimilarImagesSectionView.tsx',

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
