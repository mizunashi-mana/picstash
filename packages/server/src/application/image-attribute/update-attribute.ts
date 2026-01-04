import {
  findImageAttributeById,
  updateImageAttributeById,
} from '@/infra/database/image-attribute-repository.js';
import { findImageById } from '@/infra/database/image-repository.js';
import { normalizeKeywords } from '@/shared/normalizers/index.js';

export interface UpdateAttributeInput {
  imageId: string;
  attributeId: string;
  keywords?: string;
}

export type UpdateAttributeResult
  = | { success: true; attribute: Awaited<ReturnType<typeof updateImageAttributeById>> }
    | { success: false; error: 'IMAGE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_NOT_FOUND' }
    | { success: false; error: 'ATTRIBUTE_MISMATCH' };

export async function updateAttribute(
  input: UpdateAttributeInput,
): Promise<UpdateAttributeResult> {
  const { imageId, attributeId, keywords } = input;

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

  const updatedAttribute = await updateImageAttributeById(attributeId, {
    keywords: normalizeKeywords(keywords),
  });

  return { success: true, attribute: updatedAttribute };
}
