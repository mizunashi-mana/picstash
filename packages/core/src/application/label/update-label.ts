import { LabelName, LABEL_NAME_MAX_LENGTH } from '@/domain/label/index.js';
import type { LabelEntity, LabelRepository } from '@/application/ports/label-repository.js';

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

export type UpdateLabelResult
  = | { success: true; label: LabelEntity }
    | { success: false; error: 'NOT_FOUND' }
    | { success: false; error: 'EMPTY_NAME' }
    | { success: false; error: 'NAME_TOO_LONG'; maxLength: number }
    | { success: false; error: 'DUPLICATE_NAME'; name: string };

export interface UpdateLabelDeps {
  labelRepository: LabelRepository;
}

export async function updateLabel(
  id: string,
  input: UpdateLabelInput,
  deps: UpdateLabelDeps,
): Promise<UpdateLabelResult> {
  const { name, color } = input;
  const { labelRepository } = deps;

  // Check if label exists
  const existing = await labelRepository.findById(id);
  if (existing === null) {
    return { success: false, error: 'NOT_FOUND' };
  }

  // Validate and check for duplicate name if provided
  let trimmedName: string | undefined;
  if (name !== undefined) {
    const validationError = LabelName.validate(name);
    if (validationError === 'EMPTY') {
      return { success: false, error: 'EMPTY_NAME' };
    }
    if (validationError === 'TOO_LONG') {
      return { success: false, error: 'NAME_TOO_LONG', maxLength: LABEL_NAME_MAX_LENGTH };
    }
    trimmedName = name.trim();

    // Check for duplicate (excluding self)
    const duplicate = await labelRepository.findByName(trimmedName);
    if (duplicate !== null && duplicate.id !== id) {
      return { success: false, error: 'DUPLICATE_NAME', name: trimmedName };
    }
  }

  const label = await labelRepository.updateById(id, {
    name: trimmedName,
    color: color?.trim(),
  });

  return { success: true, label };
}
