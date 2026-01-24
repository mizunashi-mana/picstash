import { describe, expect, it } from 'vitest';
import { getImageId, getJobTargetDescription, getJobTypeName } from '@/features/jobs/utils';
import type { Job } from '@/features/jobs/api';

describe('getJobTypeName', () => {
  it('should return Japanese name for caption-generation type', () => {
    expect(getJobTypeName('caption-generation')).toBe('説明文生成');
  });

  it('should return original type name for unknown types', () => {
    expect(getJobTypeName('unknown-type')).toBe('unknown-type');
  });

  it('should return original type name for empty string', () => {
    expect(getJobTypeName('')).toBe('');
  });
});

describe('getImageId', () => {
  const createJob = (payload?: unknown): Job => ({
    id: 'job-1',
    type: 'caption-generation',
    status: 'active',
    progress: 50,
    payload,
    attempts: 1,
    maxAttempts: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:00Z',
    completedAt: null,
  });

  it('should return imageId from payload', () => {
    const job = createJob({ imageId: 'img-123' });
    expect(getImageId(job)).toBe('img-123');
  });

  it('should return undefined when payload is undefined', () => {
    const job = createJob(undefined);
    expect(getImageId(job)).toBeUndefined();
  });

  it('should return undefined when payload has no imageId', () => {
    const job = createJob({ otherField: 'value' });
    expect(getImageId(job)).toBeUndefined();
  });

  it('should return undefined when payload is null', () => {
    const job = createJob(null);
    expect(getImageId(job)).toBeUndefined();
  });
});

describe('getJobTargetDescription', () => {
  const createJob = (payload?: unknown): Job => ({
    id: 'job-1',
    type: 'caption-generation',
    status: 'active',
    progress: 50,
    payload,
    attempts: 1,
    maxAttempts: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:00Z',
    completedAt: null,
  });

  it('should return truncated imageId description', () => {
    const job = createJob({ imageId: '12345678-abcd-efgh-ijkl' });
    expect(getJobTargetDescription(job)).toBe('画像 12345678...');
  });

  it('should return empty string when no imageId', () => {
    const job = createJob(undefined);
    expect(getJobTargetDescription(job)).toBe('');
  });

  it('should return empty string when payload has no imageId', () => {
    const job = createJob({ otherField: 'value' });
    expect(getJobTargetDescription(job)).toBe('');
  });
});
