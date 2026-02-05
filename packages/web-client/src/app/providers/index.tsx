import { StrictMode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { ContainerProvider } from '@/shared/di';
import { JobsProvider } from '@/widgets/job-status';

import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StrictMode>
      <ContainerProvider>
        <QueryClientProvider client={queryClient}>
          <MantineProvider>
            <Notifications position="top-right" />
            <BrowserRouter>
              <JobsProvider>
                {children}
              </JobsProvider>
            </BrowserRouter>
          </MantineProvider>
        </QueryClientProvider>
      </ContainerProvider>
    </StrictMode>
  );
}
