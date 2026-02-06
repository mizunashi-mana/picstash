import { useMemo, useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Container } from 'inversify';
import { MemoryRouter } from 'react-router';
import { ContainerProvider } from '@/shared/di';
import type { Preview } from '@storybook/react-vite';

import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';

function createMockApiClient(): ApiClient {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Storybook mock
  return {
    images: {
      list: async () => [],
      listPaginated: async () => ({ data: [], total: 0, page: 1, limit: 20 }),
      detail: async () => undefined,
      update: async () => ({}),
      delete: async () => undefined,
      getImageUrl: (id: string) => `/api/images/${id}/file`,
      getThumbnailUrl: (id: string) => `/api/images/${id}/thumbnail`,
    },
    collections: {
      list: async () => [],
      detail: async () => undefined,
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => undefined,
      fetchImageCollections: async () => [],
      addImage: async () => undefined,
      removeImage: async () => undefined,
    },
    labels: {
      list: async () => [],
      create: async () => ({}),
      update: async () => ({}),
      delete: async () => undefined,
    },
    urlCrawl: {
      crawl: async () => ({ sessionId: '' }),
      getSession: async () => undefined,
      deleteSession: async () => undefined,
      getThumbnailUrl: (sessionId: string, imageIndex: number) =>
        `/api/url-crawl/${sessionId}/images/${imageIndex}/thumbnail`,
      getImageUrl: (sessionId: string, imageIndex: number) =>
        `/api/url-crawl/${sessionId}/images/${imageIndex}/file`,
      importImages: async () => ({ totalRequested: 0, successCount: 0, failedCount: 0, results: [] }),
    },
  } as unknown as ApiClient;
}

const preview: Preview = {
  decorators: [
    (Story) => {
      const [queryClient] = useState(
        () =>
          new QueryClient({
            defaultOptions: {
              queries: {
                staleTime: 1000 * 60 * 5,
                retry: false,
              },
            },
          }),
      );

      const container = useMemo(() => {
        const c = new Container();
        c.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient());
        return c;
      }, []);

      return (
        <QueryClientProvider client={queryClient}>
          <MantineProvider>
            <ContainerProvider container={container}>
              <MemoryRouter>
                <Story />
              </MemoryRouter>
            </ContainerProvider>
          </MantineProvider>
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
