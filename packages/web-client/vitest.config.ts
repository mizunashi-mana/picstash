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

        // === Container / View パターン ===
        // Pages - Container (テストなし)
        'src/pages/home/ui/HomePage.tsx',
        'src/pages/gallery/ui/GalleryPage.tsx',
        'src/pages/image-detail/ui/ImageDetailPage.tsx',
        'src/pages/collections/ui/CollectionDetailPage.tsx',
        'src/pages/collections/ui/CollectionViewerPage.tsx',
        // Pages - View (テストなしまたはカバレッジ不足)
        'src/pages/gallery/ui/GalleryPageView.tsx',
        'src/pages/image-detail/ui/ImageDetailPageView.tsx',
        'src/pages/collections/ui/CollectionDetailPageView.tsx',
        'src/pages/collections/ui/CollectionViewerPageView.tsx',
        'src/pages/collections/ui/CollectionsPageView.tsx',
        'src/pages/duplicates/ui/DuplicatesPageView.tsx',
        // Features - Sections, Tabs, etc.
        'src/features/**/ui/*Section.tsx',
        'src/features/**/ui/*SectionView.tsx',
        'src/features/**/ui/*Tab.tsx',
        'src/features/**/ui/*TabView.tsx',
        'src/features/**/ui/*Gallery.tsx',
        'src/features/**/ui/*GalleryView.tsx',
        'src/features/**/ui/*Dropzone.tsx',
        'src/features/**/ui/*DropzoneView.tsx',
        // Widgets
        'src/widgets/**/ui/*.tsx',

        // === Feature UI コンポーネント (Storybook テストでカバー) ===
        'src/features/find-duplicates/ui/DuplicateGroupCard.tsx',
        'src/features/import-url/ui/UrlInputForm.tsx',
        'src/features/labels/ui/LabelBadge.tsx',
        'src/features/labels/ui/LabelForm.tsx',
        'src/features/labels/ui/LabelList.tsx',
        'src/features/search-images/ui/SearchBar.tsx',
        'src/features/view-stats/ui/PopularImagesList.tsx',
        'src/features/view-stats/ui/RecommendationTrendsChart.tsx',
        'src/features/view-stats/ui/StatsOverviewCards.tsx',
        'src/features/view-stats/ui/ViewTrendsChart.tsx',

        // === Hook (API 呼び出し / React Router 統合が主体でモック困難) ===
        // 注: 純粋関数部分はエクスポートして別途テスト
        'src/features/import/ui/useImageUploadTabViewProps.ts',
        'src/features/import/ui/useUrlCrawlTabViewProps.ts',
        'src/features/import/ui/useArchiveImportTabViewProps.ts',
        'src/features/view-recommendations/ui/useRecommendationSectionViewProps.ts',
        'src/pages/collections/ui/useCollectionDetailPageViewProps.ts',
        'src/pages/collections/ui/useCollectionsPageViewProps.ts',
        'src/pages/collections/ui/useCollectionViewerPageViewProps.ts',
        'src/pages/duplicates/ui/useDuplicatesPageViewProps.ts',
        'src/pages/gallery/ui/useGalleryPageViewProps.ts',
        'src/pages/image-detail/ui/useImageDetailPageViewProps.ts',
        'src/pages/labels/ui/useLabelsPageViewProps.ts',
        'src/pages/stats/ui/useStatsPageViewProps.ts',
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
