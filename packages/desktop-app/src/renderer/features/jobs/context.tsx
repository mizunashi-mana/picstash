import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { notifications } from '@mantine/notifications';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listJobs, type Job, type JobStatus } from './api';
import { getJobTypeName, getJobTargetDescription } from './utils';

interface JobsContextValue {
  /** 監視中のジョブ一覧 */
  jobs: Job[];
  /** アクティブなジョブ（waiting + active） */
  activeJobs: Job[];
  /** 完了したジョブ（直近） */
  recentCompletedJobs: Job[];
  /** アクティブなジョブ数 */
  activeJobCount: number;
  /** ジョブを監視リストに追加 */
  trackJob: (jobId: string) => void;
  /** ジョブを監視リストから削除 */
  untrackJob: (jobId: string) => void;
  /** 完了ジョブを既読にする */
  markAsRead: (jobId: string) => void;
  /** データ再取得 */
  refetch: () => void;
  /** ローディング状態 */
  isLoading: boolean;
}

const JobsContext = createContext<JobsContextValue | null>(null);

const POLLING_INTERVAL = 2000; // 2秒
const RECENT_JOBS_LIMIT = 10;

interface JobsProviderProps {
  children: React.ReactNode;
}

export function JobsProvider({ children }: JobsProviderProps) {
  const queryClient = useQueryClient();

  // 監視対象のジョブID
  const [trackedJobIds, setTrackedJobIds] = useState<Set<string>>(new Set());

  // 既読にした完了ジョブID
  const [readJobIds, setReadJobIds] = useState<Set<string>>(new Set());

  // 通知済みジョブID（重複通知防止）
  const notifiedJobIds = useRef<Set<string>>(new Set());

  // 前回のジョブ状態（完了検知用）
  const previousJobsRef = useRef<Map<string, JobStatus>>(new Map());

  // アクティブなジョブがあるときだけポーリング
  const hasActiveJobs = trackedJobIds.size > 0;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['jobs', 'list', { status: ['waiting', 'active', 'completed', 'failed'] }],
    queryFn: async () =>
      await listJobs({
        status: ['waiting', 'active', 'completed', 'failed'],
        limit: RECENT_JOBS_LIMIT,
      }),
    refetchInterval: hasActiveJobs ? POLLING_INTERVAL : false,
    staleTime: 1000,
  });

  // 監視対象のジョブをフィルタリング
  const trackedJobs = useMemo(() => {
    const jobs = data?.jobs ?? [];
    return jobs.filter(job => trackedJobIds.has(job.id));
  }, [data?.jobs, trackedJobIds]);

  // アクティブなジョブ
  const activeJobs = useMemo(
    () => trackedJobs.filter(job => job.status === 'waiting' || job.status === 'active'),
    [trackedJobs],
  );

  // 完了したジョブ（未読のみ）
  const recentCompletedJobs = useMemo(
    () =>
      trackedJobs.filter(
        job =>
          (job.status === 'completed' || job.status === 'failed') && !readJobIds.has(job.id),
      ),
    [trackedJobs, readJobIds],
  );

  // ジョブ完了時の通知
  useEffect(() => {
    for (const job of trackedJobs) {
      const previousStatus = previousJobsRef.current.get(job.id);

      // 新しく完了/失敗したジョブを検知
      if (
        previousStatus !== undefined
        && previousStatus !== 'completed'
        && previousStatus !== 'failed'
        && (job.status === 'completed' || job.status === 'failed')
        && !notifiedJobIds.current.has(job.id)
      ) {
        notifiedJobIds.current.add(job.id);

        const typeName = getJobTypeName(job.type);
        const target = getJobTargetDescription(job);

        if (job.status === 'completed') {
          notifications.show({
            title: `${typeName}が完了しました`,
            message: target,
            color: 'green',
            autoClose: 5000,
          });
        }
        else {
          notifications.show({
            title: `${typeName}が失敗しました`,
            message: job.error ?? 'エラーが発生しました',
            color: 'red',
            autoClose: 8000,
          });
        }
      }

      // 状態を更新
      previousJobsRef.current.set(job.id, job.status);
    }
  }, [trackedJobs]);

  // ジョブをトラッキングから完全に削除
  const removeJobFromTracking = useCallback((jobId: string) => {
    setTrackedJobIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
    setReadJobIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
    previousJobsRef.current.delete(jobId);
    notifiedJobIds.current.delete(jobId);
  }, []);

  // 完了したジョブを監視リストから自動削除（5分後）
  useEffect(() => {
    const completedJobs = trackedJobs.filter(
      job => job.status === 'completed' || job.status === 'failed',
    );

    if (completedJobs.length === 0) return;

    const timers = completedJobs.map((job) => {
      const completedAt
        = job.completedAt !== null ? new Date(job.completedAt).getTime() : null;
      const elapsed = completedAt !== null ? Date.now() - completedAt : 0;
      const remaining
        = completedAt !== null
          ? Math.max(0, 5 * 60 * 1000 - elapsed) // 5分
          : 10 * 60 * 1000; // completedAt が不明な場合はより長い待機時間を設定（10分）

      return setTimeout(() => {
        removeJobFromTracking(job.id);
      }, remaining);
    });

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [trackedJobs, removeJobFromTracking]);

  const trackJob = useCallback((jobId: string) => {
    setTrackedJobIds(prev => new Set(prev).add(jobId));
    // 新しいジョブを追加したらすぐにデータを再取得
    void queryClient.invalidateQueries({ queryKey: ['jobs', 'list'] });
  }, [queryClient]);

  const untrackJob = useCallback((jobId: string) => {
    setTrackedJobIds((prev) => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  const markAsRead = useCallback((jobId: string) => {
    setReadJobIds(prev => new Set(prev).add(jobId));
  }, []);

  const value = useMemo<JobsContextValue>(
    () => ({
      jobs: trackedJobs,
      activeJobs,
      recentCompletedJobs,
      activeJobCount: activeJobs.length,
      trackJob,
      untrackJob,
      markAsRead,
      refetch: () => {
        void refetch();
      },
      isLoading,
    }),
    [
      trackedJobs,
      activeJobs,
      recentCompletedJobs,
      trackJob,
      untrackJob,
      markAsRead,
      refetch,
      isLoading,
    ],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsContextValue {
  const context = useContext(JobsContext);
  if (context === null) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}
