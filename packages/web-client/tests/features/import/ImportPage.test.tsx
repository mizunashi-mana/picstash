import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImportPage } from '@/features/import/pages/ImportPage';

// Mock child components to isolate ImportPage testing
vi.mock('@/features/import/components/ImageUploadTab', () => ({
  ImageUploadTab: () => <div data-testid="image-upload-tab">ImageUploadTab</div>,
}));

vi.mock('@/features/import/components/ArchiveImportTab', () => ({
  ArchiveImportTab: () => <div data-testid="archive-import-tab">ArchiveImportTab</div>,
}));

vi.mock('@/features/import/components/UrlCrawlTab', () => ({
  UrlCrawlTab: () => <div data-testid="url-crawl-tab">UrlCrawlTab</div>,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('ImportPage', () => {
  it('should render page title and description', () => {
    render(<ImportPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'インポート' })).toBeInTheDocument();
    expect(screen.getByText('画像、アーカイブ、URL から取り込み')).toBeInTheDocument();
  });

  it('should render three tabs', () => {
    render(<ImportPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('tab', { name: '画像' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'アーカイブ' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'URL' })).toBeInTheDocument();
  });

  it('should show image tab by default', () => {
    render(<ImportPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('tab', { name: '画像' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('image-upload-tab')).toBeInTheDocument();
  });

  it('should switch to archive tab when clicked', async () => {
    const user = userEvent.setup();
    render(<ImportPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('tab', { name: 'アーカイブ' }));

    expect(screen.getByRole('tab', { name: 'アーカイブ' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('archive-import-tab')).toBeInTheDocument();
  });

  it('should switch to URL tab when clicked', async () => {
    const user = userEvent.setup();
    render(<ImportPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('tab', { name: 'URL' }));

    expect(screen.getByRole('tab', { name: 'URL' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('url-crawl-tab')).toBeInTheDocument();
  });
});
