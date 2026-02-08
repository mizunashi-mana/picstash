import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Container } from 'inversify';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { ContainerProvider } from '@/shared/di';

/**
 * Create a mock API client with all methods stubbed
 */
export function createMockApiClient(overrides?: Partial<ApiClient>): ApiClient {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Mock object for testing
  return {
    images: {
      listPaginated: vi.fn().mockResolvedValue({ items: [], total: 0, offset: 0 }),
      getImageUrl: vi.fn((id: string) => `/images/${id}`),
      getThumbnailUrl: vi.fn((id: string) => `/thumbnails/${id}`),
      get: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue(undefined),
      updateAttributes: vi.fn().mockResolvedValue(undefined),
      updateDescription: vi.fn().mockResolvedValue(undefined),
      findSimilar: vi.fn().mockResolvedValue([]),
      findDuplicates: vi.fn().mockResolvedValue({ groups: [], totalGroups: 0, totalDuplicates: 0 }),
      fetchDuplicates: vi.fn().mockResolvedValue({ groups: [], totalGroups: 0, totalDuplicates: 0 }),
    },
    labels: {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 'label-1', name: 'test', color: '#000000' }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    collections: {
      list: vi.fn().mockResolvedValue([]),
      detail: vi.fn().mockResolvedValue({ id: 'col-1', name: 'test', images: [] }),
      create: vi.fn().mockResolvedValue({ id: 'col-1' }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      addImage: vi.fn().mockResolvedValue(undefined),
      removeImage: vi.fn().mockResolvedValue(undefined),
      fetchImageCollections: vi.fn().mockResolvedValue([]),
      reorderImages: vi.fn().mockResolvedValue(undefined),
    },
    search: {
      getSuggestions: vi.fn().mockResolvedValue({ history: [], suggestions: [] }),
      saveHistory: vi.fn().mockResolvedValue(undefined),
      deleteAllHistory: vi.fn().mockResolvedValue(undefined),
    },
    stats: {
      getOverview: vi.fn().mockResolvedValue({ totalImages: 0, totalViews: 0, totalRecommendations: 0 }),
      getViewTrends: vi.fn().mockResolvedValue([]),
      getRecommendationTrends: vi.fn().mockResolvedValue([]),
      getPopularImages: vi.fn().mockResolvedValue([]),
    },
    recommendations: {
      get: vi.fn().mockResolvedValue([]),
      recordClick: vi.fn().mockResolvedValue(undefined),
    },
    viewHistory: {
      record: vi.fn().mockResolvedValue(undefined),
      getRecent: vi.fn().mockResolvedValue([]),
    },
    archiveImport: {
      upload: vi.fn().mockResolvedValue({ sessionId: 'session-1', filename: 'test.zip', archiveType: 'zip', imageCount: 0 }),
      getSession: vi.fn().mockResolvedValue({ sessionId: 'session-1', filename: 'test.zip', archiveType: 'zip', imageCount: 0, images: [] }),
      deleteSession: vi.fn().mockResolvedValue(undefined),
      importImages: vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'waiting', totalRequested: 0, message: '' }),
      getImportJobStatus: vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'completed', progress: 100, totalRequested: 0 }),
      getThumbnailUrl: vi.fn((sessionId: string, index: number) => `/archive/${sessionId}/thumb/${index}`),
      getImageUrl: vi.fn((sessionId: string, index: number) => `/archive/${sessionId}/image/${index}`),
    },
    urlCrawl: {
      crawl: vi.fn().mockResolvedValue({ sessionId: 'session-1', images: [] }),
      getSession: vi.fn().mockResolvedValue({ sessionId: 'session-1', images: [] }),
      deleteSession: vi.fn().mockResolvedValue(undefined),
      importImages: vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'waiting', totalRequested: 0, message: '' }),
      getImportJobStatus: vi.fn().mockResolvedValue({ jobId: 'job-1', status: 'completed', progress: 100, totalRequested: 0 }),
      getThumbnailUrl: vi.fn((sessionId: string, index: number) => `/crawl/${sessionId}/thumb/${index}`),
      getImageUrl: vi.fn((sessionId: string, index: number) => `/crawl/${sessionId}/image/${index}`),
    },
    upload: {
      uploadImage: vi.fn().mockResolvedValue({ id: 'img-1' }),
    },
    ...overrides,
  } as unknown as ApiClient;
}

interface WrapperOptions {
  apiClient?: ApiClient;
  initialPath?: string;
  routePath?: string;
}

/**
 * Create a wrapper component with all necessary providers
 */
export function createTestWrapper(options: WrapperOptions = {}) {
  const {
    apiClient = createMockApiClient(),
    initialPath = '/',
    routePath = '*',
  } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(apiClient);

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ContainerProvider container={container}>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path={routePath} element={children} />
              </Routes>
            </MemoryRouter>
          </ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Create a simple Mantine wrapper for View component tests
 */
export function createMantineWrapper() {
  return function MantineWrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </MantineProvider>
    );
  };
}
