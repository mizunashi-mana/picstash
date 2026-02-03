import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { SimilarImagesSection } from '@/features/find-similar-images';
import { fetchSimilarImages } from '@/features/find-similar-images/api/similar';

vi.mock('@/entities/image', () => ({
  getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
}));

vi.mock('@/features/find-similar-images/api/similar', () => ({
  fetchSimilarImages: vi.fn(),
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

describe('SimilarImagesSection', () => {
  it('should render loading state', () => {
    vi.mocked(fetchSimilarImages).mockImplementation(async () => await new Promise(() => {}));

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper() });

    expect(screen.getByText('類似画像を検索中...')).toBeInTheDocument();
  });

  it('should render empty state when no similar images', async () => {
    vi.mocked(fetchSimilarImages).mockResolvedValue({
      imageId: 'img-1',
      similarImages: [],
    });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('類似画像が見つかりませんでした')).toBeInTheDocument();
    });
  });

  it('should render similar images', async () => {
    vi.mocked(fetchSimilarImages).mockResolvedValue({
      imageId: 'img-1',
      similarImages: [
        { id: 'img-2', title: 'Similar 1', thumbnailPath: '/thumb/2', distance: 0.2 },
        { id: 'img-3', title: 'Similar 2', thumbnailPath: '/thumb/3', distance: 0.4 },
      ],
    });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/images/img-2');
      expect(links[1]).toHaveAttribute('href', '/images/img-3');
    });
  });

  it('should fetch with limit of 10', async () => {
    vi.mocked(fetchSimilarImages).mockResolvedValue({
      imageId: 'img-1',
      similarImages: [],
    });

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(fetchSimilarImages).toHaveBeenCalledWith('img-1', { limit: 10 });
    });
  });

  it('should render error state', async () => {
    vi.mocked(fetchSimilarImages).mockRejectedValue(new Error('Network error'));

    render(<SimilarImagesSection imageId="img-1" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('類似画像の取得に失敗しました。')).toBeInTheDocument();
    });
  });
});
