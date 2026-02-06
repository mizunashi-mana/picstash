import type { ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import { API_TYPES, type ApiClient, type Job } from '@picstash/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Container } from 'inversify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContainerProvider } from '@/shared/di';
import { JobsProvider, useJobs } from '@/widgets/job-status/model/context';

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

function createMockApiClient(listJobsResult: { jobs: Job[]; total: number }) {
  return {
    jobs: {
      list: vi.fn().mockResolvedValue(listJobsResult),
      detail: vi.fn(),
    },
  } as unknown as ApiClient;
}

function createWrapper(mockApiClient: ApiClient) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const container = new Container();
  container.bind<ApiClient>(API_TYPES.ApiClient).toConstantValue(mockApiClient);

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ContainerProvider container={container}>
        <QueryClientProvider client={queryClient}>
          <JobsProvider>{children}</JobsProvider>
        </QueryClientProvider>
      </ContainerProvider>
    );
  };
}

describe('JobsProvider', () => {
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
      const mockApiClient = createMockApiClient({ jobs: [], total: 0 });
      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

      expect(result.current.jobs).toEqual([]);
      expect(result.current.activeJobs).toEqual([]);
      expect(result.current.recentCompletedJobs).toEqual([]);
      expect(result.current.activeJobCount).toBe(0);
    });

    it('should track a job', async () => {
      const job = createJob({ id: 'job-1', status: 'active' });
      const mockApiClient = createMockApiClient({ jobs: [job], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

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
      const mockApiClient = createMockApiClient({ jobs: [job], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

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
      const mockApiClient = createMockApiClient({ jobs: [job], total: 1 });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

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

      const mockApiClient = createMockApiClient({
        jobs: [activeJob, waitingJob, completedJob],
        total: 3,
      });

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

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
      const mockListJobs = vi.fn().mockResolvedValue({ jobs: [activeJob], total: 1 });
      const mockApiClient = {
        jobs: {
          list: mockListJobs,
          detail: vi.fn(),
        },
      } as unknown as ApiClient;

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.activeJobs).toHaveLength(1);
      });

      // Simulate job completion by updating mock
      const completedJob = createJob({ id: 'job-1', status: 'completed' });
      mockListJobs.mockResolvedValue({ jobs: [completedJob], total: 1 });

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
      const mockListJobs = vi.fn().mockResolvedValue({ jobs: [activeJob], total: 1 });
      const mockApiClient = {
        jobs: {
          list: mockListJobs,
          detail: vi.fn(),
        },
      } as unknown as ApiClient;

      const { result } = renderHook(() => useJobs(), { wrapper: createWrapper(mockApiClient) });

      act(() => {
        result.current.trackJob('job-1');
      });

      await waitFor(() => {
        expect(result.current.activeJobs).toHaveLength(1);
      });

      // Simulate job failure
      const failedJob = createJob({ id: 'job-1', status: 'failed', error: 'Something went wrong' });
      mockListJobs.mockResolvedValue({ jobs: [failedJob], total: 1 });

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
