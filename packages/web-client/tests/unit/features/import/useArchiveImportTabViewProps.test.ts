import { describe, expect, it } from 'vitest';
import {
  extractCompletedResult,
  isJobFinished,
} from '@/features/import/ui/useArchiveImportTabViewProps';
import type { ImportJobStatus } from '@picstash/api';

describe('isJobFinished', () => {
  it('should return true for completed status', () => {
    expect(isJobFinished('completed')).toBe(true);
  });

  it('should return true for failed status', () => {
    expect(isJobFinished('failed')).toBe(true);
  });

  it('should return false for active status', () => {
    expect(isJobFinished('active')).toBe(false);
  });

  it('should return false for waiting status', () => {
    expect(isJobFinished('waiting')).toBe(false);
  });

  it('should return false for undefined status', () => {
    expect(isJobFinished(undefined)).toBe(false);
  });
});

describe('extractCompletedResult', () => {
  it('should return null for non-completed status', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'active',
      totalRequested: 5,
      progress: 50,
    };
    expect(extractCompletedResult(data)).toBeNull();
  });

  it('should return null for failed status', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'failed',
      totalRequested: 5,
      progress: 0,
      error: 'Something went wrong',
    };
    expect(extractCompletedResult(data)).toBeNull();
  });

  it('should return null when completed but missing successCount', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'completed',
      totalRequested: 5,
      progress: 100,
      failedCount: 0,
      results: [],
    };
    expect(extractCompletedResult(data)).toBeNull();
  });

  it('should return null when completed but missing failedCount', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'completed',
      totalRequested: 5,
      progress: 100,
      successCount: 5,
      results: [],
    };
    expect(extractCompletedResult(data)).toBeNull();
  });

  it('should return null when completed but missing results', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'completed',
      totalRequested: 5,
      progress: 100,
      successCount: 5,
      failedCount: 0,
    };
    expect(extractCompletedResult(data)).toBeNull();
  });

  it('should return result when completed with all required fields', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'completed',
      totalRequested: 5,
      progress: 100,
      successCount: 4,
      failedCount: 1,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
        { index: 2, success: true, imageId: 'img-3' },
        { index: 3, success: true, imageId: 'img-4' },
        { index: 4, success: false, error: 'Failed to import' },
      ],
    };

    const result = extractCompletedResult(data);

    expect(result).toEqual({
      totalRequested: 5,
      successCount: 4,
      failedCount: 1,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
        { index: 2, success: true, imageId: 'img-3' },
        { index: 3, success: true, imageId: 'img-4' },
        { index: 4, success: false, error: 'Failed to import' },
      ],
    });
  });

  it('should return result when all imports succeeded', () => {
    const data: ImportJobStatus = {
      jobId: 'job-1',
      status: 'completed',
      totalRequested: 2,
      progress: 100,
      successCount: 2,
      failedCount: 0,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
      ],
    };

    const result = extractCompletedResult(data);

    expect(result).toEqual({
      totalRequested: 2,
      successCount: 2,
      failedCount: 0,
      results: [
        { index: 0, success: true, imageId: 'img-1' },
        { index: 1, success: true, imageId: 'img-2' },
      ],
    });
  });
});
