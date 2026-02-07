import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { UrlCrawlTab } from '@/features/import/ui/UrlCrawlTab';
import { ContainerProvider } from '@/shared/di/react';

const mockUrlCrawlApi = {
  crawl: vi.fn(),
  getSession: vi.fn(),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  importImages: vi.fn(),
  getThumbnailUrl: vi.fn((sessionId: string, imageIndex: number) =>
    `/api/url-crawl/${sessionId}/images/${imageIndex}/thumbnail`,
  ),
  getImageUrl: vi.fn((sessionId: string, imageIndex: number) =>
    `/api/url-crawl/${sessionId}/images/${imageIndex}/file`,
  ),
};

vi.mock('@/features/import-url', () => ({
  UrlInputForm: ({ onSubmit, isPending }: {
    onSubmit: (url: string) => void;
    isPending: boolean;
  }) => (
    <div data-testid="url-input-form">
      <button
        type="button"
        onClick={() => { onSubmit('https://example.com'); }}
        data-testid="crawl-button"
      >
        Crawl
      </button>
      {isPending && <span data-testid="pending">Loading...</span>}
    </div>
  ),
  CrawlPreviewGallery: ({ images }: { images: Array<{ index: number }> }) => (
    <div data-testid="crawl-preview-gallery">
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

  const mockContainer = new Container();

  const mockApiClient = {
    urlCrawl: mockUrlCrawlApi,
  } as unknown as ApiClient;
  mockContainer.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(mockApiClient);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ContainerProvider container={mockContainer}>
          <MantineProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </MantineProvider>
        </ContainerProvider>
      </QueryClientProvider>
    );
  };
}

describe('UrlCrawlTab', () => {
  it('should render description text', () => {
    render(<UrlCrawlTab />, { wrapper: createWrapper() });

    expect(screen.getByText('ウェブページの URL を入力して画像をクロール')).toBeInTheDocument();
  });

  it('should render URL input form', () => {
    render(<UrlCrawlTab />, { wrapper: createWrapper() });

    expect(screen.getByTestId('url-input-form')).toBeInTheDocument();
  });

  it('should show session info after crawl', async () => {
    mockUrlCrawlApi.crawl.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com',
      imageCount: 5,
    });
    mockUrlCrawlApi.getSession.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com',
      pageTitle: 'Example Page',
      imageCount: 5,
      images: [
        { index: 0, url: 'https://example.com/img1.png', filename: 'img1.png' },
        { index: 1, url: 'https://example.com/img2.png', filename: 'img2.png' },
        { index: 2, url: 'https://example.com/img3.png', filename: 'img3.png' },
        { index: 3, url: 'https://example.com/img4.png', filename: 'img4.png' },
        { index: 4, url: 'https://example.com/img5.png', filename: 'img5.png' },
      ],
    });

    render(<UrlCrawlTab />, { wrapper: createWrapper() });

    screen.getByTestId('crawl-button').click();

    await waitFor(() => {
      expect(screen.getByText('Example Page')).toBeInTheDocument();
      expect(screen.getByText('5 件の画像')).toBeInTheDocument();
    });
  });

  it('should show source URL link when session is active', async () => {
    mockUrlCrawlApi.crawl.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com/gallery',
      imageCount: 1,
    });
    mockUrlCrawlApi.getSession.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com/gallery',
      pageTitle: 'Gallery',
      imageCount: 1,
      images: [{ index: 0, url: 'https://example.com/img.png', filename: 'img.png' }],
    });

    render(<UrlCrawlTab />, { wrapper: createWrapper() });

    screen.getByTestId('crawl-button').click();

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'https://example.com/gallery' });
      expect(link).toHaveAttribute('href', 'https://example.com/gallery');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('should show close button when session is active', async () => {
    mockUrlCrawlApi.crawl.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com',
      imageCount: 1,
    });
    mockUrlCrawlApi.getSession.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com',
      pageTitle: 'Test',
      imageCount: 1,
      images: [{ index: 0, url: 'https://example.com/img.png', filename: 'img.png' }],
    });

    render(<UrlCrawlTab />, { wrapper: createWrapper() });

    screen.getByTestId('crawl-button').click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });
  });

  it('should show selection controls when session is active', async () => {
    mockUrlCrawlApi.crawl.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com',
      imageCount: 2,
    });
    mockUrlCrawlApi.getSession.mockResolvedValue({
      sessionId: 'session-1',
      sourceUrl: 'https://example.com',
      pageTitle: 'Test',
      imageCount: 2,
      images: [
        { index: 0, url: 'https://example.com/img1.png', filename: 'img1.png' },
        { index: 1, url: 'https://example.com/img2.png', filename: 'img2.png' },
      ],
    });

    render(<UrlCrawlTab />, { wrapper: createWrapper() });

    screen.getByTestId('crawl-button').click();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '全選択' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '全解除' })).toBeInTheDocument();
    });
  });
});
