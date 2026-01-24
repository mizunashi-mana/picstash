import type { ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listJobs } from '@/features/jobs/api';
import { JobsProvider, useJobs } from '@/features/jobs/context';
import type { Job } from '@/features/jobs/api';

// Mock API
vi.mock('@/features/jobs/api', () => ({
  listJobs: vi.fn(),
}));

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const createJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  type: 'caption-generation',
  status: 'active',
  progress: 50,
  attempts: 1,
  maxAttempts: 3,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  startedAt: '2024-01-01T00:00:00Z',
  completedAt: null,
  ...overrides,
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <JobsProvider>{children}</JobsProvider>
      </QueryClientProvider>
    );
  };
}

describe('JobsProvider', () => {
  beforeEach(() => {
    vi.mocked(listJobs).mockResolvedValue({ jobs: [], total: 0 });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should throw error when useJobs is used outside JobsProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const useJobsWithoutProvider = () => useJobs();
    expect(() => renderHook(useJobsWithoutProvider))
      .toThrow('useJobs must be used within a JobsProvider');

    consoleSpy.mockRestore();
  });

  describe('useJobs hook', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      expect(result.current.jobs).toEqual([]);
      expect(result.current.activeJobs).toEqual([]);
      expect(result.current.recentCompletedJobs).toEqual([]);
      expect(result.current.activeJobCount).toBe(0);
    });

    it('should track a job', async () => {
      const job = createJob({ id: 'job-1', status: 'active' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [job], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.jobs).toHaveLength(1);
        expect(result.current.activeJobs).toHaveLength(1);
        expect(result.current.activeJobCount).toBe(1);
      });
    });

    it('should untrack a job', async () => {
      const job = createJob({ id: 'job-1', status: 'active' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [job], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.jobs).toHaveLength(1);
      });

      act(() => {
        result.current.untrackJob('job-1');
      });

      expect(result.current.jobs).toHaveLength(0);
    });

    it('should mark completed job as read', async () => {
      const job = createJob({ id: 'job-1', status: 'completed' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [job], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.recentCompletedJobs).toHaveLength(1);
      });

      act(() => {
        result.current.markAsRead('job-1');
      });

      expect(result.current.recentCompletedJobs).toHaveLength(0);
    });

    it('should filter active jobs correctly', async () => {
      const activeJob = createJob({ id: 'job-1', status: 'active' });
      const waitingJob = createJob({ id: 'job-2', status: 'waiting' });
      const completedJob = createJob({ id: 'job-3', status: 'completed' });

      vi.mocked(listJobs).mockResolvedValue({
        jobs: [activeJob, waitingJob, completedJob],
        total: 3,
      });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      act(() => {
        result.current.trackJob('job-1');
        result.current.trackJob('job-2');
        result.current.trackJob('job-3');
      });

      await waitFor(() => {
        expect(result.current.jobs).toHaveLength(3);
        expect(result.current.activeJobs).toHaveLength(2);
        expect(result.current.recentCompletedJobs).toHaveLength(1);
      });
    });
  });

  describe('notifications', () => {
    it('should show notification when job completes', async () => {
      const activeJob = createJob({ id: 'job-1', status: 'active' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [activeJob], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.activeJobs).toHaveLength(1);
      });

      // Simulate job completion by updating mock
      const completedJob = createJob({ id: 'job-1', status: 'completed' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [completedJob], total: 1 });

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '説明文生成が完了しました',
            color: 'green',
          }),
        );
      });
    });

    it('should show notification when job fails', async () => {
      const activeJob = createJob({ id: 'job-1', status: 'active' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [activeJob], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper() });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.activeJobs).toHaveLength(1);
      });

      // Simulate job failure
      const failedJob = createJob({ id: 'job-1', status: 'failed', error: 'Something went wrong' });
      vi.mocked(listJobs).mockResolvedValue({ jobs: [failedJob], total: 1 });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '説明文生成が失敗しました',
            message: 'Something went wrong',
            color: 'red',
          }),
        );
      });
    });
  });
});
