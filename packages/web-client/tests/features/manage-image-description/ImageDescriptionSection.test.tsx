import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { API_TYPES, type ApiClient } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Container } from 'inversify';
import { describe, expect, it, vi } from 'vitest';
import { ImageDescriptionSection } from '@/features/manage-image-description';
import { generateDescriptionJob, getJobStatus } from '@/features/manage-image-description/api/description';
import { ContainerProvider } from '@/shared/di';

vi.mock('@/features/manage-image-description/api/description', () => ({
  generateDescriptionJob: vi.fn(),
  getJobStatus: vi.fn(),
}));

vi.mock('@/widgets/job-status', () => ({
  useJobs: () => ({
    trackJob: vi.fn(),
  }),
}));

interface MockImagesMethods {
  update?: () => Promise<unknown>;
}

function createMockApiClient(methods: MockImagesMethods = {}) {
  return {
    images: {
      update: methods.update ?? vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as ApiClient;
}

function createWrapper(methods: MockImagesMethods = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(createMockApiClient(methods));

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <ContainerProvider container={container}>{children}</ContainerProvider>
        </MantineProvider>
      </QueryClientProvider>
    );
  };
}

describe('ImageDescriptionSection', () => {
  it('should render empty state when no description', () => {
    render(
      <ImageDescriptionSection imageId="img-1" description={null} />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('説明がありません')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <ImageDescriptionSection imageId="img-1" description="Test description" />,
      { wrapper: createWrapper() },
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should enter edit mode when edit button clicked', async () => {
    const user = userEvent.setup();

    render(
      <ImageDescriptionSection imageId="img-1" description="Test description" />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '説明を編集' }));

    expect(screen.getByPlaceholderText('画像の説明を入力...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('should cancel editing and restore original value', async () => {
    const user = userEvent.setup();

    render(
      <ImageDescriptionSection imageId="img-1" description="Original" />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '説明を編集' }));

    // Modify text
    const textarea = screen.getByPlaceholderText('画像の説明を入力...');
    await user.clear(textarea);
    await user.type(textarea, 'Modified');

    // Cancel
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));

    // Should show original description, not modified
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByText('Modified')).not.toBeInTheDocument();
  });

  it('should save description when save button clicked', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      id: 'img-1',
      title: 'Test',
      path: '/test.png',
      thumbnailPath: null,
      mimeType: 'image/png',
      size: 1000,
      width: 100,
      height: 100,
      description: 'New description',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    const user = userEvent.setup();

    render(
      <ImageDescriptionSection imageId="img-1" description={null} />,
      { wrapper: createWrapper({ update: mockUpdate }) },
    );

    await user.click(screen.getByRole('button', { name: '説明を追加' }));

    const textarea = screen.getByPlaceholderText('画像の説明を入力...');
    await user.type(textarea, 'New description');

    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('img-1', { description: 'New description' });
    });
  });

  it('should generate description when AI button clicked', async () => {
    vi.mocked(generateDescriptionJob).mockResolvedValue({
      jobId: 'job-1',
      status: 'queued',
      message: 'Job queued',
    });
    vi.mocked(getJobStatus).mockResolvedValue({
      id: 'job-1',
      type: 'caption-generation',
      status: 'completed',
      progress: 100,
      result: { description: 'AI generated description', model: 'gpt-4' },
      attempts: 1,
      maxAttempts: 3,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      startedAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T00:00:01Z',
    });
    const user = userEvent.setup();

    render(
      <ImageDescriptionSection imageId="img-1" description={null} />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '説明を追加' }));
    await user.click(screen.getByRole('button', { name: 'AI で生成' }));

    await waitFor(() => {
      expect(generateDescriptionJob).toHaveBeenCalledWith('img-1');
    });
  });
});
