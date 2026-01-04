import {
  deleteImageAttributeById,
  findImageAttributeById,
} from '@/infra/database/image-attribute-repository.js';
import { findImageById } from '@/infra/database/image-repository.js';

export interface DeleteAttributeInput {
  imageId: string;
  attributeId: string;
}

export type DeleteAttributeResult
  = | { success: true }
    | { success: false; error: 'IMAGE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_MISMATCH' };

export async function deleteAttribute(
  input: DeleteAttributeInput,
): Promise<DeleteAttributeResult> {
  const { imageId, attributeId } = input;

  // Validate image exists
  const image = await findImageById(imageId);
  if (image === null) {
    return { success: false, error: 'IMAGE_NOT_FOUND' };
  }

  // Validate attribute exists
  const attribute = await findImageAttributeById(attributeId);
  if (attribute === null) {
    return { success: false, error: 'ATTRIBUTE_NOT_FOUND' };
  }

  // Validate attribute belongs to this image
  if (attribute.imageId !== imageId) {
    return { success: false, error: 'ATTRIBUTE_MISMATCH' };
  }

  await deleteImageAttributeById(attributeId);

  return { success: true };
}
