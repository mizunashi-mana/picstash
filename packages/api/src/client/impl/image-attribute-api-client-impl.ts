/**
 * Image Attribute API Client Implementation
 */

import { imageEndpoints } from '@/images.js';
import type { HttpClient } from '@/client/http-client.js';
import type { ImageAttributeApiClient } from '@/client/image-attribute-api-client.js';
import type {
  CreateImageAttributeInput,
  ImageAttribute,
  UpdateImageAttributeInput,
} from '@/image-attributes.js';

export function createImageAttributeApiClient(
  http: HttpClient,
): ImageAttributeApiClient {
  return {
    list: async (imageId: string) =>
      await http.get<ImageAttribute[]>(
        imageEndpoints.attributes.list(imageId),
      ),

    create: async (imageId: string, input: CreateImageAttributeInput) =>
      await http.post<ImageAttribute>(
        imageEndpoints.attributes.list(imageId),
        input,
      ),

    update: async (
      imageId: string,
      attributeId: string,
      input: UpdateImageAttributeInput,
    ) =>
      await http.put<ImageAttribute>(
        imageEndpoints.attributes.detail(imageId, attributeId),
        input,
      ),

    delete: async (imageId: string, attributeId: string) => {
      await http.delete(
        imageEndpoints.attributes.detail(imageId, attributeId),
      );
    },
  };
}
