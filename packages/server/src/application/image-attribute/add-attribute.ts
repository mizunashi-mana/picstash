import {
  createImageAttribute,
  findImageAttributeByImageAndLabel,
} from '@/infra/database/image-attribute-repository.js';
import { findImageById } from '@/infra/database/image-repository.js';
import { findLabelById } from '@/infra/database/label-repository.js';
import { normalizeKeywords } from '@/shared/normalizers/index.js';

export interface AddAttributeInput {
  imageId: string;
  labelId: string;
  keywords?: string;
}

export type AddAttributeResult
  = | { success: true; attribute: Awaited<ReturnType<typeof createImageAttribute>> }
    | { success: false; error: 'INVALID_LABEL_ID' }
    | { success: false; error: 'IMAGE_NOT_FOUND' }
    | { success: false; error: 'LABEL_NOT_FOUND' }
    | { success: false; error: 'ALREADY_EXISTS' };

export async function addAttribute(
  input: AddAttributeInput,
): Promise<AddAttributeResult> {
  const { imageId, labelId, keywords } = input;

  // Validate labelId
  if (typeof labelId !== 'string' || labelId.trim().length === 0) {
    return { success: false, error: 'INVALID_LABEL_ID' };
  }

  // Validate image exists
  const image = await findImageById(imageId);
  if (image === null) {
    return { success: false, error: 'IMAGE_NOT_FOUND' };
  }

  // Validate label exists
  const label = await findLabelById(labelId);
  if (label === null) {
    return { success: false, error: 'LABEL_NOT_FOUND' };
  }

  // Check if attribute already exists
  const existing = await findImageAttributeByImageAndLabel(imageId, labelId);
  if (existing !== null) {
    return { success: false, error: 'ALREADY_EXISTS' };
  }

  const attribute = await createImageAttribute({
    imageId,
    labelId,
    keywords: normalizeKeywords(keywords),
  });

  return { success: true, attribute };
}
