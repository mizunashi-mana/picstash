import { expect, fn, within } from 'storybook/test';
import { ArchiveImportTabView } from './ArchiveImportTabView';
import type { Meta, StoryObj } from '@storybook/react-vite';

const mockSession = {
  sessionId: 'session-001',
  filename: 'photos.zip',
  archiveType: 'zip',
  imageCount: 5,
  images: [
    { index: 0, filename: 'photo1.jpg', path: 'photos/photo1.jpg', size: 102400 },
    { index: 1, filename: 'photo2.jpg', path: 'photos/photo2.jpg', size: 204800 },
    { index: 2, filename: 'photo3.png', path: 'photos/photo3.png', size: 153600 },
    { index: 3, filename: 'photo4.jpg', path: 'photos/photo4.jpg', size: 307200 },
    { index: 4, filename: 'photo5.gif', path: 'photos/photo5.gif', size: 51200 },
  ],
};

const meta = {
  title: 'Features/Import/ArchiveImportTabView',
  component: ArchiveImportTabView,
  args: {
    onDrop: fn(),
    onClose: fn(),
    onSelectAll: fn(),
    onDeselectAll: fn(),
    onImport: fn(),
    onSelectionChange: fn(),
    onClearImportResult: fn(),
    onRetryJobStatus: fn(),
    onAbortJob: fn(),
  },
} satisfies Meta<typeof ArchiveImportTabView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSession: Story = {
  args: {
    sessionId: null,
    session: undefined,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(
      canvas.getByText('ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択'),
    ).toBeInTheDocument();
  },
};

export const Uploading: Story = {
  args: {
    sessionId: null,
    session: undefined,
    isSessionLoading: false,
    sessionError: null,
    isUploading: true,
    uploadError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(
      canvas.getByText('ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択'),
    ).toBeInTheDocument();
  },
};

export const SessionWithImages: Story = {
  args: {
    sessionId: 'session-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set([0, 2]),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ファイル名が表示されていることを確認
    await expect(canvas.getByText('photos.zip')).toBeInTheDocument();

    // 画像件数が表示されていることを確認
    await expect(canvas.getByText(/5件の画像/)).toBeInTheDocument();

    // 選択コントロールが表示されていることを確認
    await expect(canvas.getByText('全選択')).toBeInTheDocument();
    await expect(canvas.getByText('全解除')).toBeInTheDocument();
    await expect(canvas.getByText(/2\s*件選択中/)).toBeInTheDocument();

    // 閉じるボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
  },
};

export const SessionLoading: Story = {
  args: {
    sessionId: 'session-001',
    session: undefined,
    isSessionLoading: true,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ローディングメッセージが表示されていることを確認
    await expect(canvas.getByText('アーカイブを読み込み中...')).toBeInTheDocument();
  },
};

export const Importing: Story = {
  args: {
    sessionId: 'session-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set([0, 1, 2]),
    isImporting: true,
    importError: null,
    importResult: null,
    jobStatus: 'active',
    jobProgress: 45,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // インポート中のアラートが表示されていることを確認
    await expect(canvas.getByText('インポート中...')).toBeInTheDocument();
    await expect(canvas.getByText('45% 完了')).toBeInTheDocument();

    // インポートボタンが無効化されていることを確認
    await expect(canvas.getByRole('button', { name: /インポート/ })).toBeDisabled();
  },
};

export const ImportComplete: Story = {
  args: {
    sessionId: 'session-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importError: null,
    importResult: {
      totalRequested: 5,
      successCount: 5,
      failedCount: 0,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
        { index: 2, success: true, imageId: 'img-3' },
        { index: 3, success: true, imageId: 'img-4' },
        { index: 4, success: true, imageId: 'img-5' },
      ],
    },
    jobStatus: 'completed',
    jobProgress: 100,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // インポート完了のアラートが表示されていることを確認
    await expect(canvas.getByText('インポート完了')).toBeInTheDocument();
    await expect(canvas.getByText(/5\s*件インポート成功/)).toBeInTheDocument();

    // ギャラリーリンクが表示されていることを確認
    await expect(canvas.getByText('ギャラリーを見る')).toBeInTheDocument();
  },
};

export const Error: Story = {
  args: {
    sessionId: 'session-001',
    session: undefined,
    isSessionLoading: false,
    sessionError: new globalThis.Error('セッションの読み込みに失敗しました'),
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set<number>(),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // エラーメッセージが表示されていることを確認
    await expect(canvas.getByText('エラー')).toBeInTheDocument();
    await expect(canvas.getByText('セッションの読み込みに失敗しました')).toBeInTheDocument();
  },
};

export const UploadError: Story = {
  args: {
    sessionId: null,
    session: undefined,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: new globalThis.Error('ファイルの読み込みに失敗しました'),
    selectedIndices: new Set<number>(),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ドロップゾーンの説明が表示されていることを確認
    await expect(
      canvas.getByText('ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択'),
    ).toBeInTheDocument();
  },
};

export const JobFailed: Story = {
  args: {
    sessionId: 'session-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set([0, 1]),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: 'failed',
    jobProgress: 30,
    isJobFailed: true,
    jobFailedError: 'ジョブの処理中にエラーが発生しました',
    jobStatusError: null,
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ジョブ失敗のアラートが表示されていることを確認
    await expect(canvas.getByText('インポート失敗')).toBeInTheDocument();
    await expect(canvas.getByText('ジョブの処理中にエラーが発生しました')).toBeInTheDocument();
  },
};

export const JobStatusError: Story = {
  args: {
    sessionId: 'session-001',
    session: mockSession,
    isSessionLoading: false,
    sessionError: null,
    isUploading: false,
    uploadError: null,
    selectedIndices: new Set([0, 1]),
    isImporting: false,
    importError: null,
    importResult: null,
    jobStatus: undefined,
    jobProgress: 0,
    isJobFailed: false,
    jobFailedError: null,
    jobStatusError: new globalThis.Error('ネットワークエラーが発生しました'),
    isClosing: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // ステータス取得エラーのアラートが表示されていることを確認
    await expect(canvas.getByText('ステータス取得エラー')).toBeInTheDocument();
    await expect(canvas.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();

    // 再試行・中止ボタンが表示されていることを確認
    await expect(canvas.getByRole('button', { name: '再試行' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'インポートを中止' })).toBeInTheDocument();
  },
};
