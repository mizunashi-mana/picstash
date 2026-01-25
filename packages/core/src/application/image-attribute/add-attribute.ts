import { normalizeKeywords } from '@/shared/normalizers/index.js';
import { isNonEmptyString } from '@/shared/validators/index.js';
import type {
  ImageAttribute,
  ImageAttributeRepository,
} from '@/application/ports/image-attribute-repository.js';
import type { ImageRepository } from '@/application/ports/image-repository.js';
import type { LabelRepository } from '@/application/ports/label-repository.js';

export interface AddAttributeInput {
  imageId: string;
  labelId: string;
  keywords?: string;
}

export type AddAttributeResult
  = | { success: true; attribute: ImageAttribute }
    | { success: false; error: 'INVALID_LABEL_ID' }
    | { success: false; error: 'IMAGE_NOT_FOUND' }
    | { success: false; error: 'LABEL_NOT_FOUND' }
    | { success: false; error: 'ALREADY_EXISTS' };

export interface AddAttributeDeps {
  imageRepository: ImageRepository;
  labelRepository: LabelRepository;
  imageAttributeRepository: ImageAttributeRepository;
}

export async function addAttribute(
  input: AddAttributeInput,
  deps: AddAttributeDeps,
): Promise<AddAttributeResult> {
  const { imageId, labelId, keywords } = input;
  const { imageRepository, labelRepository, imageAttributeRepository } = deps;

  // Validate labelId
  if (!isNonEmptyString(labelId)) {
    return { success: false, error: 'INVALID_LABEL_ID' };
  }

  // Validate image exists
  const image = await imageRepository.findById(imageId);
  if (image === null) {
    return { success: false, error: 'IMAGE_NOT_FOUND' };
  }

  // Validate label exists
  const label = await labelRepository.findById(labelId);
  if (label === null) {
    return { success: false, error: 'LABEL_NOT_FOUND' };
  }

  // Check if attribute already exists
  const existing = await imageAttributeRepository.findByImageAndLabel(
    imageId,
    labelId,
  );
  if (existing !== null) {
    return { success: false, error: 'ALREADY_EXISTS' };
  }

  const attribute = await imageAttributeRepository.create({
    imageId,
    labelId,
    keywords: normalizeKeywords(keywords),
  });

  return { success: true, attribute };
}
