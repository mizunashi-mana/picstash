import { expect, fn, within } from 'storybook/test';
import { UrlCrawlTabView } from './UrlCrawlTabView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockSession = {
  sessionId: 'crawl-001',
  sourceUrl: 'https://example.com/gallery',
  pageTitle: 'サンプルギャラリー',
  imageCount: 4,
  images: [
    { index: 0, url: 'https://example.com/img1.jpg', filename: 'img1.jpg', alt: 'サンプル画像1' },
    { index: 1, url: 'https://example.com/img2.png', filename: 'img2.png', alt: 'サンプル画像2' },
    { index: 2, url: 'https://example.com/img3.jpg', filename: 'img3.jpg' },
    { index: 3, url: 'https://example.com/img4.gif', filename: 'img4.gif', alt: 'サンプル画像4' },
  ],
};

const meta = {
  title: 'Features/Import/UrlCrawlTabView',
  component: UrlCrawlTabView,
  args: {
    onSubmit: fn(),
    onClose: fn(),
    onSelectAll: fn(),
    onDeselectAll: fn(),
    onImport: fn(),
    onSelectionChange: fn(),
    onClearImportResult: fn(),
  },
} satisfies Meta<typeof UrlCrawlTabView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSession: Story = {
  args: {
    sessionId: null,
    session: undefined,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // URL 入力の説明が表示されていることを確認
    await expect(
      canvas.getByText('ウェブページの URL を入力して画像をクロール'),
    ).toBeInTheDocument();
  },
};

export const Crawling: Story = {
  args: {
    sessionId: null,
    session: undefined,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: true,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // URL 入力の説明が表示されていることを確認
    await expect(
      canvas.getByText('ウェブページの URL を入力して画像をクロール'),
    ).toBeInTheDocument();
  },
};

export const SessionLoading: Story = {
  args: {
    sessionId: 'crawl-001',
    session: undefined,
    isSessionLoading: true,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('ページを読み込み中...')).toBeInTheDocument();
  },
};

export const SessionWithImages: Story = {
  args: {
    sessionId: 'crawl-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set([0, 3]),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('サンプルギャラリー')).toBeInTheDocument();

    // 画像件数が表示されていることを確認
    await expect(canvas.getByText(/4\s*件の画像/)).toBeInTheDocument();

    // 選択コントロールが表示されていることを確認
    await expect(canvas.getByText('全選択')).toBeInTheDocument();
    await expect(canvas.getByText('全解除')).toBeInTheDocument();
    await expect(canvas.getByText(/2\s*件選択中/)).toBeInTheDocument();

    // 閉じるボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  },
};

export const Importing: Story = {
  args: {
    sessionId: 'crawl-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set([0, 1, 2, 3]),
    isImporting: true,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // インポートボタンがローディング状態であることを確認
    await expect(canvas.getByRole('button', { name: /インポート/ })).toBeInTheDocument();

    // ページタイトルが表示されていることを確認
    await expect(canvas.getByText('サンプルギャラリー')).toBeInTheDocument();
  },
};

export const ImportComplete: Story = {
  args: {
    sessionId: 'crawl-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: {
      totalRequested: 4,
      successCount: 4,
      failedCount: 0,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
        { index: 2, success: true, imageId: 'img-3' },
        { index: 3, success: true, imageId: 'img-4' },
      ],
    },
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // インポート完了のアラートが表示されていることを確認
    await expect(canvas.getByText('インポート完了')).toBeInTheDocument();
    await expect(canvas.getByText(/4\s*件インポート成功/)).toBeInTheDocument();

    // ギャラリーリンクが表示されていることを確認
    await expect(canvas.getByText('ギャラリーを見る')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    sessionId: 'crawl-001',
    session: undefined,
    isSessionLoading: false,
    sessionError: new globalThis.Error('セッションの読み込みに失敗しました'),
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText('セッションの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const CrawlError: Story = {
  args: {
    sessionId: null,
    session: undefined,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: new globalThis.Error('URL のクロールに失敗しました'),
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // URL 入力の説明が表示されていることを確認
    await expect(
      canvas.getByText('ウェブページの URL を入力して画像をクロール'),
    ).toBeInTheDocument();
  },
};

export const ImportPartialFailure: Story = {
  args: {
    sessionId: 'crawl-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: {
      totalRequested: 4,
      successCount: 3,
      failedCount: 1,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
        { index: 2, success: false, error: 'ダウンロードに失敗しました' },
        { index: 3, success: true, imageId: 'img-4' },
      ],
    },
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // インポート完了のアラートが表示されていることを確認
    await expect(canvas.getByText('インポート完了')).toBeInTheDocument();
    await expect(canvas.getByText(/3\s*件インポート成功/)).toBeInTheDocument();
    await expect(canvas.getByText(/1\s*件失敗/)).toBeInTheDocument();
  },
};

export const SessionWithNoTitle: Story = {
  args: {
    sessionId: 'crawl-002',
    session: {
      sessionId: 'crawl-002',
      sourceUrl: 'https://example.com/no-title-page',
      imageCount: 2,
      images: [
        { index: 0, url: 'https://example.com/a.jpg', filename: 'a.jpg' },
        { index: 1, url: 'https://example.com/b.jpg', filename: 'b.jpg' },
      ],
    },
    isSessionLoading: false,
    sessionError: null,
    isCrawling: false,
    crawlError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importResult: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // タイトルなしのフォールバックが表示されていることを確認
    await expect(canvas.getByText('タイトルなし')).toBeInTheDocument();
  },
};
