import 'reflect-metadata';
import multipart from '@fastify/multipart';
import {
  ARCHIVE_IMPORT_JOB_TYPE,
  type ArchiveSession,
  type ArchiveSessionManager,
  type ArchiveImportJobPayload,
  type ArchiveImportJobResult,
  type ImageProcessor,
  type Job,
  type JobQueue,
} from '@picstash/core';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ArchiveController } from '@/infra/http/controllers/archive-controller';

interface ErrorResponse {
  error: string;
  message?: string;
}

interface CreateArchiveResponse {
  sessionId: string;
  filename: string;
  archiveType: string;
  imageCount: number;
}

interface GetArchiveResponse {
  sessionId: string;
  filename: string;
  archiveType: string;
  imageCount: number;
  images: Array<{
    index: number;
    filename: string;
    path: string;
    size: number;
  }>;
}

interface ImportResponse {
  jobId: string;
  status: string;
  totalRequested: number;
  message: string;
}

interface JobStatusResponse {
  jobId: string;
  status: string;
  progress: number;
  totalRequested: number;
  successCount?: number;
  failedCount?: number;
  results?: Array<{
    index: number;
    success: boolean;
    imageId?: string;
    error?: string;
  }>;
  error?: string;
}

function createMockArchiveSessionManager(): ArchiveSessionManager {
  return {
    createSession: vi.fn(),
    getSession: vi.fn(),
    extractImage: vi.fn(),
    deleteSession: vi.fn(),
  };
}

function createMockImageProcessor(): ImageProcessor {
  return {
    getMetadata: vi.fn(),
    generateThumbnail: vi.fn(),
  };
}

function createMockJobQueue(): JobQueue {
  return {
    add: vi.fn(),
    getJob: vi.fn(),
    listJobs: vi.fn(),
    acquireJob: vi.fn(),
    completeJob: vi.fn(),
    failJob: vi.fn(),
    updateProgress: vi.fn(),
  };
}

function createMockArchiveSession(overrides: Partial<ArchiveSession> = {}): ArchiveSession {
  return {
    id: 'test-session-id',
    filename: 'test-archive.zip',
    archivePath: '/tmp/archives/test-archive.zip',
    archiveType: 'zip',
    imageEntries: [
      {
        index: 0,
        filename: 'image1.jpg',
        path: 'images/image1.jpg',
        size: 1024,
        isDirectory: false,
      },
      {
        index: 1,
        filename: 'image2.png',
        path: 'images/image2.png',
        size: 2048,
        isDirectory: false,
      },
    ],
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockJob<TPayload, TResult>(
  overrides: Partial<Job<TPayload, TResult>> = {},
): Job<TPayload, TResult> {
  return {
    id: 'test-job-id',
    type: ARCHIVE_IMPORT_JOB_TYPE,
    status: 'waiting',
    payload: { sessionId: 'test-session-id', indices: [0, 1] } as unknown as TPayload,
    progress: 0,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ArchiveController', () => {
  let app: FastifyInstance;
  let mockSessionManager: ArchiveSessionManager;
  let mockImageProcessor: ImageProcessor;
  let mockJobQueue: JobQueue;
  let controller: ArchiveController;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionManager = createMockArchiveSessionManager();
    mockImageProcessor = createMockImageProcessor();
    mockJobQueue = createMockJobQueue();

    controller = new ArchiveController(
      mockSessionManager,
      mockImageProcessor,
      mockJobQueue,
    );

    app = Fastify({ logger: false });
    await app.register(multipart);
    controller.registerRoutes(app);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/archives', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archives',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
        },
        payload: '------WebKitFormBoundary--\r\n',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('No file uploaded');
    });

    it('should return 201 when archive is successfully uploaded', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: true,
        session: mockSession,
      });

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const payload
        = `--${boundary}\r\n`
          + 'Content-Disposition: form-data; name="file"; filename="test.zip"\r\n'
          + 'Content-Type: application/zip\r\n\r\n'
          + 'fake zip content\r\n'
          + `--${boundary}--\r\n`;

      const response = await app.inject({
        method: 'POST',
        url: '/api/archives',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body) as CreateArchiveResponse;
      expect(body.sessionId).toBe(mockSession.id);
      expect(body.filename).toBe(mockSession.filename);
      expect(body.archiveType).toBe(mockSession.archiveType);
      expect(body.imageCount).toBe(mockSession.imageEntries.length);
    });

    it('should return 400 when archive is empty', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'EMPTY_ARCHIVE',
        message: 'Archive contains no images',
      });

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const payload
        = `--${boundary}\r\n`
          + 'Content-Disposition: form-data; name="file"; filename="empty.zip"\r\n'
          + 'Content-Type: application/zip\r\n\r\n'
          + 'fake zip content\r\n'
          + `--${boundary}--\r\n`;

      const response = await app.inject({
        method: 'POST',
        url: '/api/archives',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Archive contains no images');
    });

    it('should return 413 when file is too large', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: 'File exceeds maximum size limit',
      });

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const payload
        = `--${boundary}\r\n`
          + 'Content-Disposition: form-data; name="file"; filename="large.zip"\r\n'
          + 'Content-Type: application/zip\r\n\r\n'
          + 'fake zip content\r\n'
          + `--${boundary}--\r\n`;

      const response = await app.inject({
        method: 'POST',
        url: '/api/archives',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(413);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Payload Too Large');
    });

    it('should return 415 when format is unsupported', async () => {
      vi.mocked(mockSessionManager.createSession).mockResolvedValue({
        success: false,
        error: 'UNSUPPORTED_FORMAT',
        message: 'Unsupported archive format',
      });

      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const payload
        = `--${boundary}\r\n`
          + 'Content-Disposition: form-data; name="file"; filename="test.7z"\r\n'
          + 'Content-Type: application/x-7z-compressed\r\n\r\n'
          + 'fake 7z content\r\n'
          + `--${boundary}--\r\n`;

      const response = await app.inject({
        method: 'POST',
        url: '/api/archives',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
        },
        payload,
      });

      expect(response.statusCode).toBe(415);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Unsupported Media Type');
    });
  });

  describe('GET /api/archives/:sessionId', () => {
    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/archives/non-existent-session',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Archive session not found');
    });

    it('should return session info with images', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as GetArchiveResponse;
      expect(body.sessionId).toBe(mockSession.id);
      expect(body.filename).toBe(mockSession.filename);
      expect(body.archiveType).toBe(mockSession.archiveType);
      expect(body.imageCount).toBe(2);
      expect(body.images).toHaveLength(2);
      expect(body.images[0]).toEqual({
        index: 0,
        filename: 'image1.jpg',
        path: 'images/image1.jpg',
        size: 1024,
      });
    });
  });

  describe('GET /api/archives/:sessionId/files/:fileIndex/thumbnail', () => {
    it('should return 400 when fileIndex is not a number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/archives/test-session/files/invalid/thumbnail',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Invalid file index');
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/archives/non-existent/files/0/thumbnail',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Archive session not found');
    });

    it('should return 404 when image not found in archive', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/999/thumbnail`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found in archive');
    });

    it('should return thumbnail successfully', async () => {
      const mockSession = createMockArchiveSession();
      const mockImageBuffer = Buffer.from('fake image data');
      const mockThumbnail = Buffer.from('fake thumbnail data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(mockImageBuffer);
      vi.mocked(mockImageProcessor.generateThumbnail).mockResolvedValue(mockThumbnail);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/0/thumbnail`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['cache-control']).toBe('private, max-age=3600');
      expect(response.rawPayload).toEqual(mockThumbnail);
    });

    it('should return 500 when extraction fails', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockRejectedValue(new Error('Extraction failed'));

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/0/thumbnail`,
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to extract image from archive');
    });
  });

  describe('GET /api/archives/:sessionId/files/:fileIndex/file', () => {
    it('should return 400 when fileIndex is not a number', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/archives/test-session/files/abc/file',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('Invalid file index');
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/api/archives/non-existent/files/0/file',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Archive session not found');
    });

    it('should return 404 when image not found in archive', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/999/file`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Image not found in archive');
    });

    it('should return JPEG file with correct MIME type', async () => {
      const mockSession = createMockArchiveSession();
      const mockImageBuffer = Buffer.from('fake jpeg data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(mockImageBuffer);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/0/file`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['cache-control']).toBe('private, max-age=3600');
      expect(response.rawPayload).toEqual(mockImageBuffer);
    });

    it('should return PNG file with correct MIME type', async () => {
      const mockSession = createMockArchiveSession();
      const mockImageBuffer = Buffer.from('fake png data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(mockImageBuffer);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/1/file`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should return 500 when extraction fails', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockRejectedValue(new Error('Extraction failed'));

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/0/file`,
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to extract image from archive');
    });

    it('should return application/octet-stream for unknown file extension', async () => {
      const mockSession = createMockArchiveSession({
        imageEntries: [
          {
            index: 0,
            filename: 'image.unknown',
            path: 'images/image.unknown',
            size: 1024,
            isDirectory: false,
          },
        ],
      });
      const mockImageBuffer = Buffer.from('fake data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(mockImageBuffer);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/0/file`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/octet-stream');
    });

    it('should return application/octet-stream for file without extension', async () => {
      const mockSession = createMockArchiveSession({
        imageEntries: [
          {
            index: 0,
            filename: 'imagefile',
            path: 'images/imagefile',
            size: 1024,
            isDirectory: false,
          },
        ],
      });
      const mockImageBuffer = Buffer.from('fake data');

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockSessionManager.extractImage).mockResolvedValue(mockImageBuffer);

      const response = await app.inject({
        method: 'GET',
        url: `/api/archives/${mockSession.id}/files/0/file`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('application/octet-stream');
    });
  });

  describe('POST /api/archives/:sessionId/import', () => {
    it('should return 400 when indices is not an array', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archives/test-session/import',
        headers: { 'content-type': 'application/json' },
        payload: { indices: 'not-an-array' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('indices must be a non-empty array of numbers');
    });

    it('should return 400 when indices is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archives/test-session/import',
        headers: { 'content-type': 'application/json' },
        payload: { indices: [] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('indices must be a non-empty array of numbers');
    });

    it('should return 400 when indices contains non-integers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archives/test-session/import',
        headers: { 'content-type': 'application/json' },
        payload: { indices: [0, 1.5, 2] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('All indices must be non-negative integers');
    });

    it('should return 400 when indices contains negative numbers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archives/test-session/import',
        headers: { 'content-type': 'application/json' },
        payload: { indices: [0, -1, 2] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('All indices must be non-negative integers');
    });

    it('should return 400 when indices contains non-numbers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/archives/test-session/import',
        headers: { 'content-type': 'application/json' },
        payload: { indices: [0, 'one', 2] },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('All indices must be non-negative integers');
    });

    it('should return 404 when session not found', async () => {
      vi.mocked(mockSessionManager.getSession).mockReturnValue(undefined);

      const response = await app.inject({
        method: 'POST',
        url: '/api/archives/non-existent/import',
        headers: { 'content-type': 'application/json' },
        payload: { indices: [0, 1] },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Archive session not found');
    });

    it('should return 202 and queue import job', async () => {
      const mockSession = createMockArchiveSession();
      const mockJob = createMockJob<ArchiveImportJobPayload, ArchiveImportJobResult>();

      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockJobQueue.add).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: 'POST',
        url: `/api/archives/${mockSession.id}/import`,
        headers: { 'content-type': 'application/json' },
        payload: { indices: [0, 1] },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body) as ImportResponse;
      expect(body.jobId).toBe(mockJob.id);
      expect(body.status).toBe('waiting');
      expect(body.totalRequested).toBe(2);
      expect(body.message).toBe('Import job queued successfully');

      expect(mockJobQueue.add).toHaveBeenCalledWith(
        ARCHIVE_IMPORT_JOB_TYPE,
        { sessionId: mockSession.id, indices: [0, 1] },
      );
    });

    it('should return 500 when job queue fails', async () => {
      const mockSession = createMockArchiveSession();
      vi.mocked(mockSessionManager.getSession).mockReturnValue(mockSession);
      vi.mocked(mockJobQueue.add).mockRejectedValue(new Error('Queue error'));

      const response = await app.inject({
        method: 'POST',
        url: `/api/archives/${mockSession.id}/import`,
        headers: { 'content-type': 'application/json' },
        payload: { indices: [0, 1] },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Failed to queue archive import job');
    });
  });

  describe('GET /api/import-jobs/:jobId', () => {
    it('should return 404 when job not found', async () => {
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/non-existent-job',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Import job not found');
    });

    it('should return 404 when job type does not match', async () => {
      const wrongTypeJob = createMockJob({
        type: 'caption-job', // Wrong type
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(wrongTypeJob);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/test-job-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body) as ErrorResponse;
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Import job not found');
    });

    it('should return waiting job status', async () => {
      const mockJob = createMockJob<ArchiveImportJobPayload, ArchiveImportJobResult>({
        status: 'waiting',
        progress: 0,
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/test-job-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobStatusResponse;
      expect(body.jobId).toBe('test-job-id');
      expect(body.status).toBe('waiting');
      expect(body.progress).toBe(0);
      expect(body.totalRequested).toBe(2);
    });

    it('should return active job status with progress', async () => {
      const mockJob = createMockJob<ArchiveImportJobPayload, ArchiveImportJobResult>({
        status: 'active',
        progress: 50,
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/test-job-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobStatusResponse;
      expect(body.status).toBe('active');
      expect(body.progress).toBe(50);
    });

    it('should return completed job status with results', async () => {
      const mockJob = createMockJob<ArchiveImportJobPayload, ArchiveImportJobResult>({
        status: 'completed',
        progress: 100,
        result: {
          totalRequested: 2,
          successCount: 2,
          failedCount: 0,
          results: [
            { index: 0, success: true, imageId: 'image-1' },
            { index: 1, success: true, imageId: 'image-2' },
          ],
        },
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/test-job-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobStatusResponse;
      expect(body.status).toBe('completed');
      expect(body.progress).toBe(100);
      expect(body.successCount).toBe(2);
      expect(body.failedCount).toBe(0);
      expect(body.results).toHaveLength(2);
      expect(body.results?.[0]?.imageId).toBe('image-1');
    });

    it('should return failed job status with error', async () => {
      const mockJob = createMockJob<ArchiveImportJobPayload, ArchiveImportJobResult>({
        status: 'failed',
        progress: 50,
        error: 'Import process failed unexpectedly',
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/test-job-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobStatusResponse;
      expect(body.status).toBe('failed');
      expect(body.error).toBe('Import process failed unexpectedly');
    });

    it('should return completed job with partial failures', async () => {
      const mockJob = createMockJob<ArchiveImportJobPayload, ArchiveImportJobResult>({
        status: 'completed',
        progress: 100,
        result: {
          totalRequested: 2,
          successCount: 1,
          failedCount: 1,
          results: [
            { index: 0, success: true, imageId: 'image-1' },
            { index: 1, success: false, error: 'File corrupted' },
          ],
        },
      });
      vi.mocked(mockJobQueue.getJob).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: 'GET',
        url: '/api/import-jobs/test-job-id',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as JobStatusResponse;
      expect(body.successCount).toBe(1);
      expect(body.failedCount).toBe(1);
      expect(body.results?.[1]?.error).toBe('File corrupted');
    });
  });

  describe('DELETE /api/archives/:sessionId', () => {
    it('should delete session and return 204', async () => {
      vi.mocked(mockSessionManager.deleteSession).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/archives/test-session-id',
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe('');
      expect(mockSessionManager.deleteSession).toHaveBeenCalledWith('test-session-id');
    });

    it('should return 204 even if session does not exist', async () => {
      // deleteSession is designed to be idempotent
      vi.mocked(mockSessionManager.deleteSession).mockResolvedValue();

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/archives/non-existent-session',
      });

      expect(response.statusCode).toBe(204);
    });
  });
});
