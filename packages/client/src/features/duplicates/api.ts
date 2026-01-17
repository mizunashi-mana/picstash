import { apiClient } from '@/api/client';

export interface DuplicateImageInfo {
  id: string;
  filename: string;
  thumbnailPath: string | null;
  createdAt: string;
  distance?: number;
}

export interface DuplicateGroup {
  original: DuplicateImageInfo;
  duplicates: DuplicateImageInfo[];
}

export interface DuplicatesResponse {
  groups: DuplicateGroup[];
  totalGroups: number;
  totalDuplicates: number;
}

export async function fetchDuplicates(
  options?: { threshold?: number },
): Promise<DuplicatesResponse> {
  const params = new URLSearchParams();
  if (options?.threshold !== undefined) {
    params.set('threshold', options.threshold.toString());
  }
  const queryString = params.toString();
  const url = `/images/duplicates${queryString !== '' ? `?${queryString}` : ''}`;
  return await apiClient<DuplicatesResponse>(url);
}

export async function deleteDuplicateImage(id: string): Promise<void> {
  await apiClient<undefined>(`/images/${id}`, { method: 'DELETE' });
}
