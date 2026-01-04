import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';

export interface DeleteAttributeInput {
  imageId: string;
  attributeId: string;
}

export type DeleteAttributeResult
  = | { success: true }
    | { success: false; error: 'IMAGE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_MISMATCH' };

export interface DeleteAttributeDeps {
  imageRepository: ImageRepository;
  imageAttributeRepository: ImageAttributeRepository;
}

export async function deleteAttribute(
  input: DeleteAttributeInput,
  deps: DeleteAttributeDeps,
): Promise<DeleteAttributeResult> {
  const { imageId, attributeId } = input;
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

  await imageAttributeRepository.deleteById(attributeId);

  return { success: true };
}
