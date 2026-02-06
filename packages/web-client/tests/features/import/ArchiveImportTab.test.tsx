import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ArchiveImportTab } from '@/features/import/ui/ArchiveImportTab';
import { ContainerProvider } from '@/shared/di';
import type * as ImportArchiveModule from '@/features/import-archive';

vi.mock('@/features/import-archive', async (importOriginal) => {
  const actual = await importOriginal<typeof ImportArchiveModule>();
  return {
    ...actual,
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
  };
});

function createMockApiClient(options?: {
  upload?: ApiClient['archiveImport']['upload'];
  getSession?: ApiClient['archiveImport']['getSession'];
  deleteSession?: ApiClient['archiveImport']['deleteSession'];
  importImages?: ApiClient['archiveImport']['importImages'];
  getImportJobStatus?: ApiClient['archiveImport']['getImportJobStatus'];
}) {
  return {
    archiveImport: {
      upload: options?.upload ?? vi.fn().mockResolvedValue({ sessionId: '', filename: '', archiveType: 'zip', imageCount: 0 }),
      getSession: options?.getSession ?? vi.fn().mockResolvedValue({ sessionId: '', filename: '', archiveType: 'zip', imageCount: 0, images: [] }),
      deleteSession: options?.deleteSession ?? vi.fn().mockResolvedValue(undefined),
      importImages: options?.importImages ?? vi.fn().mockResolvedValue({ jobId: '', status: 'waiting', totalRequested: 0, message: '' }),
      getImportJobStatus: options?.getImportJobStatus ?? vi.fn().mockResolvedValue({ jobId: '', status: 'waiting', progress: 0, totalRequested: 0 }),
      getThumbnailUrl: (sessionId: string, fileIndex: number) => `/api/archives/${sessionId}/files/${fileIndex}/thumbnail`,
      getImageUrl: (sessionId: string, fileIndex: number) => `/api/archives/${sessionId}/files/${fileIndex}/file`,
    },
  } as unknown as ApiClient;
}

function createWrapper(apiClient: ApiClient) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(apiClient);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ContainerProvider container={container}>
            <MemoryRouter>{children}</MemoryRouter>
          </ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

describe('ArchiveImportTab', () => {
  it('should render description text', () => {
    const apiClient = createMockApiClient();
    render(<ArchiveImportTab />, { wrapper: createWrapper(apiClient) });

    expect(screen.getByText('ZIP/RAR ファイルをドラッグ＆ドロップまたはクリックして選択')).toBeInTheDocument();
  });

  it('should render archive dropzone', () => {
    const apiClient = createMockApiClient();
    render(<ArchiveImportTab />, { wrapper: createWrapper(apiClient) });

    expect(screen.getByTestId('archive-dropzone')).toBeInTheDocument();
  });

  it('should show session info after upload', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 3,
    });
    const mockGetSession = vi.fn().mockResolvedValue({
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
    const apiClient = createMockApiClient({
      upload: mockUpload,
      getSession: mockGetSession,
    });

    render(<ArchiveImportTab />, { wrapper: createWrapper(apiClient) });

    screen.getByTestId('archive-drop-button').click();

    await waitFor(() => {
      expect(screen.getByText('test.zip')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
      expect(screen.getByText('3件の画像')).toBeInTheDocument();
    });
  });

  it('should show close button when session is active', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 1,
    });
    const mockGetSession = vi.fn().mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 1,
      images: [{ index: 0, filename: 'img1.png', path: '/img1.png', size: 1000 }],
    });
    const apiClient = createMockApiClient({
      upload: mockUpload,
      getSession: mockGetSession,
    });

    render(<ArchiveImportTab />, { wrapper: createWrapper(apiClient) });

    screen.getByTestId('archive-drop-button').click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });
  });

  it('should show selection controls when session is active', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 2,
    });
    const mockGetSession = vi.fn().mockResolvedValue({
      sessionId: 'session-1',
      filename: 'test.zip',
      archiveType: 'zip',
      imageCount: 2,
      images: [
        { index: 0, filename: 'img1.png', path: '/img1.png', size: 1000 },
        { index: 1, filename: 'img2.png', path: '/img2.png', size: 2000 },
      ],
    });
    const apiClient = createMockApiClient({
      upload: mockUpload,
      getSession: mockGetSession,
    });

    render(<ArchiveImportTab />, { wrapper: createWrapper(apiClient) });

    screen.getByTestId('archive-drop-button').click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '全選択' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '全解除' })).toBeInTheDocument();
    });
  });
});
