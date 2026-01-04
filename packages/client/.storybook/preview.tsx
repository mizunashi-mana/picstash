import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { Preview } from '@storybook/react-vite';

import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  },
});

const preview: Preview = {
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </MantineProvider>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
