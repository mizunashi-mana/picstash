/**
 * Fetch Jobs API Client
 *
 * Implements JobsApiClient interface using fetch.
 */

import {
  jobsEndpoints,
  type Job,
  type JobsApiClient,
  type JobsListQuery,
} from '@picstash/api';
import { type BaseHttpClient } from './base-client';

export class FetchJobsApiClient implements JobsApiClient {
  private readonly http: BaseHttpClient;

  constructor(http: BaseHttpClient) {
    this.http = http;
  }

  async list(query?: JobsListQuery): Promise<Job[]> {
    return await this.http.get<Job[]>(jobsEndpoints.list(query));
  }

  async detail(jobId: string): Promise<Job> {
    return await this.http.get<Job>(jobsEndpoints.detail(jobId));
  }
}
