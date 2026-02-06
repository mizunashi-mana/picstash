import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImageUploadTab } from '@/features/import/ui/ImageUploadTab';
import { ContainerProvider } from '@/shared/di';

const mockUpload = vi.fn();

vi.mock('@/features/upload-image', () => ({
  ImageDropzoneView: ({ onDrop, isPending, isError, errorMessage }: {
    onDrop: (files: File[]) => void;
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
  }) => (
    <div data-testid="dropzone">
      <button
        type="button"
        onClick={() => { onDrop([new File(['test'], 'test.png', { type: 'image/png' })]); }}
        data-testid="drop-button"
      >
        Drop
      </button>
      {isPending && <span data-testid="pending">Loading...</span>}
      {isError && <span data-testid="error">{errorMessage}</span>}
    </div>
  ),
}));

function createMockApiClient() {
  return {
    images: {
      upload: mockUpload,
    },
  } as unknown as ApiClient;
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ContainerProvider container={container}>
          <MantineProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </MantineProvider>
        </ContainerProvider>
      </QueryClientProvider>
    );
  };
}

describe('ImageUploadTab', () => {
  it('should render description text', () => {
    render(<ImageUploadTab />, { wrapper: createWrapper() });

    expect(screen.getByText('画像ファイルをドラッグ＆ドロップまたはクリックして選択')).toBeInTheDocument();
  });

  it('should render dropzone', () => {
    render(<ImageUploadTab />, { wrapper: createWrapper() });

    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('should show success alert after upload', async () => {
    mockUpload.mockResolvedValue({
      id: '1',
      path: '/test.png',
      thumbnailPath: null,
      mimeType: 'image/png',
      size: 1000,
      width: 100,
      height: 100,
      title: 'test',
      description: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });

    render(<ImageUploadTab />, { wrapper: createWrapper() });

    screen.getByTestId('drop-button').click();

    await waitFor(() => {
      expect(screen.getByText(/1 件アップロード成功/)).toBeInTheDocument();
    });
  });

  it('should show gallery link after successful upload', async () => {
    mockUpload.mockResolvedValue({
      id: '1',
      path: '/test.png',
      thumbnailPath: null,
      mimeType: 'image/png',
      size: 1000,
      width: 100,
      height: 100,
      title: 'test',
      description: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });

    render(<ImageUploadTab />, { wrapper: createWrapper() });

    screen.getByTestId('drop-button').click();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'ギャラリーを見る' })).toBeInTheDocument();
    });
  });
});
