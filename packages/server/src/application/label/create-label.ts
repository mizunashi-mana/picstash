import {
  createLabel as createLabelInDb,
  findLabelByName,
} from '@/infra/database/label-repository.js';

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export type CreateLabelResult
  = | { success: true; label: Awaited<ReturnType<typeof createLabelInDb>> }
    | { success: false; error: 'EMPTY_NAME' }
    | { success: false; error: 'DUPLICATE_NAME'; name: string };

export async function createLabel(
  input: CreateLabelInput,
): Promise<CreateLabelResult> {
  const trimmedName = input.name.trim();

  if (trimmedName === '') {
    return { success: false, error: 'EMPTY_NAME' };
  }

  // Check if label with same name already exists
  const existing = await findLabelByName(trimmedName);
  if (existing !== null) {
    return { success: false, error: 'DUPLICATE_NAME', name: trimmedName };
  }

  const label = await createLabelInDb({
    name: trimmedName,
    color: input.color,
  });

  return { success: true, label };
}
