import { imageEndpoints } from '@picstash/api';
import { apiClient } from '@/shared/api/client';

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
  return await apiClient<SimilarImagesResponse>(
    imageEndpoints.similar(imageId, options),
  );
}
