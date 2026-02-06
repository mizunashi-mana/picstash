import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImageGallery } from '@/features/gallery/ui/ImageGallery';
import { ContainerProvider } from '@/shared/di';

vi.mock('@/features/search-images', () => ({
  saveSearchHistory: vi.fn(),
  deleteAllSearchHistory: vi.fn(),
  SearchBar: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    />
  ),
}));

function createMockApiClient(listFn: () => Promise<unknown>) {
  return {
    images: {
      list: listFn,
      getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
    },
  } as unknown as ApiClient;
}

function createWrapper(initialEntries: string[] = ['/'], listFn: () => Promise<unknown> = async () => []) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient(listFn));

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ContainerProvider container={container}>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

describe('ImageGallery', () => {
  it('should render collapsed by default when no query', () => {
    render(<ImageGallery />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: '展開する' })).toBeInTheDocument();
  });

  it('should render expanded when query exists in URL', async () => {
    render(<ImageGallery />, { wrapper: createWrapper(['/?q=test'], async () => []) });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '折りたたむ' })).toBeInTheDocument();
    });
  });

  it('should fetch images when expanded', async () => {
    const mockList = vi.fn().mockResolvedValue([]);
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper(['/'], mockList) });

    await user.click(screen.getByRole('button', { name: '展開する' }));

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });
  });

  it('should render search bar when expanded', async () => {
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper() });

    // Expand gallery first
    await user.click(screen.getByRole('button', { name: '展開する' }));

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('should render loading state', async () => {
    const mockList = vi.fn().mockImplementation(async () => await new Promise(() => {})); // Never resolves
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper(['/'], mockList) });

    await user.click(screen.getByRole('button', { name: '展開する' }));

    expect(screen.getByText('画像を読み込み中...')).toBeInTheDocument();
  });

  it('should display images when loaded', async () => {
    const mockList = vi.fn().mockResolvedValue([
      {
        id: 'img-1',
        title: 'Image 1',
        path: '/images/1.png',
        thumbnailPath: '/thumbnails/1.png',
        mimeType: 'image/png',
        size: 1000,
        width: 100,
        height: 100,
        description: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
    const user = userEvent.setup();

    render(<ImageGallery />, { wrapper: createWrapper(['/'], mockList) });

    await user.click(screen.getByRole('button', { name: '展開する' }));

    await waitFor(() => {
      expect(screen.getByText('1件')).toBeInTheDocument();
    });
  });
});
