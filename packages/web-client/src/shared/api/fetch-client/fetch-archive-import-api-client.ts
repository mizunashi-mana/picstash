/**
 * Fetch Archive Import API Client
 *
 * Implements ArchiveImportApiClient interface using fetch.
 */

import {
  archivesEndpoints,
  type ArchiveImportApiClient,
  type ArchiveSession,
  type ArchiveSessionDetail,
  type ImportJobStartResponse,
  type ImportJobStatus,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchArchiveImportApiClient implements ArchiveImportApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async upload(file: Blob): Promise<ArchiveSession> {
    const formData = new FormData();
    formData.append('file', file);
    return await this.http.postFormData<ArchiveSession>(
      archivesEndpoints.upload,
      formData,
    );
  }

  async getSession(sessionId: string): Promise<ArchiveSessionDetail> {
    return await this.http.get<ArchiveSessionDetail>(
      archivesEndpoints.session(sessionId),
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.http.delete(archivesEndpoints.session(sessionId));
  }

  getThumbnailUrl(sessionId: string, fileIndex: number): string {
    return archivesEndpoints.fileThumbnail(sessionId, fileIndex);
  }

  getImageUrl(sessionId: string, fileIndex: number): string {
    return archivesEndpoints.fileImage(sessionId, fileIndex);
  }

  async importImages(
    sessionId: string,
    indices: number[],
  ): Promise<ImportJobStartResponse> {
    return await this.http.post<ImportJobStartResponse>(
      archivesEndpoints.import(sessionId),
      { indices },
    );
  }

  async getImportJobStatus(jobId: string): Promise<ImportJobStatus> {
    return await this.http.get<ImportJobStatus>(
      archivesEndpoints.importJobStatus(jobId),
    );
  }
}
