import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { render, screen } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SimilarImagesSectionView } from '@/features/find-similar-images';
import { ContainerProvider } from '@/shared/di';
import type { SimilarImage } from '@/features/find-similar-images';

function createMockApiClient() {
  return {
    images: {
      getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
    },
  } as unknown as ApiClient;
}

function createWrapper() {
  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider>
        <ContainerProvider container={container}>
          <MemoryRouter>{children}</MemoryRouter>
        </ContainerProvider>
      </MantineProvider>
    );
  };
}

const mockSimilarImages: SimilarImage[] = [
  {
    id: 'img-2',
    title: 'Similar Image 1',
    thumbnailPath: '/thumbnails/2.png',
    distance: 0.2, // 90% similarity
  },
  {
    id: 'img-3',
    title: 'Similar Image 2',
    thumbnailPath: '/thumbnails/3.png',
    distance: 0.5, // 75% similarity
  },
];

describe('SimilarImagesSectionView', () => {
  it('should render title', () => {
    render(
      <SimilarImagesSectionView
        similarImages={[]}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('類似画像')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(
      <SimilarImagesSectionView
        similarImages={[]}
        isLoading={true}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('類似画像を検索中...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    render(
      <SimilarImagesSectionView
        similarImages={[]}
        isLoading={false}
        error={new Error('Failed to fetch')}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('類似画像の取得に失敗しました。')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <SimilarImagesSectionView
        similarImages={[]}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('類似画像が見つかりませんでした')).toBeInTheDocument();
  });

  it('should render similar images', () => {
    render(
      <SimilarImagesSectionView
        similarImages={mockSimilarImages}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    // Should render links to images
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/images/img-2');
    expect(links[1]).toHaveAttribute('href', '/images/img-3');
  });

  it('should render similarity scores', () => {
    render(
      <SimilarImagesSectionView
        similarImages={mockSimilarImages}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    // distance 0.2 => (1 - 0.2/2) * 100 = 90%
    expect(screen.getByText('90%')).toBeInTheDocument();
    // distance 0.5 => (1 - 0.5/2) * 100 = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should render placeholder for images without thumbnail', () => {
    const imagesWithoutThumbnail: SimilarImage[] = [
      {
        id: 'img-4',
        title: 'No Thumbnail',
        thumbnailPath: null,
        distance: 0.3,
      },
    ];

    render(
      <SimilarImagesSectionView
        similarImages={imagesWithoutThumbnail}
        isLoading={false}
        error={null}
      />,
      { wrapper: createWrapper() },
    );

    // Should still render the link
    expect(screen.getByRole('link')).toHaveAttribute('href', '/images/img-4');
  });
});
