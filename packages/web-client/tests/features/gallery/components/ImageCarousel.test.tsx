import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImageCarousel } from '@/features/gallery/ui/ImageCarousel';
import type { Image } from '@/entities/image';

vi.mock('@mantine/hooks', async (importOriginal) => {
  const actual = await importOriginal<object>();
  return {
    ...actual,
    useHotkeys: vi.fn(),
  };
});

const mockGetImageUrl = (id: string) => `/api/images/${id}/file`;
const mockGetThumbnailUrl = (id: string) => `/api/images/${id}/thumbnail`;

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </MantineProvider>
    );
  };
}

const mockImages: Image[] = [
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
  {
    id: 'img-2',
    title: 'Image 2',
    path: '/images/2.png',
    thumbnailPath: '/thumbnails/2.png',
    mimeType: 'image/png',
    size: 2000,
    width: 200,
    height: 200,
    description: null,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'img-3',
    title: 'Image 3',
    path: '/images/3.png',
    thumbnailPath: '/thumbnails/3.png',
    mimeType: 'image/png',
    size: 3000,
    width: 300,
    height: 300,
    description: null,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

describe('ImageCarousel', () => {
  it('should render empty state when no images', () => {
    render(
      <ImageCarousel
        images={[]}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('画像がありません')).toBeInTheDocument();
  });

  it('should render image counter', () => {
    render(
      <ImageCarousel
        images={mockImages}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(
      <ImageCarousel
        images={mockImages}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('button', { name: '前の画像' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '次の画像' })).toBeInTheDocument();
  });

  it('should render detail link button', () => {
    render(
      <ImageCarousel
        images={mockImages}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByRole('link', { name: '詳細を表示' })).toHaveAttribute('href', '/images/img-1');
  });

  it('should navigate to next image on next button click', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();

    render(
      <ImageCarousel
        images={mockImages}
        onIndexChange={onIndexChange}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '次の画像' }));

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should navigate to previous image on prev button click', async () => {
    const user = userEvent.setup();

    render(
      <ImageCarousel
        images={mockImages}
        initialIndex={1}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '前の画像' }));

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should wrap around to last image when clicking prev on first', async () => {
    const user = userEvent.setup();

    render(
      <ImageCarousel
        images={mockImages}
        initialIndex={0}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '前の画像' }));

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should wrap around to first image when clicking next on last', async () => {
    const user = userEvent.setup();

    render(
      <ImageCarousel
        images={mockImages}
        initialIndex={2}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '次の画像' }));

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should render thumbnail strip', () => {
    render(
      <ImageCarousel
        images={mockImages}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    // Check for thumbnail buttons
    const thumbnailButtons = screen.getAllByRole('button', { name: /Image \d \(\d\/3\)/ });
    expect(thumbnailButtons).toHaveLength(3);
  });

  it('should change image when thumbnail clicked', async () => {
    const user = userEvent.setup();

    render(
      <ImageCarousel
        images={mockImages}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Click on third thumbnail
    await user.click(screen.getByRole('button', { name: 'Image 3 (3/3)' }));

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('should call onIndexChange when index changes', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();

    render(
      <ImageCarousel
        images={mockImages}
        onIndexChange={onIndexChange}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    // Initial call with index 0
    expect(onIndexChange).toHaveBeenCalledWith(0);

    await user.click(screen.getByRole('button', { name: '次の画像' }));

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('should start at initialIndex', () => {
    render(
      <ImageCarousel
        images={mockImages}
        initialIndex={2}
        getImageUrl={mockGetImageUrl}
        getThumbnailUrl={mockGetThumbnailUrl}
      />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '詳細を表示' })).toHaveAttribute('href', '/images/img-3');
  });
});
