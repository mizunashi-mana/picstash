import { StrictMode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { App } from '@/App';
import { JobsProvider } from '@/features/jobs';

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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Electron では HashRouter を使用（file:// プロトコルでは BrowserRouter が動作しない）
createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications position="top-right" />
        <HashRouter>
          <JobsProvider>
            <App />
          </JobsProvider>
        </HashRouter>
      </MantineProvider>
    </QueryClientProvider>
  </StrictMode>,
);
