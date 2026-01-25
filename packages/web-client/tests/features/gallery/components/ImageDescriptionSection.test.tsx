import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { generateDescriptionJob, getJobStatus, updateImage } from '@/features/gallery/api';
import { ImageDescriptionSection } from '@/features/gallery/components/ImageDescriptionSection';

vi.mock('@/features/gallery/api', () => ({
  updateImage: vi.fn(),
  generateDescriptionJob: vi.fn(),
  getJobStatus: vi.fn(),
}));

vi.mock('@/features/jobs', () => ({
  useJobs: () => ({
    trackJob: vi.fn(),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{children}</MantineProvider>
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
    vi.mocked(updateImage).mockResolvedValue({
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
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '説明を追加' }));

    const textarea = screen.getByPlaceholderText('画像の説明を入力...');
    await user.type(textarea, 'New description');

    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateImage).toHaveBeenCalledWith('img-1', { description: 'New description' });
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

  it('should not mix results when generating for multiple images concurrently', async () => {
    // Setup mocks for two different jobs
    vi.mocked(generateDescriptionJob)
      .mockResolvedValueOnce({
        jobId: 'job-A',
        status: 'queued',
        message: 'Job queued',
      })
      .mockResolvedValueOnce({
        jobId: 'job-B',
        status: 'queued',
        message: 'Job queued',
      });

    // Job A completes first with "Description A"
    // Job B completes second with "Description B"
    vi.mocked(getJobStatus).mockImplementation(async (jobId) => {
      if (jobId === 'job-A') {
        return {
          id: 'job-A',
          type: 'caption-generation',
          status: 'completed',
          progress: 100,
          result: { description: 'Description A', model: 'gpt-4' },
          attempts: 1,
          maxAttempts: 3,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:00:01Z',
        };
      }
      return {
        id: 'job-B',
        type: 'caption-generation',
        status: 'completed',
        progress: 100,
        result: { description: 'Description B', model: 'gpt-4' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:00:02Z',
      };
    });

    const user = userEvent.setup();

    // Render component for Image A
    const { rerender } = render(
      <ImageDescriptionSection imageId="img-A" description={null} />,
      { wrapper: createWrapper() },
    );

    // Start generation for Image A
    await user.click(screen.getByRole('button', { name: '説明を追加' }));
    await user.click(screen.getByRole('button', { name: 'AI で生成' }));

    await waitFor(() => {
      expect(generateDescriptionJob).toHaveBeenCalledWith('img-A');
    });

    // Switch to Image B while Image A is still generating
    rerender(<ImageDescriptionSection imageId="img-B" description={null} />);

    // The component should exit edit mode when imageId changes, showing empty state
    await waitFor(() => {
      expect(screen.getByText('説明がありません')).toBeInTheDocument();
    });

    // Enter edit mode for Image B and start generation
    await user.click(screen.getByRole('button', { name: '説明を追加' }));
    await user.click(screen.getByRole('button', { name: 'AI で生成' }));

    await waitFor(() => {
      expect(generateDescriptionJob).toHaveBeenCalledWith('img-B');
    });

    // Wait for jobs to complete
    await waitFor(
      () => {
        const textarea = screen.queryByDisplayValue('Description B');
        expect(textarea).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify Description A is not shown
    expect(screen.queryByDisplayValue('Description A')).not.toBeInTheDocument();
  });

  it('should ignore stale job results when imageId changes', async () => {
    // Setup mock for slow job
    vi.mocked(generateDescriptionJob).mockResolvedValue({
      jobId: 'job-slow',
      status: 'queued',
      message: 'Job queued',
    });

    let callCount = 0;
    vi.mocked(getJobStatus).mockImplementation(async () => {
      callCount++;
      // Return in-progress for first few calls, then completed
      if (callCount < 3) {
        return {
          id: 'job-slow',
          type: 'caption-generation',
          status: 'active',
          progress: 50,
          attempts: 1,
          maxAttempts: 3,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: null,
        };
      }
      return {
        id: 'job-slow',
        type: 'caption-generation',
        status: 'completed',
        progress: 100,
        result: { description: 'Stale description', model: 'gpt-4' },
        attempts: 1,
        maxAttempts: 3,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:00:03Z',
      };
    });

    const user = userEvent.setup();

    // Render component for Image A and start generation
    const { rerender } = render(
      <ImageDescriptionSection imageId="img-A" description={null} />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: '説明を追加' }));
    await user.click(screen.getByRole('button', { name: 'AI で生成' }));

    await waitFor(() => {
      expect(generateDescriptionJob).toHaveBeenCalledWith('img-A');
    });

    // Switch to a different image before job completes
    rerender(<ImageDescriptionSection imageId="img-B" description="Original B" />);

    // Wait for the description to be displayed
    await waitFor(() => {
      expect(screen.getByText('Original B')).toBeInTheDocument();
    });

    // Give enough time for the background polling to complete
    // (even though it should be stopped and not affect the UI)
    await waitFor(
      async () => {
        // Just wait a bit to ensure any background activity has settled
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
      },
      { timeout: 2500 },
    );

    // The stale result should not be displayed (Original B should remain)
    expect(screen.getByText('Original B')).toBeInTheDocument();
    expect(screen.queryByText('Stale description')).not.toBeInTheDocument();
    // Also check that it's not in edit mode with the stale value
    expect(screen.queryByDisplayValue('Stale description')).not.toBeInTheDocument();
  });
});
