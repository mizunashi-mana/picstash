import { normalizeKeywords } from '@/shared/normalizers/index.js';
import type {
  ImageAttribute,
  ImageAttributeRepository,
} from '@/application/ports/image-attribute-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';

export interface UpdateAttributeInput {
  imageId: string;
  attributeId: string;
  keywords?: string;
}

export type UpdateAttributeResult
  = | { success: true; attribute: ImageAttribute }
    | { success: false; error: 'IMAGE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_MISMATCH' };

export interface UpdateAttributeDeps {
  imageRepository: ImageRepository;
  imageAttributeRepository: ImageAttributeRepository;
}

export async function updateAttribute(
  input: UpdateAttributeInput,
  deps: UpdateAttributeDeps,
): Promise<UpdateAttributeResult> {
  const { imageId, attributeId, keywords } = input;
  const { imageRepository, imageAttributeRepository } = deps;

  // Validate image exists
  const image = await imageRepository.findById(imageId);
  if (image === null) {
    return { success: false, error: 'IMAGE_NOT_FOUND' };
  }

  // Validate attribute exists
  const attribute = await imageAttributeRepository.findById(attributeId);
  if (attribute === null) {
    return { success: false, error: 'ATTRIBUTE_NOT_FOUND' };
  }

  // Validate attribute belongs to this image
  if (attribute.imageId !== imageId) {
    return { success: false, error: 'ATTRIBUTE_MISMATCH' };
  }

  const updatedAttribute = await imageAttributeRepository.updateById(
    attributeId,
    {
      keywords: normalizeKeywords(keywords),
    },
  );

  return { success: true, attribute: updatedAttribute };
}
