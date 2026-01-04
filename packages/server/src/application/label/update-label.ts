import {
  findLabelById,
  findLabelByName,
  updateLabelById,
} from '@/infra/database/label-repository.js';

export interface UpdateLabelInput {
  name?: string;
  color?: string;
}

export type UpdateLabelResult
  = | { success: true; label: Awaited<ReturnType<typeof updateLabelById>> }
    | { success: false; error: 'NOT_FOUND' }
    | { success: false; error: 'EMPTY_NAME' }
    | { success: false; error: 'DUPLICATE_NAME'; name: string };

export async function updateLabel(
  labelId: string,
  input: UpdateLabelInput,
): Promise<UpdateLabelResult> {
  const existingLabel = await findLabelById(labelId);
  if (existingLabel === null) {
    return { success: false, error: 'NOT_FOUND' };
  }

  // Validate name if provided
  if (input.name != null) {
    const trimmedName = input.name.trim();
    if (trimmedName === '') {
      return { success: false, error: 'EMPTY_NAME' };
    }

    // Check if new name conflicts with another label
    if (trimmedName !== existingLabel.name) {
      const conflicting = await findLabelByName(trimmedName);
      if (conflicting !== null) {
        return { success: false, error: 'DUPLICATE_NAME', name: trimmedName };
      }
    }
  }

  const label = await updateLabelById(labelId, {
    name: input.name?.trim(),
    color: input.color,
  });

  return { success: true, label };
}
