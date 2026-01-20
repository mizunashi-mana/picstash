import { apiClient } from '@/api/client';
import { buildUrl } from '@/shared/helpers';
import type {
  CreateImageAttributeInput,
  ImageAttribute,
  UpdateImageAttributeInput,
} from '@picstash/shared';

export interface Image {
  id: string;
  path: string;
  thumbnailPath: string | null;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateImageInput {
  description?: string | null;
}

/** Paginated result */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Pagination options */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export async function fetchImages(query?: string): Promise<Image[]> {
  const q = query?.trim() !== '' ? query?.trim() : undefined;
  return await apiClient<Image[]>(buildUrl('/images', { q }));
}

export async function fetchImagesPaginated(
  query?: string,
  options?: PaginationOptions,
): Promise<PaginatedResult<Image>> {
  const q = query?.trim() !== '' ? query?.trim() : undefined;
  const url = buildUrl('/images', {
    q,
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  });
  return await apiClient<PaginatedResult<Image>>(url);
}

export async function fetchImage(id: string): Promise<Image> {
  return await apiClient<Image>(`/images/${id}`);
}

export async function deleteImage(id: string): Promise<void> {
  await apiClient<undefined>(`/images/${id}`, { method: 'DELETE' });
}

export async function updateImage(
  id: string,
  input: UpdateImageInput,
): Promise<Image> {
  return await apiClient<Image>(`/images/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}/file`;
}

export function getThumbnailUrl(imageId: string): string {
  return `/api/images/${imageId}/thumbnail`;
}

// Image Attribute APIs
export async function fetchImageAttributes(
  imageId: string,
): Promise<ImageAttribute[]> {
  return await apiClient<ImageAttribute[]>(`/images/${imageId}/attributes`);
}

export async function createImageAttribute(
  imageId: string,
  input: CreateImageAttributeInput,
): Promise<ImageAttribute> {
  return await apiClient<ImageAttribute>(`/images/${imageId}/attributes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateImageAttribute(
  imageId: string,
  attributeId: string,
  input: UpdateImageAttributeInput,
): Promise<ImageAttribute> {
  return await apiClient<ImageAttribute>(
    `/images/${imageId}/attributes/${attributeId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteImageAttribute(
  imageId: string,
  attributeId: string,
): Promise<void> {
  await apiClient<undefined>(`/images/${imageId}/attributes/${attributeId}`, {
    method: 'DELETE',
  });
}

// Suggested Attributes API
export interface SuggestedKeyword {
  keyword: string;
  count: number;
}

export interface AttributeSuggestion {
  labelId: string;
  labelName: string;
  score: number;
  suggestedKeywords: SuggestedKeyword[];
}

export interface SuggestedAttributesResponse {
  imageId: string;
  suggestions: AttributeSuggestion[];
}

export async function fetchSuggestedAttributes(
  imageId: string,
  options?: { threshold?: number; limit?: number },
): Promise<SuggestedAttributesResponse> {
  const params = new URLSearchParams();
  if (options?.threshold !== undefined) {
    params.set('threshold', options.threshold.toString());
  }
  if (options?.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }
  const queryString = params.toString();
  const url = `/images/${imageId}/suggested-attributes${queryString !== '' ? `?${queryString}` : ''}`;
  return await apiClient<SuggestedAttributesResponse>(url);
}

// Generate Description API (Async Job)
export interface GenerateDescriptionJobResponse {
  jobId: string;
  status: 'queued';
  message: string;
}

export interface JobStatus {
  id: string;
  type: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: {
    description: string;
    model: string;
    usedContext?: boolean;
  };
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export async function generateDescriptionJob(
  imageId: string,
): Promise<GenerateDescriptionJobResponse> {
  return await apiClient<GenerateDescriptionJobResponse>(
    `/images/${imageId}/generate-description`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return await apiClient<JobStatus>(`/jobs/${jobId}`);
}

// Similar Images API
export interface SimilarImage {
  id: string;
  title: string;
  thumbnailPath: string | null;
  distance: number;
}

export interface SimilarImagesResponse {
  imageId: string;
  similarImages: SimilarImage[];
}

export async function fetchSimilarImages(
  imageId: string,
  options?: { limit?: number },
): Promise<SimilarImagesResponse> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set('limit', options.limit.toString());
  }
  const queryString = params.toString();
  const url = `/images/${imageId}/similar${queryString !== '' ? `?${queryString}` : ''}`;
  return await apiClient<SimilarImagesResponse>(url);
}

// Search Suggestions API
export interface SearchSuggestion {
  type: 'label' | 'keyword' | 'history';
  value: string;
  id?: string; // history ID for deletion
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

export async function fetchSearchSuggestions(
  query: string,
): Promise<SearchSuggestionsResponse> {
  if (query.trim() === '') {
    return { suggestions: [] };
  }
  return await apiClient<SearchSuggestionsResponse>(
    buildUrl('/search/suggestions', { q: query.trim() }),
  );
}

// Search History API
export interface SearchHistory {
  id: string;
  query: string;
  searchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistoryResponse {
  history: SearchHistory[];
}

export async function saveSearchHistory(query: string): Promise<SearchHistory> {
  return await apiClient<SearchHistory>('/search/history', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function fetchSearchHistory(): Promise<SearchHistoryResponse> {
  return await apiClient<SearchHistoryResponse>('/search/history');
}

export async function deleteSearchHistory(id: string): Promise<void> {
  await apiClient<undefined>(`/search/history/${id}`, { method: 'DELETE' });
}

export async function deleteAllSearchHistory(): Promise<void> {
  await apiClient<undefined>('/search/history', { method: 'DELETE' });
}
