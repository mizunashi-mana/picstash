/**
 * Description API Client Implementation
 */

import {
  imageEndpoints,
  type GenerateDescriptionJobResponse,
} from '@/images.js';
import { jobsEndpoints, type Job } from '@/jobs.js';
import type { DescriptionApiClient } from '@/client/description-api-client.js';
import type { HttpClient } from '@/client/http-client.js';

export function createDescriptionApiClient(
  http: HttpClient,
): DescriptionApiClient {
  return {
    generateJob: async (imageId: string) =>
      await http.post<GenerateDescriptionJobResponse>(
        imageEndpoints.generateDescription(imageId),
      ),

    getJobStatus: async (jobId: string) =>
      await http.get<Job>(jobsEndpoints.detail(jobId)),
  };
}
