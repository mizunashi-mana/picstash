import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SimilarImagesSection } from '@/features/find-similar-images';
import { ContainerProvider } from '@/shared/di';

function createMockApiClient(options?: {
  fetchSimilar?: ApiClient['images']['fetchSimilar'];
}) {
  return {
    images: {
      getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
      fetchSimilar: options?.fetchSimilar ?? vi.fn().mockResolvedValue({ imageId: '', similarImages: [] }),
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

describe('SimilarImagesSection', () => {
  it('should render loading state', () => {
    const mockFetchSimilar = vi.fn().mockImplementation(async () => await new Promise(() => {}));
    const apiClient = createMockApiClient({ fetchSimilar: mockFetchSimilar });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper(apiClient) });

    expect(screen.getByText('類似画像を検索中...')).toBeInTheDocument();
  });

  it('should render empty state when no similar images', async () => {
    const mockFetchSimilar = vi.fn().mockResolvedValue({
      imageId: 'img-1',
      similarImages: [],
    });
    const apiClient = createMockApiClient({ fetchSimilar: mockFetchSimilar });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper(apiClient) });

    await waitFor(() => {
      expect(screen.getByText('類似画像が見つかりませんでした')).toBeInTheDocument();
    });
  });

  it('should render similar images', async () => {
    const mockFetchSimilar = vi.fn().mockResolvedValue({
      imageId: 'img-1',
      similarImages: [
        { id: 'img-2', title: 'Similar 1', thumbnailPath: '/thumb/2', distance: 0.2 },
        { id: 'img-3', title: 'Similar 2', thumbnailPath: '/thumb/3', distance: 0.4 },
      ],
    });
    const apiClient = createMockApiClient({ fetchSimilar: mockFetchSimilar });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper(apiClient) });

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/images/img-2');
      expect(links[1]).toHaveAttribute('href', '/images/img-3');
    });
  });

  it('should fetch with limit of 10', async () => {
    const mockFetchSimilar = vi.fn().mockResolvedValue({
      imageId: 'img-1',
      similarImages: [],
    });
    const apiClient = createMockApiClient({ fetchSimilar: mockFetchSimilar });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper(apiClient) });

    await waitFor(() => {
      expect(mockFetchSimilar).toHaveBeenCalledWith('img-1', { limit: 10 });
    });
  });

  it('should render error state', async () => {
    const mockFetchSimilar = vi.fn().mockRejectedValue(new Error('Network error'));
    const apiClient = createMockApiClient({ fetchSimilar: mockFetchSimilar });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper(apiClient) });

    await waitFor(() => {
      expect(screen.getByText('類似画像の取得に失敗しました。')).toBeInTheDocument();
    });
  });
});
