import type { Label, LabelRepository } from '@/application/ports/label-repository.js';

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

export type UpdateLabelResult
  = | { success: true; label: Label }
    | { success: false; error: 'NOT_FOUND' }
    | { success: false; error: 'EMPTY_NAME' }
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
    trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return { success: false, error: 'EMPTY_NAME' };
    }

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
