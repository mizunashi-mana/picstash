import type { ImageAttributeRepository } from '@/application/ports/image-attribute-repository.js';

export interface DeleteAttributeInput {
  imageId: string;
  attributeId: string;
}

export type DeleteAttributeResult
  = | { success: true }
    | { success: false; error: 'ATTRIBUTE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_MISMATCH' };

export interface DeleteAttributeDeps {
  imageAttributeRepository: ImageAttributeRepository;
}

export async function deleteAttribute(
  input: DeleteAttributeInput,
  deps: DeleteAttributeDeps,
): Promise<DeleteAttributeResult> {
  const { imageId, attributeId } = input;
  const { imageAttributeRepository } = deps;

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
