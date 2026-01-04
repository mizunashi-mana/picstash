import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { Preview } from '@storybook/react-vite';

import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';

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

      return (
        <QueryClientProvider client={queryClient}>
          <MantineProvider>
            <MemoryRouter>
              <Story />
            </MemoryRouter>
          </MantineProvider>
        </QueryClientProvider>
      );
    },
  ],
};

export default preview;
