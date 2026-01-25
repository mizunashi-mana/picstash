import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  getArchiveSession,
  uploadArchive,
} from '@/features/archive-import';
import { ArchiveImportTab } from '@/features/import/components/ArchiveImportTab';

vi.mock('@/features/archive-import', () => ({
  uploadArchive: vi.fn(),
  getArchiveSession: vi.fn(),
  deleteArchiveSession: vi.fn().mockResolvedValue(undefined),
  importFromArchive: vi.fn(),
  getImportJobStatus: vi.fn(),
  ArchiveDropzone: ({ onDrop, isPending }: {
    onDrop: (files: File[]) => void;
    isPending: boolean;
  }) => (
    <div data-testid="archive-dropzone">
      <button
        type="button"
        onClick={() => { onDrop([new File(['test'], 'test.zip', { type: 'application/zip' })]); }}
        data-testid="archive-drop-button"
      >
        Drop Archive
      </button>
      {isPending && <span data-testid="pending">Loading...</span>}
    </div>
  ),
  ArchivePreviewGallery: ({ images }: { images: Array<{ index: number }> }) => (
    <div data-testid="archive-preview-gallery">
      {images.length}
      {' '}
      images
    </div>
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

describe('ArchiveImportTab', () => {
  it('should render description text', () => {
    render(<ArchiveImportTab />, { wrapper: createWrapper() });

    expect(screen.getByText('ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択')).toBeInTheDocument();
  });

  it('should render archive dropzone', () => {
    render(<ArchiveImportTab />, { wrapper: createWrapper() });

    expect(screen.getByTestId('archive-dropzone')).toBeInTheDocument();
  });

  it('should show session info after upload', async () => {
    vi.mocked(uploadArchive).mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 3,
    });
    vi.mocked(getArchiveSession).mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 3,
      images: [
        { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000 },
        { index: 1, filename: 'img2.png', path: '/img2.png', size: 2000 },
        { index: 2, filename: 'img3.png', path: '/img3.png', size: 3000 },
      ],
    });

    render(<ArchiveImportTab />, { wrapper: createWrapper() });

    screen.getByTestId('archive-drop-button').click();

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
      expect(screen.getByText('3件の画像')).toBeInTheDocument();
    });
  });

  it('should show close button when session is active', async () => {
    vi.mocked(uploadArchive).mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 1,
    });
    vi.mocked(getArchiveSession).mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 1,
      images: [{ index: 0, filename: 'img1.png', path: '/img1.png', size: 1000 }],
    });

    render(<ArchiveImportTab />, { wrapper: createWrapper() });

    screen.getByTestId('archive-drop-button').click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });
  });

  it('should show selection controls when session is active', async () => {
    vi.mocked(uploadArchive).mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 2,
    });
    vi.mocked(getArchiveSession).mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 2,
      images: [
        { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000 },
        { index: 1, filename: 'img2.png', path: '/img2.png', size: 2000 },
      ],
    });

    render(<ArchiveImportTab />, { wrapper: createWrapper() });

    screen.getByTestId('archive-drop-button').click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '全選択' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '全解除' })).toBeInTheDocument();
    });
  });
});
