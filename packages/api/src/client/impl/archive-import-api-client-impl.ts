/**
 * Archive Import API Client Implementation
 */

import {
  archivesEndpoints,
  type ArchiveSession,
  type ArchiveSessionDetail,
  type ImportJobStartResponse,
  type ImportJobStatus,
} from '@/archives.js';
import type { ArchiveImportApiClient } from '@/client/archive-import-api-client.js';
import type { HttpClient } from '@/client/http-client.js';

export function createArchiveImportApiClient(
  http: HttpClient,
): ArchiveImportApiClient {
  return {
    upload: async (file: Blob) => {
      const formData = new FormData();
      formData.append('archive', file);
      return await http.postFormData<ArchiveSession>(
        archivesEndpoints.upload,
        formData,
      );
    },

    getSession: async (sessionId: string) =>
      await http.get<ArchiveSessionDetail>(
        archivesEndpoints.session(sessionId),
      ),

    deleteSession: async (sessionId: string) => {
      await http.delete(archivesEndpoints.session(sessionId));
    },

    getThumbnailUrl: (sessionId: string, fileIndex: number) =>
      archivesEndpoints.fileThumbnail(sessionId, fileIndex),

    getImageUrl: (sessionId: string, fileIndex: number) =>
      archivesEndpoints.fileImage(sessionId, fileIndex),

    importImages: async (sessionId: string, indices: number[]) =>
      await http.post<ImportJobStartResponse>(
        archivesEndpoints.import(sessionId),
        { indices },
      ),

    getImportJobStatus: async (jobId: string) =>
      await http.get<ImportJobStatus>(archivesEndpoints.importJobStatus(jobId)),
  };
}
