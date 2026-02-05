/**
 * Fetch Description API Client
 *
 * Implements DescriptionApiClient interface using fetch.
 */

import {
  imageEndpoints,
  jobsEndpoints,
  type DescriptionApiClient,
  type GenerateDescriptionJobResponse,
  type Job,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchDescriptionApiClient implements DescriptionApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async generateJob(imageId: string): Promise<GenerateDescriptionJobResponse> {
    return await this.http.post<GenerateDescriptionJobResponse>(
      imageEndpoints.generateDescription(imageId),
      {},
    );
  }

  async getJobStatus(jobId: string): Promise<Job> {
    return await this.http.get<Job>(jobsEndpoints.detail(jobId));
  }
}
